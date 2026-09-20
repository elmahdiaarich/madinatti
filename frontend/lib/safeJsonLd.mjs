// JSON is not HTML escaping: a closing script tag must not reach the parser.
export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
