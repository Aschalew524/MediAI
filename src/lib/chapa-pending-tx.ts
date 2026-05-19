const STORAGE_KEY = "mediai.chapa.pending_tx_ref";

/** Remember tx_ref before redirecting to Chapa (fallback if return URL loses query params). */
export function rememberPendingChapaTxRef(txRef: string): void {
  if (typeof window === "undefined" || !txRef.trim()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, txRef.trim());
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumePendingChapaTxRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)?.trim();
    sessionStorage.removeItem(STORAGE_KEY);
    return value || null;
  } catch {
    return null;
  }
}
