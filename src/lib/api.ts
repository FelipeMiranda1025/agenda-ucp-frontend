/**
 * Cliente HTTP central para el backend Express del sistema de Agenda Docente UCP.
 *
 * - Lee la URL base desde VITE_API_URL (por defecto http://localhost:4000/api).
 * - Inyecta automáticamente el header Authorization con el JWT guardado
 *   en localStorage bajo la clave 'ucp_token' (definida por AuthContext).
 * - Lanza Error con el mensaje del backend si la respuesta no es 2xx.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("ucp_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error(
      (err as { message?: string }).message ?? `Error ${res.status}`
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};

/**
 * Subida de archivos (multipart/form-data).
 * No se establece Content-Type para que el browser añada el boundary correcto.
 */
export async function uploadFile<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = localStorage.getItem("ucp_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error(
      (err as { message?: string }).message ?? `Error ${res.status}`
    );
  }

  return (await res.json()) as T;
}

/** Helper para construir querystrings ignorando valores nulos/undefined. */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}
