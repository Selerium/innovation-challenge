const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type FetchOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function api<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { method = "GET", body, headers = {} } = options;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch {
    return { success: false, error: "Network error — please check your connection and try again." };
  }

  const data = await res.json().catch(() => null);
  const bodyMsg =
    data && typeof data === "object"
      ? (data as { error?: unknown; message?: unknown }).error ??
        (data as { message?: unknown }).message
      : undefined;
  return {
    success: res.ok,
    data,
    error: res.ok ? undefined : typeof bodyMsg === "string" && bodyMsg ? bodyMsg : res.statusText,
  };
}
