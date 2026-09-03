const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("mvs_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && token) {
    localStorage.removeItem("mvs_token");
    localStorage.removeItem("mvs_session");
    window.dispatchEvent(new Event("mvs:session-expired"));
  }
  if (!response.ok)
    throw new ApiError(body.error ?? "Não foi possível concluir a operação.", response.status);
  return body as T;
}
