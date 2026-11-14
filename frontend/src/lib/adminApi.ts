import type {
  AdminAiConfigResponse,
  AdminOverviewResponse,
  AdminProfile,
  AdminReviewsResponse,
  AiAdminDraftResponse,
  AiModePreference,
  AiProviderId,
  AutoPartProduct,
  OrderRecord,
  PartCategory,
  ProductReviewRecord,
  ReviewStatus,
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

export async function requestAdminAiDraft(
  token: string,
  payload: {
    nameVi: string;
    category?: PartCategory;
    wattage?: string;
    priceVnd?: number;
  },
): Promise<{ ok: boolean; item?: AiAdminDraftResponse; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/ai/admin-generate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { item?: AiAdminDraftResponse; error?: string };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "AI không tạo được dữ liệu." };
  }
  return { ok: true, item: data.item };
}

export async function fetchAdminAiConfig(
  token: string,
): Promise<{ ok: boolean; item?: AdminAiConfigResponse; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/ai-config`, {
      headers: authHeaders(token, false),
      cache: "no-store",
    });
    const data = (await res.json()) as { item?: AdminAiConfigResponse; error?: string };
    if (!res.ok || !data.item) {
      return { ok: false, error: data.error ?? "Không tải được cấu hình AI." };
    }
    return { ok: true, item: data.item };
  } catch {
    return { ok: false, error: "Không kết nối được backend AI config." };
  }
}

export async function saveAdminAiConfig(
  token: string,
  payload: {
    aiProvider?: AiModePreference;
    geminiApiKey?: string;
    clearGeminiKey?: boolean;
    geminiModel?: string;
    openaiApiKey?: string;
    clearOpenaiKey?: boolean;
    openaiBaseUrl?: string;
    openaiModel?: string;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    ollamaVisionModel?: string;
  },
): Promise<{ ok: boolean; item?: AdminAiConfigResponse; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ai-config`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { item?: AdminAiConfigResponse; error?: string };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Lưu cấu hình AI thất bại." };
  }
  return { ok: true, item: data.item };
}

export async function testAdminAiConnection(token: string): Promise<{
  ok: boolean;
  provider?: AiProviderId;
  model?: string;
  latencyMs?: number;
  reply?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ai-test`, {
    method: "POST",
    headers: authHeaders(token, false),
  });
  const data = (await res.json()) as {
    item?: {
      ok: boolean;
      provider: AiProviderId;
      model: string;
      latencyMs: number;
      reply?: string;
      error?: string;
    };
    error?: string;
  };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Không thể test AI." };
  }
  return data.item;
}

export async function fetchAdminReviews(
  token: string,
  status: ReviewStatus | "all" = "all",
): Promise<{ ok: boolean; data?: AdminReviewsResponse; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/admin/reviews?status=${encodeURIComponent(status)}`,
      { headers: authHeaders(token, false), cache: "no-store" },
    );
    const data = (await res.json()) as AdminReviewsResponse & { error?: string };
    if (!res.ok || !Array.isArray(data.items)) {
      return { ok: false, error: data.error ?? "Không tải được danh sách đánh giá." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Không kết nối được backend kiểm duyệt đánh giá." };
  }
}

export async function updateAdminReviewStatus(
  token: string,
  id: string,
  status: ReviewStatus,
  adminNote?: string,
): Promise<{ ok: boolean; item?: ProductReviewRecord; error?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/reviews/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status, adminNote }),
    },
  );
  const data = (await res.json()) as { item?: ProductReviewRecord; error?: string };
  if (!res.ok || !data.item) {
    return { ok: false, error: data.error ?? "Cập nhật kiểm duyệt thất bại." };
  }
  return { ok: true, item: data.item };
}

export async function deleteAdminReview(
  token: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token, false),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? "Xóa đánh giá thất bại." };
  }
  return { ok: true };
}

