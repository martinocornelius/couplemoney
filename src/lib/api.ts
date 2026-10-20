// Talks to the Worker's /api routes. Errors carry the server's sentence, ready to show.

export class ApiError extends Error {
  status: number;
  code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let whenLoggedOut: (() => void) | null = null;

/** AuthProvider sets this, so a "not logged in" answer from any route takes the app back to the landing page. */
export function onLoggedOut(handler: (() => void) | null): void {
  whenLoggedOut = handler;
}

export async function api<T>(path: string, options: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? (hasBody ? "POST" : "GET"),
      headers: hasBody ? { "content-type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Can't reach the app. Check your internet connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
  if (!response.ok) {
    if (response.status === 401 && data?.code === "not_logged_in") whenLoggedOut?.();
    throw new ApiError(response.status, data?.error ?? "Something went wrong. Please try again.", data?.code);
  }
  return data as T;
}

/** The sentence to show for any error. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}
