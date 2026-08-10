import { API_BASE_URL } from "../config";
import { getAuthToken } from "./authToken";

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
