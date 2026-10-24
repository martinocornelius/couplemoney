// Someone who opens an invite link before logging in signs up or logs in
// first, then comes back to the invite (SPEC.md, screen 5). The invite's
// address travels along as ?next=/join/<code>.

/** The invite page to go back to, from an address's ?next=, or null. Only /join/ pages are allowed. */
export function nextPage(search: string): string | null {
  const next = new URLSearchParams(search).get("next");
  return next && /^\/join\/[A-Za-z0-9-]{1,40}$/.test(next) ? next : null;
}

/** The path with ?next= added, or the path alone when there's nowhere to go back to. */
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
