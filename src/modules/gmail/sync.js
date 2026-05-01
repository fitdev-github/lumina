/**
 * Gmail sync orchestrator.
 * Main entry point for syncing Gmail transactions.
 */

import { requestGmailAccessToken } from './auth.js';
import { listMessages, fetchMessages, extractSenderEmail } from './api.js';
import { buildQuery, MAX_MESSAGES } from './query.js';
import { parseWithRegistry, getAllSenders } from './parserRegistry.js';

/**
 * Progress callback type.
 * @typedef {Function} ProgressCallback
 * @param {number} current - Current progress
 * @param {number} total - Total items
 */

/**
 * Sync result object.
 * @typedef {Object} SyncResult
 * @property {Object[]} transactions - Parsed transactions
 * @property {Set<string>} alreadyImported - IDs already imported
 * @property {number} cappedAt - Max messages fetched (null if no cap)
 * @property {number} parseErrors - Number of failed parses
 */

/**
 * Syncs Gmail transactions from supported banks.
 * 
 * @param {Object} options - Sync options
 * @param {string[]} [options.banks=['scb']] - Banks to sync
 * @param {string} [options.timeRange='3m'] - Time range preset filter
 * @param {string} [options.fromDate] - Start date (YYYY-MM-DD)
 * @param {string} [options.toDate] - End date (YYYY-MM-DD)
 * @param {ProgressCallback} [options.onProgress] - Progress callback
 * @param {Function} [options.getImportedIds] - Function to get already imported IDs
 * @returns {Promise<SyncResult>}
 */
export async function syncGmailTransactions(options = {}) {
  const {
    banks = ['scb'],
    timeRange = null,
    fromDate = null,
    toDate = null,
    onProgress = null,
    getImportedIds = null,
  } = options;

  if (banks.length === 0) {
    throw new Error('Please select at least one bank');
  }

  if (getAllSenders().length === 0) {
    throw new Error('No bank parsers registered');
  }

  onProgress?.(0, 0);

  const token = await requestGmailAccessToken();

  onProgress?.(0, 1);

  const query = buildQuery({
    banks,
    timeRange,
    fromDate,
    toDate,
  });

  console.log('[Gmail Sync] Query:', query);

  const allIds = [];
  let pageToken = null;

  do {
    const { messageIds, nextPageToken } = await listMessages(token, {
      query,
      maxResults: 50,
      pageToken,
    });

    console.log('[Gmail Sync] Page result:', { messageCount: messageIds.length, nextPageToken });
    allIds.push(...messageIds);
    pageToken = nextPageToken;

    if (allIds.length >= MAX_MESSAGES) break;
    if (nextPageToken) await new Promise(r => setTimeout(r, 100));
  } while (pageToken);

  console.log('[Gmail Sync] Total message IDs found:', allIds.length);

  const ids = allIds.slice(0, MAX_MESSAGES);
  const cappedAt = allIds.length >= MAX_MESSAGES ? MAX_MESSAGES : null;

  onProgress?.(0, ids.length);

  const { messages, errors: fetchErrors } = await fetchMessages(token, ids, {
    concurrency: 10,
    delayMs: 100,
    onProgress: (current) => onProgress?.(current, ids.length),
  });

  const transactions = [];
  let parseErrors = 0;
  let skippedNotMatch = 0;
  let skippedNoParser = 0;

  for (const message of messages) {
    const senderEmail = extractSenderEmail(message);
    const parsed = parseWithRegistry(message, senderEmail);

    if (parsed) {
      transactions.push(parsed);
    } else if (senderEmail) {
      skippedNotMatch++;
    } else {
      skippedNoParser++;
    }
  }

  console.log('[Gmail Sync] Summary:', {
    totalFetched: messages.length,
    parsed: transactions.length,
    skippedNotMatch,
    skippedNoParser,
  });

  if (transactions.length > 0) {
    console.log('[Gmail Sync] Sample transactions:', transactions.slice(0, 3));
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  let alreadyImported = new Set();
  if (getImportedIds) {
    alreadyImported = await getImportedIds();
  }

  return {
    transactions,
    alreadyImported,
    cappedAt,
    parseErrors,
    fetchErrors,
    totalFetched: messages.length,
    totalMatched: allIds.length,
  };
}

/**
 * Syncs transactions for a specific bank only.
 * 
 * @param {string} bankId - Bank identifier
 * @param {Object} options - Additional options (same as syncGmailTransactions)
 * @returns {Promise<SyncResult>}
 */
export async function syncSingleBank(bankId, options = {}) {
  return syncGmailTransactions({
    ...options,
    banks: [bankId],
  });
}

/**
 * Re-parses raw Gmail messages using the parser registry.
 * Useful when adding new bank support.
 * 
 * @param {Object[]} messages - Raw Gmail messages
 * @returns {Object[]} Parsed transactions
 */
export function parseMessages(messages) {
  const transactions = [];

  for (const message of messages) {
    const senderEmail = extractSenderEmail(message);
    const parsed = parseWithRegistry(message, senderEmail);

    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}
