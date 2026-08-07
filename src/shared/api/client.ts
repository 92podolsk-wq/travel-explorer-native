import { getToken } from "@/shared/storage/token-storage";

// The backend at wayora.ru is a Next.js app whose getCurrentUser() checks an
// `Authorization: Bearer <token>` header before falling back to a cookie
// (see src/shared/server/user-auth.ts on the web repo) — RN has no cookie
// jar at all, so every call attaches the token unconditionally. CORS never
// applies to native fetch() calls, so no backend changes were needed for
// this client to work against the existing public/me endpoints.
export const API_ORIGIN = "https://wayora.ru";
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS)
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}
