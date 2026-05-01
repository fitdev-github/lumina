/**
 * KBank email parser template.
 * 
 * Use this file as a template when adding support for KBank emails.
 * Copy this file and customize the parser function for KBank's email format.
 * 
 * To register:
 * 1. Add your sender email to query.js BANK_QUERIES
 * 2. Import and register in parserRegistry.js
 * 
 * @example
 * // In parserRegistry.js:
 * import { kbankConfig } from './parsers/kbankParser.js';
 * registerParser(kbankConfig.sender, kbankConfig);
 */

import {
  extractFieldValue,
  parseThaiDate,
  parseAmount,
  extractPayloadText,
  createTransaction,
} from './shared.js';

const KBANK_SENDER = 'kbank@kbank.co.th';
const KBANK_BANK_NAME = 'KBank';

export function parseKbankEmail(rawMessage) {
  if (!rawMessage?.payload) return null;

  const { subject, body } = extractPayloadText(rawMessage.payload);

  // Customize parsing logic based on KBank's email format
  // Example patterns (customize based on actual KBank email):
  const amountRaw = extractFieldValue(body, 'จำนวนเงิน');
  if (!amountRaw) return null;

  const amount = parseAmount(amountRaw);
  if (!amount) return null;

  // Parse transaction type
  const typeRaw = extractFieldValue(body, 'ประเภท') || '';
  const type = typeRaw.includes('รายรับ') || typeRaw.includes('โอนเข้า') 
    ? 'income' 
    : 'expense';

  // Parse date
  const dateRaw = extractFieldValue(body, 'วันที่') || '';
  const date = parseThaiDate(dateRaw) || new Date().toISOString().split('T')[0];

  // Build note
  const note = [typeRaw, extractFieldValue(body, 'รายละเอียด')]
    .filter(Boolean)
    .join(' ')
    .trim()
    .substring(0, 120) || 'KBank Transaction';

  return createTransaction({
    gmailMessageId: rawMessage.id,
    amount,
    type,
    category: type === 'income' ? 'other' : 'other',
    note,
    date,
    bankName: KBANK_BANK_NAME,
    rawSubject: subject,
    confidence: 'high',
  });
}

export const kbankConfig = {
  sender: KBANK_SENDER,
  bankName: KBANK_BANK_NAME,
  parser: parseKbankEmail,
};
