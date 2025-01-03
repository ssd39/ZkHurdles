const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function bytesToBase58(bytes: any) {
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }

  let str = '';
  while (num > 0) {
    str = ALPHABET[Number(num % BigInt(58))] + str;
    num = num / BigInt(58);
  }

  // Add leading zeros from input
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str = '1' + str;
  }

  return str;
}

export function base58ToBytes(str: any) {
  let num = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    num = num * BigInt(58) + BigInt(ALPHABET.indexOf(str[i]));
  }

  const bytes = [];
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  // Add leading zeros from input
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    bytes.unshift(0);
  }

  return bytes;
}

export function bytesToString(bytes: any) {
  // UTF-8 decoder
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(new Uint8Array(bytes));
}
