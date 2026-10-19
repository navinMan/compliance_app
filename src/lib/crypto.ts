import crypto from 'crypto';

export function canonicalize(obj: any) {
  // simple canonical JSON: stable sorted keys
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

export function sha256Hex(input: string | Buffer) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function hmacSha256Hex(key: string, input: string) {
  return crypto.createHmac('sha256', key).update(input).digest('hex');
}

export function signPayloadHmac(key: string, payloadObj: any) {
  const canonical = canonicalize(payloadObj);
  const hash = sha256Hex(canonical);
  const signature = hmacSha256Hex(key, hash);
  return { hash, signature };
}

export function verifyPayloadHmac(key: string, payloadObj: any, expectedHash: string, expectedSignature: string) {
  const canonical = canonicalize(payloadObj);
  const hash = sha256Hex(canonical);
  if (hash !== expectedHash) return { valid: false, reason: 'hash_mismatch' };
  const signature = hmacSha256Hex(key, hash);
  if (signature !== expectedSignature) return { valid: false, reason: 'signature_mismatch' };
  return { valid: true };
}
