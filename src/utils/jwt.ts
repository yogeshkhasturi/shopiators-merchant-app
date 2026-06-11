/**
 * Utility helper to decode JWT session tokens in standard React Native environments
 * without external heavy binary parser dependencies.
 */

/**
 * Decodes a URL-safe Base64 string to a standard string.
 */
export function decodeBase64(str: string): string {
  // Try using Hermes' or browser's native global atob first
  if (typeof global.atob === 'function') {
    try {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return global.atob(base64);
    } catch (e) {
      console.warn('[JWT] Native atob decoding failed, falling back to manual JS decoder:', e);
    }
  }

  // Pure JavaScript Base64 decoding fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanStr = str.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let buffer = '';
  
  for (let i = 0; i < cleanStr.length; i += 4) {
    const chunk = 
      (chars.indexOf(cleanStr[i]) << 18) |
      ((i + 1 < cleanStr.length ? chars.indexOf(cleanStr[i + 1]) : 0) << 12) |
      ((i + 2 < cleanStr.length ? chars.indexOf(cleanStr[i + 2]) : 0) << 6) |
      (i + 3 < cleanStr.length ? chars.indexOf(cleanStr[i + 3]) : 0);
    
    const r1 = (chunk >> 16) & 255;
    const r2 = (chunk >> 8) & 255;
    const r3 = chunk & 255;

    buffer += String.fromCharCode(r1);
    if (i + 2 < cleanStr.length) buffer += String.fromCharCode(r2);
    if (i + 3 < cleanStr.length) buffer += String.fromCharCode(r3);
  }
  return buffer;
}

export interface DecodedSession {
  id: string;
  role: string;
  email: string;
  userName: string;
  [key: string]: any;
}

/**
 * Decodes the payload part of a JWT and returns parsed session data.
 */
export function decodeSessionToken(token: string): DecodedSession | null {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[JWT] Token does not have exactly 3 parts');
      return null;
    }
    
    const payloadEncoded = parts[1];
    const decodedStr = decodeBase64(payloadEncoded);
    
    // Parse JSON safely handling multi-byte UTF-8 character sets
    const utf8Str = decodeURIComponent(
      decodedStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(utf8Str);
  } catch (error) {
    console.error('[JWT] Failed to decode session token:', error);
    return null;
  }
}
