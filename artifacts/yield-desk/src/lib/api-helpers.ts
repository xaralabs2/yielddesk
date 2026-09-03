const API_BASE = import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL || "";

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export async function apiRequest(method: string, url: string, body?: unknown): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${method} ${url} failed with status ${res.status}`);
  }

  return res;
}

export async function defaultQueryFn({ queryKey }: { queryKey: readonly unknown[] }): Promise<unknown> {
  const url = queryKey[0] as string;
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { headers });
  if (!res.ok) {
    throw new Error(`GET ${url} failed with status ${res.status}`);
  }
  return res.json();
}
