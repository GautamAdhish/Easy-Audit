const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  count?: number;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("is_audit_token");
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("auth:expired"));
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

async function getBlob(path: string): Promise<Blob> {
  const token = localStorage.getItem("is_audit_token");
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401)
      window.dispatchEvent(new Event("auth:expired"));
    throw new Error(payload.message || "Request failed");
  }

  return response.blob();
}

async function download(path: string, filename?: string): Promise<void> {
  const blob = await getBlob(path);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

export const api = {
  get: <T = any,>(path: string) => request<T>(path),
  post: <T = any,>(path: string, body?: any) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any,>(path: string, body?: any) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T = any,>(path: string) => request<T>(path, { method: "DELETE" }),
  download,
  getBlob,
};

export const resourceApi = (resource: string) => ({
  list: (query = "") =>
    api.get<any[]>(`/${resource}${query ? `?${query}` : ""}`),
  create: (body: any) => api.post(`/${resource}`, body),
  update: (id: string, body: any) => api.patch(`/${resource}/${id}`, body),
  remove: (id: string) => api.delete(`/${resource}/${id}`),
});
