/**
 * Krungthai NEXT email parser.
 * Handles PromptPay transfer notifications from noreply@krungthai.com.
 */

import {
  parseAmount,
  extractPayloadText,
  createTransaction,
} from './shared.js';

const KTB_SENDER = 'noreply@krungthai.com';
const KTB_BANK_NAME = 'KTB';
const BUDDHIST_YEAR_OFFSET = 543;

function extractKtbField(body, fieldName) {
  const pattern = new RegExp(`${escapeRegex(fieldName)}\\s*:?\\s*([^\\n]+)`);
  const match = body.match(pattern);
  return match ? match[1].trim() : null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseKtbDate(text) {
  if (!text) return null;

  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const thaiYear = parseInt(match[3], 10);
  const ceYear = thaiYear - BUDDHIST_YEAR_OFFSET;

  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(ceYear) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    ceYear < 1900 ||
    ceYear > 2100
  ) {
    return null;
  }

  return `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function mapKtbTransactionType(subject, body) {
  const text = `${subject} ${body}`;

  if (/รับโอน|โอนเข้า|ได้รับเงิน|เงินเข้า/i.test(text)) {
    return { type: 'income', category: 'other' };
  }

  return { type: 'expense', category: 'other' };
}

function detectConfidence({ amount, date, reference }) {
  if (amount > 0 && date && reference) return 'high';
  if (amount > 0 && date) return 'medium';
  return 'low';
}

export function parseKtbEmail(rawMessage) {
  if (!rawMessage?.payload) return null;

  const { subject, body } = extractPayloadText(rawMessage.payload);

  if (
    !body.includes('Krungthai NEXT') &&
    !body.includes('ข้อมูลการทำรายการ') &&
    !subject.includes('พร้อมเพย์')
  ) {
    return null;
  }

  if (!body.includes('ข้อมูลการทำรายการ') || !body.includes('จำนวนเงิน')) {
    return null;
  }

  const amountRaw = extractKtbField(body, 'จำนวนเงิน');
  const amount = parseAmount(amountRaw);
  if (!amount) return null;

  const dateRaw = extractKtbField(body, 'วันที่ทำรายการ');
  const date = parseKtbDate(dateRaw);
  if (!date) return null;

  const reference = extractKtbField(body, 'หมายเลขอ้างอิง') || '';
  const fromAccount = extractKtbField(body, 'เลขบัญชี') || '';
  const toPromptPayAccount = extractKtbField(body, 'ไปยังบัญชีพร้อมเพย์') || '';
  const promptPayNumber = extractKtbField(body, 'หมายเลขพร้อมเพย์') || '';
  const { type, category } = mapKtbTransactionType(subject, body);

  const note = [
    subject,
    toPromptPayAccount && `ไปยัง ${toPromptPayAccount}`,
    promptPayNumber && `พร้อมเพย์ ${promptPayNumber}`,
    reference && `อ้างอิง ${reference}`,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .substring(0, 160) || 'KTB Transaction';

  return createTransaction({
    gmailMessageId: rawMessage.id,
    amount,
    type,
    category,
    note,
    date,
    bankName: KTB_BANK_NAME,
    rawSubject: subject,
    confidence: detectConfidence({ amount, date, reference }),
    metadata: {
      reference,
      fromAccount,
      toPromptPayAccount,
      promptPayNumber,
    },
  });
}

export const ktbConfig = {
  sender: KTB_SENDER,
  bankName: KTB_BANK_NAME,
  parser: parseKtbEmail,
};
