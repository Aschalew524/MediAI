/**
 * Full page navigation to signin with a safe `from=` return path (used by `src/app/signin/page.tsx`).
 */
export function redirectToSignInWithCurrentPath(): void {
  if (typeof window === "undefined") {
    return;
  }
  const from = window.location.pathname + window.location.search;
  window.location.assign(`/signin?from=${encodeURIComponent(from)}`);
}
