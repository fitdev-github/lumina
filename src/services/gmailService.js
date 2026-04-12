import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/firebase/config'

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

// ── OAuth ──────────────────────────────────────────────────────────────────

export async function requestGmailAccessToken() {
  const provider = new GoogleAuthProvider()
  provider.addScope(GMAIL_SCOPE)
  // Force consent screen each time to ensure fresh access token is returned
  provider.setCustomParameters({ prompt: 'consent' })

  try {
    const result = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    if (!credential?.accessToken) {
      const err = new Error('Gmail scope was denied')
      err.code = 'gmail/scope-denied'
      throw err
    }
    return credential.accessToken
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      const e = new Error('ปิด popup ก่อนให้สิทธิ์')
      e.code = 'gmail/popup-closed'
      throw e
    }
    if (err.code === 'auth/popup-blocked') {
      const e = new Error('เบราว์เซอร์บล็อก popup — กรุณาอนุญาต popup สำหรับเว็บนี้แล้วลองใหม่')
      e.code = 'gmail/popup-blocked'
      throw e
    }
    throw err
  }
}

// ── Gmail search query ─────────────────────────────────────────────────────

export function buildGmailQuery() {
  return 'from:scbeasynet@scb.co.th newer_than:3m'
}

// ── Gmail REST helpers ─────────────────────────────────────────────────────

async function gmailFetch(accessToken, path, retries = 1) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 401) {
    const err = new Error('Gmail token หมดอายุ — กรุณาเชื่อมต่อใหม่')
    err.code = 'gmail/unauthorized'
    throw err
  }

  if (res.status === 429) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000))
      return gmailFetch(accessToken, path, retries - 1)
    }
    const err = new Error('Gmail API rate limit — กรุณาลองใหม่ภายหลัง')
    err.code = 'gmail/rate-limited'
    throw err
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error?.message || `Gmail API error ${res.status}`)
    err.code = 'gmail/api-error'
    throw err
  }

  return res.json()
}

export async function fetchGmailMessageIds(accessToken, pageToken = null) {
  const query = encodeURIComponent(buildGmailQuery())
  const tokenParam = pageToken ? `&pageToken=${pageToken}` : ''
  const data = await gmailFetch(accessToken, `/messages?q=${query}&maxResults=50${tokenParam}`)
  return {
    messageIds: (data.messages || []).map(m => m.id),
    nextPageToken: data.nextPageToken || null,
  }
}

export async function fetchGmailMessage(accessToken, messageId) {
  return gmailFetch(accessToken, `/messages/${messageId}?format=full`)
}

export async function fetchAllMatchingMessages(accessToken, onProgress) {
  const MAX_MESSAGES = 200
  const BATCH_CONCURRENCY = 10
  const PAGE_DELAY_MS = 100

  // Step 1: collect all message IDs (up to MAX_MESSAGES)
  const allIds = []
  let pageToken = null

  do {
    const { messageIds, nextPageToken } = await fetchGmailMessageIds(accessToken, pageToken)
    allIds.push(...messageIds)
    pageToken = nextPageToken
    if (allIds.length >= MAX_MESSAGES) break
    if (nextPageToken) await new Promise(r => setTimeout(r, PAGE_DELAY_MS))
  } while (pageToken)

  const ids = allIds.slice(0, MAX_MESSAGES)
  const total = ids.length
  let current = 0

  if (onProgress) onProgress(0, total)

  // Step 2: fetch messages in batches
  const messages = []
  for (let i = 0; i < ids.length; i += BATCH_CONCURRENCY) {
    const batch = ids.slice(i, i + BATCH_CONCURRENCY)
    const fetched = await Promise.all(
      batch.map(id =>
        fetchGmailMessage(accessToken, id).catch(() => null)
      )
    )
    messages.push(...fetched.filter(Boolean))
    current += batch.length
    if (onProgress) onProgress(current, total)

    if (i + BATCH_CONCURRENCY < ids.length) {
      await new Promise(r => setTimeout(r, PAGE_DELAY_MS))
    }
  }

  return { messages, cappedAt: allIds.length >= MAX_MESSAGES ? MAX_MESSAGES : null }
}

// ── Parsing utilities ──────────────────────────────────────────────────────

export function decodeGmailBody(encoded) {
  if (!encoded) return ''
  try {
    // atob gives Latin-1 bytes; Thai text is UTF-8 → must re-decode as UTF-8
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return ''
  }
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|tr|td|th|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')          // collapse horizontal whitespace only
    .replace(/\n[ \t]*/g, '\n')       // trim leading spaces per line
    .replace(/\n{3,}/g, '\n\n')       // max 2 consecutive newlines
    .trim()
}

function extractPayloadText(payload) {
  if (!payload) return { subject: '', body: '' }

  const headers = payload.headers || []
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
  const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || null

  let plainText = ''
  let htmlText = ''

  const walk = (part) => {
    if (!part) return
    const mime = part.mimeType || ''
    if (mime === 'text/plain' && part.body?.data) {
      plainText += decodeGmailBody(part.body.data)
    } else if (mime === 'text/html' && part.body?.data) {
      htmlText += decodeGmailBody(part.body.data)
    } else if (part.parts) {
      part.parts.forEach(walk)
    }
  }

  if (payload.body?.data) {
    const raw = decodeGmailBody(payload.body.data)
    if (payload.mimeType === 'text/html') htmlText = raw
    else plainText = raw
  } else {
    walk(payload)
  }

  const body = plainText || stripHtml(htmlText)
  return { subject, body, dateHeader }
}

// ── SCB Easy email format parser ──────────────────────────────────────────
// Format:
//   ประเภทของรายการ:    โอนเงินไปธนาคารอื่น
//   รายละเอียด:    จาก ธนาคารไทยพาณิชย์ ...
//   จำนวนเงิน    359.00 บาท
//   วันและเวลาการทำรายการ:    12 เม.ย. 2569 ณ 12:53:05

const THAI_MONTHS = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
  'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
  'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
}

// "12 เม.ย. 2569" → "2026-04-12"  (Buddhist year → CE)
function parseThaiDate(text) {
  const m = text.match(/(\d{1,2})\s+([\u0E00-\u0E7F.]+)\s+(\d{4})/)
  if (!m) return null
  const day = parseInt(m[1], 10)
  const month = THAI_MONTHS[m[2]]
  const ceYear = parseInt(m[3], 10) - 543
  if (!month || isNaN(ceYear)) return null
  return `${ceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Extract field value: "จำนวนเงิน    359.00 บาท" → 359.00
function extractScbField(body, fieldName) {
  // fieldName followed by optional colon + whitespace
  const pattern = new RegExp(fieldName + ':?\\s+([^\\n]+)')
  const m = body.match(pattern)
  return m ? m[1].trim() : null
}

// "โอนเงินไปธนาคารอื่น" → { type, category }
function mapScbTransactionType(typeText) {
  const t = typeText.trim()
  // Income
  if (/รับโอน|โอนเข้า|รับเงิน|เงินเข้า/.test(t)) return { type: 'income', category: 'other' }
  if (/เงินเดือน/.test(t)) return { type: 'income', category: 'salary' }
  // Expense — ชำระ
  if (/ชำระ/.test(t)) return { type: 'expense', category: 'bills' }
  // Expense — โอนออก (default)
  return { type: 'expense', category: 'other' }
}

export function parseEmailToTransaction(rawMessage) {
  if (!rawMessage?.payload) return null

  const { subject, body } = extractPayloadText(rawMessage.payload)

  // Must contain the SCB Easy field markers
  if (!body.includes('จำนวนเงิน') || !body.includes('ประเภทของรายการ')) return null

  // ── Amount ──
  const amountRaw = extractScbField(body, 'จำนวนเงิน')
  if (!amountRaw) return null
  const amountMatch = amountRaw.match(/([\d,]+(?:\.\d{1,2})?)/)
  if (!amountMatch) return null
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
  if (!amount || amount <= 0) return null

  // ── Type ──
  const typeRaw = extractScbField(body, 'ประเภทของรายการ') || ''
  const { type, category } = mapScbTransactionType(typeRaw)

  // ── Date ──
  const dateRaw = extractScbField(body, 'วันและเวลาการทำรายการ') || ''
  const date = parseThaiDate(dateRaw) || new Date().toISOString().split('T')[0]

  // ── Note: ประเภท + รายละเอียด ──
  const detail = extractScbField(body, 'รายละเอียด') || ''
  const note = typeRaw ? `${typeRaw} ${detail}`.trim().substring(0, 120) : detail.substring(0, 120)

  return {
    gmailMessageId: rawMessage.id,
    amount,
    type,
    category,
    note,
    date,
    bankName: 'SCB',
    confidence: 'high',
    rawSubject: subject,
  }
}

export function parseAllEmails(rawMessages) {
  return rawMessages
    .map(parseEmailToTransaction)
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}
