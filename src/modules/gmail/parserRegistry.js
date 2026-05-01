/**
 * Parser registry for bank email parsers.
 * Maps sender email addresses to their respective parser functions.
 * 
 * To add support for a new bank:
 * 1. Create a new parser file in parsers/ (e.g., kbankParser.js)
 * 2. Export a parser function and bank config
 * 3. Add the bank to the REGISTRY below
 */

import { scbConfig } from './parsers/scbParser.js';
import { ktbConfig } from './parsers/ktbParser.js';

const REGISTRY = new Map();

export function registerParser(senderEmail, config) {
  REGISTRY.set(senderEmail.toLowerCase(), config);
}

export function getParser(senderEmail) {
  return REGISTRY.get(senderEmail.toLowerCase()) || null;
}

export function getAllSenders() {
  return Array.from(REGISTRY.keys());
}

export function parseWithRegistry(rawMessage, senderEmail) {
  const config = getParser(senderEmail);
  if (!config) return null;
  return config.parser(rawMessage);
}

function initializeRegistry() {
  registerParser(scbConfig.sender, scbConfig);
  registerParser(ktbConfig.sender, ktbConfig);
  
  // Future banks can be registered here:
  // registerParser('kbank@kbank.co.th', kbankConfig);
  // registerParser('notify@bbl.co.th', bblConfig);
}

initializeRegistry();

export { scbConfig, ktbConfig };
