/**
 * Gmail authentication module.
 * Handles Google OAuth popup flow with Gmail readonly scope.
 */

import { GoogleAuthProvider, signInWithPopup, getAuth, inMemoryPersistence } from 'firebase/auth';
import { auth } from '@/firebase/config';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export class GmailAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GmailAuthError';
    this.code = code;
  }
}

function createGmailProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope(GMAIL_SCOPE);
  return provider;
}

function handleAuthError(err) {
  const errorMap = {
    'auth/popup-closed-by-user': { code: 'popup-closed', message: 'ปิด popup ก่อนให้สิทธิ์' },
    'auth/cancelled-popup-request': { code: 'popup-closed', message: 'ปิด popup ก่อนให้สิทธิ์' },
    'auth/popup-blocked': { code: 'popup-blocked', message: 'เบราว์เซอร์บล็อก popup — กรุณาอนุญาต popup สำหรับเว็บนี้แล้วลองใหม่' },
    'auth/network-request-failed': { code: 'network-error', message: 'ไม่สามารถเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต' },
    'auth/too-many-requests': { code: 'rate-limited', message: 'มีการร้องขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
    'auth/user-disabled': { code: 'user-disabled', message: 'บัญชีถูกปิดใช้งาน' },
  };

  const mapped = errorMap[err.code];
  if (mapped) {
    throw new GmailAuthError(mapped.message, mapped.code);
  }

  throw new GmailAuthError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Gmail', 'unknown');
}

/**
 * Initiates Google OAuth popup and requests Gmail readonly access.
 * Uses in-memory persistence for Gmail token only - Firebase Auth session persists separately.
 * 
 * If user already authorized Gmail scope, popup closes automatically.
 * 
 * @returns {Promise<string>} Access token
 * @throws {GmailAuthError} If authentication fails
 */
export async function requestGmailAccessToken() {
  const provider = createGmailProvider();
  
  const tempAuth = getAuth();
  await tempAuth.setPersistence(inMemoryPersistence);

  try {
    const result = await signInWithPopup(tempAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new GmailAuthError(
        'Gmail scope was denied — กรุณาอนุญาตสิทธิ์ Gmail readonly',
        'scope-denied'
      );
    }

    return credential.accessToken;
  } catch (err) {
    if (err instanceof GmailAuthError) throw err;
    handleAuthError(err);
  }
}

/**
 * Checks if user has Google sign-in.
 * 
 * @param {import('firebase/auth').User|null} user - Firebase user object
 * @returns {boolean} True if user is signed in
 */
export function isUserSignedIn(user) {
  return user !== null && user !== undefined;
}
