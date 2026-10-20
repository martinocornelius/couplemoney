// Small helpers for the Worker's JSON answers.

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
}

/** Errors carry a sentence the app can show as it is. */
export function fail(status: number, error: string, code?: string, headers: Record<string, string> = {}): Response {
  return json(code ? { error, code } : { error }, status, headers);
}

/** The request body as an object; anything else (empty, not JSON, a list) becomes {}. */
export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
