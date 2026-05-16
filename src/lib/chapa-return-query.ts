/** Build query string from Next `searchParams` for forwarding to Chapa callback. */
export function searchRecordToQueryString(
  record: Record<string, string | string[] | undefined>,
): string {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() !== "") {
      u.set(key, value);
    } else if (Array.isArray(value) && value[0] && typeof value[0] === "string") {
      u.set(key, value[0]);
    }
  }
  return u.toString();
}

export function chapaReturnHasRefQuery(queryString: string): boolean {
  const u = new URLSearchParams(queryString);
  const tx = u.get("tx_ref")?.trim();
  const trx = u.get("trx_ref")?.trim();
  return Boolean(tx || trx);
}
