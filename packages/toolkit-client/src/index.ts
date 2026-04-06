export const TOOLKIT_AUTH_URL =
  process.env.NEXT_PUBLIC_TOOLKIT_AUTH_URL?.replace(/\/+$/, "") ||
  "https://auth.deutschmark.online";

export interface ToolkitUser {
  avatar: string | null;
  id: string;
  login: string;
  name: string;
}

export class ToolkitApiError extends Error {
  data: unknown;
  status: number;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.data = data;
    this.name = "ToolkitApiError";
    this.status = status;
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(/;\s*/);
  for (const cookie of cookies) {
    if (!cookie) continue;
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!["GET", "HEAD"].includes(method)) {
    const csrfToken = readCookie("dm_csrf");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  let response: Response;

  try {
    response = await fetch(`${TOOLKIT_AUTH_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (error) {
    throw new ToolkitApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
      null,
    );
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ToolkitApiError(
      response.statusText || "Toolkit API request failed",
      response.status,
      data,
    );
  }

  return data as T;
}

export const toolkitApi = {
  delete<T>(path: string, body?: unknown) {
    return request<T>(path, {
      body: body ? JSON.stringify(body) : undefined,
      method: "DELETE",
    });
  },
  get<T>(path: string) {
    return request<T>(path);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      body: body ? JSON.stringify(body) : undefined,
      method: "POST",
    });
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      body: body ? JSON.stringify(body) : undefined,
      method: "PUT",
    });
  },
};
