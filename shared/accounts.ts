// Rules for usernames and passcodes (SPEC.md, Security rules), shared by the
// app's forms and the Worker, so both give the same answer.

export const USERNAME_RULE = "3 to 20 characters: lowercase letters, numbers, dot or underscore";
export const PASSCODE_MIN = 6;
export const PASSCODE_MAX = 64;

/** Usernames are stored lowercase, so "Martino " and "martino" are the same account. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function usernameProblem(username: string): string | null {
  return /^[a-z0-9._]{3,20}$/.test(username) ? null : `Usernames are ${USERNAME_RULE}.`;
}

/** Any characters count, so a number-only, PIN-style passcode is fine too. */
export function passcodeProblem(passcode: string): string | null {
  const length = [...passcode].length;
  if (length < PASSCODE_MIN) return `Passcodes need at least ${PASSCODE_MIN} characters.`;
  if (length > PASSCODE_MAX) return `Passcodes can have at most ${PASSCODE_MAX} characters.`;
  return null;
}
