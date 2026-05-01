/**
 * SCB Easy email parser.
 * Handles Thai SCB notification emails with Buddhist calendar dates.
 */

import {
  extractFieldValue,
  parseThaiDate,
  parseAmount,
  extractPayloadText,
  createTransaction,
} from './shared.js';

const SCB_SENDER = 'scbeasynet@scb.co.th';
const SCB_BANK_NAME = 'SCB';

const TYPE_PATTERNS = {
  income: [
    /รับโอน/i,
    /โอนเข้า/i,
    /รับเงิน/i,
    /เงินเข้า/i,
    /ได้รับเงิน/i,
    /transfer in/i,
  ],
  salary: [
    /เงินเดือน/i,
    /salary/i,
    /ค่าจ้าง/i,
  ],
  bill: [
    /ชำระ/i,
    /จ่าย/i,
    /ชำระค่า/i,
  ],
};

const CATEGORY_PATTERNS = {
  salary: [/เงินเดือน/i, /salary/i, /ค่าจ้าง/i],
  food: [/อาหาร/i, /food/i, /ร้าน/i, /delivery/i],
  transport: [/น้ำมัน/i, /รถ/i, /taxi/i, /grab/i, /bts/i, /mrt/i],
  shopping: [/ซื้อ/i, /shop/i, /ช้อป/i, /สั่งซื้อ/i],
  bills: [/ชำระค่า/i, /บิล/i, /bill/i, /ค่าไฟ/i, /ค่าน้ำ/i, /internet/i],
  utilities: [/ไฟฟ้า/i, /น้ำประปา/i, /โทรศัพท์/i, /mobile/i],
  health: [/โรงพยาบาล/i, /clinic/i, /แพทย์/i, /ยา/i, /pharmacy/i],
  investment: [/ลงทุน/i, /หุ้น/i, /กองทุน/i, /invest/i],
};

function mapTransactionType(typeText) {
  if (!typeText) return { type: 'expense', category: 'other' };

  const t = typeText.trim();

  if (TYPE_PATTERNS.salary.some(p => p.test(t))) {
    return { type: 'income', category: 'salary' };
  }

  if (TYPE_PATTERNS.income.some(p => p.test(t))) {
    return { type: 'income', category: 'other' };
  }

  if (TYPE_PATTERNS.bill.some(p => p.test(t))) {
    return { type: 'expense', category: 'bills' };
  }

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category !== 'bills' && patterns.some(p => p.test(t))) {
      return { type: 'expense', category };
    }
  }

  return { type: 'expense', category: 'other' };
}

function detectConfidence(parsed) {
  const hasAmount = parsed.amount > 0;
  const hasValidDate = parsed.date && parsed.date !== new Date().toISOString().split('T')[0];
  const hasType = parsed.type in { income: 1, expense: 1 };

  if (hasAmount && hasValidDate && hasType) return 'high';
  if (hasAmount && hasType) return 'medium';
  return 'low';
}

export function parseScbEmail(rawMessage) {
  if (!rawMessage?.payload) return null;

  const { subject, body } = extractPayloadText(rawMessage.payload);

  // Debug logging
  console.log('[SCB Parser] Message ID:', rawMessage.id);
  console.log('[SCB Parser] Subject:', subject);
  console.log('[SCB Parser] Body preview:', body.substring(0, 200));
  console.log('[SCB Parser] Has ประเภทของรายการ:', body.includes('ประเภทของรายการ'));
  console.log('[SCB Parser] Has จำนวนเงิน:', body.includes('จำนวนเงิน'));

  // Must have specific SCB transaction format markers
  if (!body.includes('ประเภทของรายการ')) {
    console.log('[SCB Parser] REJECTED: No ประเภทของรายการ');
    return null;
  }

  const amountRaw = extractFieldValue(body, 'จำนวนเงิน');
  console.log('[SCB Parser] amountRaw:', amountRaw);
  if (!amountRaw) {
    console.log('[SCB Parser] REJECTED: No amount found');
    return null;
  }

  // Amount must have บาท (Thai currency) to be a real transaction
  if (!amountRaw.includes('บาท')) {
    console.log('[SCB Parser] REJECTED: No บาท in amount');
    return null;
  }

  const amount = parseAmount(amountRaw);
  console.log('[SCB Parser] parsed amount:', amount);
  if (!amount || amount <= 0) {
    console.log('[SCB Parser] REJECTED: Invalid amount');
    return null;
  }

  // Must have valid date
  const dateRaw = extractFieldValue(body, 'วันและเวลาการทำรายการ') || '';
  console.log('[SCB Parser] dateRaw:', dateRaw);
  const date = parseThaiDate(dateRaw);
  console.log('[SCB Parser] parsed date:', date);
  if (!date) {
    console.log('[SCB Parser] REJECTED: Invalid date');
    return null;
  }

  const typeRaw = extractFieldValue(body, 'ประเภทของรายการ') || '';
  const { type, category } = mapTransactionType(typeRaw);

  const detail = extractFieldValue(body, 'รายละเอียด') || '';
  const note = [typeRaw, detail].filter(Boolean).join(' ').trim().substring(0, 120) || 'SCB Transaction';

  console.log('[SCB Parser] SUCCESS:', { amount, date, type, category });

  const baseTransaction = createTransaction({
    gmailMessageId: rawMessage.id,
    amount,
    type,
    category,
    note,
    date,
    bankName: SCB_BANK_NAME,
    rawSubject: subject,
  });

  baseTransaction.confidence = detectConfidence(baseTransaction);

  return baseTransaction;
}

export const scbConfig = {
  sender: SCB_SENDER,
  bankName: SCB_BANK_NAME,
  parser: parseScbEmail,
};
