/**
 * Gmail search query builder.
 * Constructs optimized queries for filtering bank notification emails.
 */

/**
 * Supported bank configurations.
 * Each bank has a unique sender email and optional additional filters.
 */
export const BANK_QUERIES = {
  scb: {
    id: 'scb',
    name: 'SCB',
    sender: 'scbeasynet@scb.co.th',
    query: 'from:scbeasynet@scb.co.th',
  },
  kbank: {
    id: 'kbank',
    name: 'KBank',
    sender: 'kbank@kbank.co.th',
    query: 'from:kbank@kbank.co.th',
  },
  ktb: {
    id: 'ktb',
    name: 'KTB',
    sender: 'alert@ktb.co.th',
    query: 'from:alert@ktb.co.th',
  },
  bbl: {
    id: 'bbl',
    name: 'BBL',
    sender: 'notify@bbl.co.th',
    query: 'from:notify@bbl.co.th',
  },
  baac: {
    id: 'baac',
    name: 'BAAC',
    sender: 'baac@baac.or.th',
    query: 'from:baac@baac.or.th',
  },
  tmb: {
    id: 'tmb',
    name: 'TMB',
    sender: 'noreply@tmbbank.com',
    query: 'from:noreply@tmbbank.com',
  },
  promptpay: {
    id: 'promptpay',
    name: 'PromptPay',
    sender: 'noreply@promptpay.co.th',
    query: 'from:noreply@promptpay.co.th',
  },
};

export const BANK_LIST = Object.values(BANK_QUERIES);

const DEFAULT_TIME_RANGE = '3m';
const MAX_MESSAGES = 200;

function formatGmailDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function buildDateFilter(fromDate, toDate) {
  if (fromDate && toDate) {
    // Add 1 day to toDate so "before" includes the entire end date
    const endDate = new Date(toDate);
    endDate.setDate(endDate.getDate() + 1);
    return `after:${formatGmailDate(fromDate)} before:${formatGmailDate(endDate)}`;
  }
  if (fromDate) {
    return `after:${formatGmailDate(fromDate)}`;
  }
  if (toDate) {
    const nextDay = new Date(toDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return `before:${formatGmailDate(nextDay)}`;
  }
  return null;
}

/**
 * Builds a Gmail search query string.
 * 
 * @param {Object} options - Query options
 * @param {string[]} [options.banks=['scb']] - Array of bank IDs to include
 * @param {string} [options.timeRange='3m'] - Time range preset (e.g., '3m', '1m', '1y')
 * @param {string} [options.fromDate] - Start date (YYYY-MM-DD)
 * @param {string} [options.toDate] - End date (YYYY-MM-DD)
 * @param {string} [options.customQuery] - Additional custom query filters
 * @returns {string} Gmail search query
 */
export function buildQuery(options = {}) {
  const {
    banks = ['scb'],
    timeRange = null,
    fromDate = null,
    toDate = null,
    customQuery = null,
  } = options;

  const bankFilters = banks
    .map(bankId => BANK_QUERIES[bankId])
    .filter(Boolean)
    .map(bank => bank.query);

  const queryParts = [...bankFilters];

  if (fromDate && toDate) {
    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) queryParts.push(dateFilter);
  } else if (timeRange) {
    queryParts.push(`newer_than:${timeRange}`);
  }

  if (customQuery) {
    queryParts.push(customQuery);
  }

  return queryParts.join(' ');
}

/**
 * Builds a query for a single bank.
 * 
 * @param {string} bankId - Bank identifier
 * @param {string} [timeRange='3m'] - Time range filter
 * @returns {string} Gmail search query
 */
export function buildSingleBankQuery(bankId, timeRange = DEFAULT_TIME_RANGE) {
  const bank = BANK_QUERIES[bankId];
  if (!bank) {
    throw new Error(`Unknown bank: ${bankId}`);
  }
  return `${bank.query} newer_than:${timeRange}`;
}

/**
 * Gets the default query for all supported banks.
 * 
 * @param {string} [timeRange='3m'] - Time range filter
 * @returns {string} Combined Gmail search query
 */
export function buildDefaultQuery(timeRange = DEFAULT_TIME_RANGE) {
  const allBankFilters = Object.values(BANK_QUERIES)
    .map(bank => `(${bank.query})`)
    .join(' OR ');

  return `(${allBankFilters}) newer_than:${timeRange}`;
}

export { DEFAULT_TIME_RANGE, MAX_MESSAGES };
