/**
 * Gmail module barrel export.
 * Provides a clean public API for the Gmail import feature.
 */

// Auth
export { requestGmailAccessToken, hasGmailScope, GmailAuthError } from './auth.js';

// API
export { listMessages, getMessage, fetchMessages, extractSenderEmail, GmailApiError } from './api.js';

// Query
export { buildQuery, buildSingleBankQuery, buildDefaultQuery, BANK_QUERIES, BANK_LIST, DEFAULT_TIME_RANGE, MAX_MESSAGES } from './query.js';

// Sync orchestrator
export { syncGmailTransactions, syncSingleBank, parseMessages } from './sync.js';

// Parser registry
export { registerParser, getParser, getAllSenders, parseWithRegistry, scbConfig } from './parserRegistry.js';

// Parsers
export { parseScbEmail, scbConfig as scbParserConfig } from './parsers/scbParser.js';
export { THAI_MONTHS, parseThaiDate, extractFieldValue, parseAmount, decodeGmailBody, stripHtml, extractPayloadText, createTransaction } from './parsers/shared.js';
