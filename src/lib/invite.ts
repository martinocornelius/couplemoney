// The invite link and the message shared with it (SPEC.md, screen 12).

import { formatHomeCode } from "../../shared/homes.ts";

/** "https://…/join/ABCD-EFGH-JKLM" for the app at this address. */
export function inviteLink(origin: string, code: string): string {
  return `${origin}/join/${formatHomeCode(code)}`;
}

/** WhatsApp-friendly: a short sentence, then the link on its own line so it stays tappable. */
export function inviteMessage(homeName: string, link: string): string {
  return `Join our home "${homeName}" on Couple Money, so we can track our money together:\n${link}`;
}
