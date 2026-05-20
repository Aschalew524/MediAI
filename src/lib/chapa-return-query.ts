/**
 * Chapa's hosted checkout page HTML-escapes the `return_url` it was given,
 * so when the browser is redirected back to our app the URL we receive
 * actually contains literal `&amp;` separators between query params (e.g.
 * `?kind=consultation&amp;bookingId=...`). Next.js parses that as two
 * params: `kind` and `amp;bookingId`. This helper rewrites a parsed key-map
 * back into a clean record by stripping any leading `amp;` from keys and
 * decoding `&amp;`-containing values, so the rest of our code can use the
 * normal canonical keys (`bookingId`, `tx_ref`, etc).
 */
function normalizeRecord(
  record: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (rawValue == null) continue;
    const key = rawKey.replace(/^amp;/, "").trim();
    if (!key) continue;
    let value: string | undefined;
    if (typeof rawValue === "string") {
      value = rawValue;
    } else if (
      Array.isArray(rawValue) &&
      rawValue[0] &&
      typeof rawValue[0] === "string"
    ) {
      value = rawValue[0];
    }
    if (!value || !value.trim()) continue;
    out[key] = value.trim();
  }
  return out;
}

/** Build a clean query string from Next `searchParams` for forwarding to the Chapa callback. */
export function searchRecordToQueryString(
  record: Record<string, string | string[] | undefined>,
): string {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeRecord(record))) {
    u.set(key, value);
  }
  return u.toString();
}

/** Parse a query string while transparently fixing `&amp;`-escaped separators. */
function parseQueryStringTolerant(queryString: string): URLSearchParams {
  // If anything still looks HTML-escaped (`&amp;`) after Next has parsed
  // the URL, fix it up before we hand it to URLSearchParams.
  const cleaned = queryString.includes("&amp;")
    ? queryString.replace(/&amp;/g, "&")
    : queryString;
  const u = new URLSearchParams(cleaned);
  // Defensively merge any leftover `amp;<key>` entries onto their bare keys.
  for (const [key, value] of Array.from(u.entries())) {
    if (key.startsWith("amp;")) {
      const real = key.slice("amp;".length);
      if (real && !u.has(real)) u.set(real, value);
      u.delete(key);
    }
  }
  return u;
}

export function chapaReturnHasRefQuery(queryString: string): boolean {
  const u = parseQueryStringTolerant(queryString);
  const tx = u.get("tx_ref")?.trim();
  const trx = u.get("trx_ref")?.trim();
  return Boolean(tx || trx);
}

/**
 * When Chapa redirects to our `return_url` without appending `tx_ref` (which
 * is common in sandbox mode), we can still finalize the payment because we
 * stamped `bookingId` into the return URL ourselves when calling `initialize`.
 * Pull it back out here so the return page can hit the auth'd finalize route.
 */
export function chapaReturnBookingId(queryString: string): string | null {
  const u = parseQueryStringTolerant(queryString);
  const id = u.get("bookingId")?.trim();
  return id && id.length > 0 ? id : null;
}

/**
 * Phase 7 — same idea as `chapaReturnBookingId`, but for the subscription
 * flow. We stamp `subscriptionId=...` into the Chapa `return_url` so even
 * if Chapa's sandbox drops `tx_ref`, the return page can still hit the
 * authenticated finalize endpoint to verify the stored txRef and flip the
 * subscription to active.
 */
export function chapaReturnSubscriptionId(queryString: string): string | null {
  const u = parseQueryStringTolerant(queryString);
  const id = u.get("subscriptionId")?.trim();
  return id && id.length > 0 ? id : null;
}
