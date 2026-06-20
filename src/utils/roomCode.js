// Excludes visually ambiguous characters (0/O, 1/I/L) to keep shared codes easy to read aloud / retype.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateRoomCode(length = 7) {
  let code = "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomValues[i] % ALPHABET.length];
  }
  return code;
}
