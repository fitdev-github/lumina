/**
 * Shared parsing utilities for bank email parsers.
 * Contains common Thai date parsing, text extraction, and body decoding functions.
 */

export const THAI_MONTHS = {
  'ม.ค.': 1,  'มกรา': 1,  'มกราคม': 1,
  'ก.พ.': 2,  'กุมภา': 2,  'กุมภาพันธ์': 2,
  'มี.ค.': 3,  'มีนา': 3,  'มีนาคม': 3,
  'เม.ย.': 4,  'เมษา': 4,  'เมษายน': 4,
  'พ.ค.': 5,  'พฤษภา': 5,  'พฤษภาคม': 5,
  'มิ.ย.': 6,  'มิถุนา': 6,  'มิถุนายน': 6,
  'ก.ค.': 7,  'กรกฎา': 7,  'กรกฎาคม': 7,
  'ส.ค.': 8,  'สิงหา': 8,  'สิงหาคม': 8,
  'ก.ย.': 9,  'กันยา': 9,  'กันยายน': 9,
  'ต.ค.': 10, 'ตุลา': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พฤศจิกา': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธันวา': 12, 'ธันวาคม': 12,
};

const BUDDHIST_YEAR_OFFSET = 543;

export function parseThaiDate(text) {
  if (!text) return null;

  const m = text.match(/(\d{1,2})\s+([\u0E00-\u0E7F\u002E\u0E4F]+)\s+(\d{4})/);
  if (!m) {
    console.log('[parseThaiDate] No match, text:', text);
    return null;
  }

  const day = parseInt(m[1], 10);
  const monthStr = m[2].trim();
  const thaiYear = parseInt(m[3], 10);

  // Normalize: convert Thai mid-dot (U+0E4F) and other dots to ASCII dot
  const normalizedMonth = monthStr.replace(/\u0E4F/g, '.').replace(/[·∙•٫]/g, '.');

  const month = THAI_MONTHS[normalizedMonth];
  if (!month) {
    console.log('[parseThaiDate] Unknown month:', monthStr, '-> normalized:', normalizedMonth);
    console.log('[parseThaiDate] THAI_MONTHS keys:', Object.keys(THAI_MONTHS));
    return null;
  }

  const ceYear = thaiYear - BUDDHIST_YEAR_OFFSET;
  if (isNaN(day) || isNaN(ceYear) || ceYear < 1900 || ceYear > 2100) {
    console.log('[parseThaiDate] Invalid year:', ceYear);
    return null;
  }

  const result = `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return result;
}

export function extractFieldValue(body, fieldName) {
  const pattern = new RegExp(`${escapeRegex(fieldName)}:?\\s*([^\\n]+)`);
  const m = body.match(pattern);
  return m ? m[1].trim() : null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseAmount(amountStr) {
  if (!amountStr) return null;
  const cleaned = amountStr.replace(/,/g, '').replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

export function decodeGmailBody(encoded) {
  if (!encoded) return '';
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

export function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|tr|td|th|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractPayloadText(payload) {
  if (!payload) return { subject: '', body: '', dateHeader: null };

  const headers = payload.headers || [];
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
  const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || null;

  let plainText = '';
  let htmlText = '';

  const walk = (part) => {
    if (!part) return;
    const mime = part.mimeType || '';
    if (mime === 'text/plain' && part.body?.data) {
      plainText += decodeGmailBody(part.body.data);
    } else if (mime === 'text/html' && part.body?.data) {
      htmlText += decodeGmailBody(part.body.data);
    } else if (part.parts) {
      part.parts.forEach(walk);
    }
  };

  if (payload.body?.data) {
    const raw = decodeGmailBody(payload.body.data);
    if (payload.mimeType === 'text/html') htmlText = raw;
    else plainText = raw;
  } else {
    walk(payload);
  }

  const body = plainText || stripHtml(htmlText);
  return { subject, body, dateHeader };
}

export function createTransaction(overrides) {
  return {
    gmailMessageId: '',
    amount: 0,
    type: 'expense',
    category: 'other',
    note: '',
    date: new Date().toISOString().split('T')[0],
    bankName: 'unknown',
    confidence: 'medium',
    rawSubject: '',
    ...overrides,
  };
}
