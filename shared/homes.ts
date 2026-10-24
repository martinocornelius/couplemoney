// Rules for home names and home codes (SPEC.md, Data model), shared by the
// app's forms and the Worker, so both give the same answer.

/** Capital letters and digits without the look-alikes 0, 1, I and O: 32 characters. One-time passcodes use it too. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const HOME_CODE_LENGTH = 12;
export const HOME_NAME_MAX = 50;

export function homeNameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Give your home a name.";
  if ([...trimmed].length > HOME_NAME_MAX) return `Home names can have at most ${HOME_NAME_MAX} characters.`;
  return null;
}

/** "abcd-efgh jklm" → "ABCDEFGHJKLM": capitals, without dashes or spaces. Null when it can't be a home code. */
export function normalizeHomeCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  return code.length === HOME_CODE_LENGTH && [...code].every((char) => CODE_ALPHABET.includes(char)) ? code : null;
}

/** "ABCDEFGHJKLM" → "ABCD-EFGH-JKLM", the way the app shows a home code. */
export function formatHomeCode(code: string): string {
  return [code.slice(0, 4), code.slice(4, 8), code.slice(8)].join("-");
}
