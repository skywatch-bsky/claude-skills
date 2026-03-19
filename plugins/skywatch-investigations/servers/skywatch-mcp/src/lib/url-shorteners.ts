// pattern: Functional Core
// Pure function module for identifying known URL shortener domains

const KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "bitly.com",
  "t.co",
  "goo.gl",
  "tinyurl.com",
  "ow.ly",
  "is.gd",
  "v.gd",
  "buff.ly",
  "amzn.to",
  "youtu.be",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "cutt.ly",
]);

export function isKnownShortener(hostname: string): boolean {
  return KNOWN_SHORTENERS.has(hostname.toLowerCase());
}
