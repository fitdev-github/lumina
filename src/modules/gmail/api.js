/**
 * Gmail REST API wrapper.
 * Provides typed methods for Gmail API interactions with error handling.
 */

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export class GmailApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'GmailApiError';
    this.code = code;
    this.status = status;
  }
}

function createGmailError(res, body) {
  const message = body?.error?.message || `Gmail API error ${res.status}`;
  return new GmailApiError(message, body?.error?.code || 'api-error', res.status);
}

async function gmailFetch(accessToken, path, options = {}, retries = 1) {
  const url = `${GMAIL_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    throw new GmailApiError(
      'Gmail token หมดอายุ — กรุณาเชื่อมต่อใหม่',
      'unauthorized',
      401
    );
  }

  if (res.status === 429) {
    if (retries > 0) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
      const delay = Math.min(retryAfter * 1000, 10000);
      await new Promise(r => setTimeout(r, delay));
      return gmailFetch(accessToken, path, options, retries - 1);
    }
    throw new GmailApiError(
      'Gmail API rate limit — กรุณาลองใหม่ภายหลัง',
      'rate-limited',
      429
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw createGmailError(res, body);
  }

  return res.json();
}

/**
 * Lists Gmail message IDs matching a query.
 * 
 * @param {string} accessToken - OAuth access token
 * @param {Object} params - Query parameters
 * @param {string} params.query - Gmail search query
 * @param {number} [params.maxResults=50] - Max results per page
 * @param {string} [params.pageToken] - Pagination token
 * @returns {Promise<{messageIds: string[], nextPageToken: string|null}>}
 */
export async function listMessages(accessToken, { query, maxResults = 50, pageToken = null }) {
  const encodedQuery = encodeURIComponent(query);
  const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
  const data = await gmailFetch(
    accessToken,
    `/messages?q=${encodedQuery}&maxResults=${maxResults}${tokenParam}`
  );

  return {
    messageIds: (data.messages || []).map(m => m.id),
    nextPageToken: data.nextPageToken || null,
  };
}

/**
 * Fetches a single Gmail message with full details.
 * 
 * @param {string} accessToken - OAuth access token
 * @param {string} messageId - Gmail message ID
 * @returns {Promise<GmailMessage>} Full message object
 */
export async function getMessage(accessToken, messageId) {
  return gmailFetch(accessToken, `/messages/${messageId}?format=full`);
}

/**
 * Fetches multiple Gmail messages concurrently with progress reporting.
 * 
 * @param {string} accessToken - OAuth access token
 * @param {string[]} messageIds - Array of message IDs to fetch
 * @param {Object} options - Configuration options
 * @param {number} [options.concurrency=10] - Parallel fetch limit
 * @param {number} [options.delayMs=100] - Delay between batches
 * @param {Function} [options.onProgress] - Progress callback (current, total)
 * @returns {Promise<{messages: GmailMessage[], errors: number}>}
 */
export async function fetchMessages(accessToken, messageIds, options = {}) {
  const {
    concurrency = 10,
    delayMs = 100,
    onProgress = null,
  } = options;

  const messages = [];
  let errors = 0;
  const total = messageIds.length;

  for (let i = 0; i < messageIds.length; i += concurrency) {
    const batch = messageIds.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(id => getMessage(accessToken, id))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        messages.push(result.value);
      } else {
        errors++;
        console.warn('Failed to fetch message:', result.reason?.message);
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + concurrency, total), total);
    }

    if (i + concurrency < messageIds.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return { messages, errors };
}

/**
 * Extracts sender email from Gmail message headers.
 * 
 * @param {GmailMessage} message - Full Gmail message object
 * @returns {string} Sender email address
 */
export function extractSenderEmail(message) {
  if (!message?.payload?.headers) return '';
  const fromHeader = message.payload.headers.find(
    h => h.name.toLowerCase() === 'from'
  );
  if (!fromHeader) return '';

  const emailMatch = fromHeader.value.match(/<([^>]+)>/);
  return emailMatch ? emailMatch[1] : fromHeader.value.trim();
}
