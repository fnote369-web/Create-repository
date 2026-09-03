// Cryptographically strong, unguessable id/token generator.
// Used for user ids and session/magic-link tokens so emails never need to
// appear in URLs and tokens cannot be brute-forced.
export function generateToken(byteLength = 24) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateUserId() {
  return `u_${generateToken(12)}`;
}
