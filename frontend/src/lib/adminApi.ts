import type {
  AdminOverviewResponse,
  AdminProfile,
  AutoPartProduct,
  OrderRecord,
} from "@/types/autoparts";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

const ADMIN_TOKEN_KEY = "akari_yokocho_admin_token_v1";

export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Ignore storage issues
  }
}

export function clearStoredAdminToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

function authHeaders(token: string, json = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function adminLogin(
  username: string,
  password: string,
): Promise<{ ok: boolean; token?: string; admin?: AdminProfile; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as {
      token?: string;
      admin?: AdminProfile;
      error?: string;
    };
    if (!res.ok || !data.token || !data.admin) {
      return { ok: false, error: data.error ?? "Đăng nhập thất bại." };
    }
    return { ok: true, token: data.token, admin: data.admin };
  } catch {
    return { ok: false, error: "Không kết nối được Backend API (port 4000)." };
  }
}

export async function fetchAdminSession(
  token: string,
): Promise<{
  ok: boolean;
  admin?: AdminProfile;
  overview?: AdminOverviewResponse;
  products?: AutoPartProduct[];
  orders?: OrderRecord[];
  unauthorized?: boolean;
}> {
  try {
    const headers = authHeaders(token, false);
    const [meRes, overRes, prodRes, ordRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/auth/me`, { headers, cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/admin/overview`, { headers, cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/admin/products`, { headers, cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/admin/orders`, { headers, cache: "no-store" }),
    ]);

    if (meRes.status === 401 || overRes.status === 401) {
      return { ok: false, unauthorized: true };
    }

    if (!meRes.ok || !overRes.ok || !prodRes.ok || !ordRes.ok) {
      return { ok: false };
    }

    const meData = (await meRes.json()) as { admin: AdminProfile };
    const overview = (await overRes.json()) as AdminOverviewResponse;
    const prodData = (await prodRes.json()) as { items: AutoPartProduct[] };
    const ordData = (await ordRes.json()) as { items: OrderRecord[] };

    return {
      ok: true,
      admin: meData.admin,
      overview,
      products: prodData.items,
      orders: ordData.items,
    };
  } catch {
    return { ok: false };
  }
}

export async function createAdminProduct(
  token: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; item?: AutoPartProduct; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { item?: AutoPartProduct; error?: string };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Không thể thêm phụ tùng." };
  }
  return { ok: true, item: data.item };
}

export async function updateAdminProduct(
  token: string,
  id: string,
  patch: Partial<Pick<AutoPartProduct, "priceVnd" | "stockQty" | "stockStatus" | "nameVi" | "image">> & {
    reason?: string;
  },
): Promise<{ ok: boolean; item?: AutoPartProduct; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  });
  const data = (await res.json()) as { item?: AutoPartProduct; error?: string };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Cập nhật thất bại." };
  }
  return { ok: true, item: data.item };
}

export async function deleteAdminProduct(
  token: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token, false),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? "Xóa sản phẩm thất bại." };
  }
  return { ok: true };
}

export async function updateAdminOrderStatus(
  token: string,
  orderCode: string,
  status: OrderRecord["status"],
): Promise<{ ok: boolean; item?: OrderRecord; error?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/orders/${encodeURIComponent(orderCode)}/status`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    },
  );
  const data = (await res.json()) as { item?: OrderRecord; error?: string };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Cập nhật trạng thái thất bại." };
  }
  return { ok: true, item: data.item };
}

export async function signAdminMediaUpload(
  token: string,
  filename: string,
  contentType: string,
): Promise<{
  ok: boolean;
  item?: {
    provider: string;
    uploadUrl: string;
    publicUrl: string;
    optimization: { recommendedFormat: string; maxWidthPx: number; maxFileSizeMb: number };
  };
  error?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/api/admin/media/sign`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ filename, contentType }),
  });
  const data = (await res.json()) as {
    item?: {
      provider: string;
      uploadUrl: string;
      publicUrl: string;
      optimization: { recommendedFormat: string; maxWidthPx: number; maxFileSizeMb: number };
    };
    error?: string;
  };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Không thể ký URL upload." };
  }
  return { ok: true, item: data.item };
}

