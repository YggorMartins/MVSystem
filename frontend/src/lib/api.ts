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
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0,
    );
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && token) {
    localStorage.removeItem("mvs_token");
    localStorage.removeItem("mvs_session");
    window.dispatchEvent(new Event("mvs:session-expired"));
  }
  if (!response.ok) {
    const fallback =
      response.status === 403
        ? "Você não tem permissão para esta operação."
        : response.status >= 500
          ? "O servidor encontrou um erro. Tente novamente em instantes."
          : "Não foi possível concluir a operação.";
    throw new ApiError(body.error ?? fallback, response.status);
  }
  return body as T;
}
