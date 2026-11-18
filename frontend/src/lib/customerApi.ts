import { API_BASE_URL } from "@/lib/api";
import type {
  CustomerGarageVehicle,
  CustomerProfile,
  OrderRecord,
} from "@/types/autoparts";

export const CUSTOMER_TOKEN_STORAGE_KEY = "akari_customer_token_v1";
export const CUSTOMER_AUTH_EVENT = "akari-customer-auth-changed";

function notifyCustomerAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CUSTOMER_AUTH_EVENT));
  }
}

export function getStoredCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CUSTOMER_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCustomerToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOMER_TOKEN_STORAGE_KEY, token);
    notifyCustomerAuthChange();
  } catch {
    // Ignore storage errors gracefully
  }
}

export function clearStoredCustomerToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CUSTOMER_TOKEN_STORAGE_KEY);
    notifyCustomerAuthChange();
  } catch {
    // Ignore storage errors gracefully
  }
}

function customerHeaders(token: string, json = true): Record<string, string> {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export async function registerCustomer(payload: {
  fullName: string;
  phone?: string;
  email?: string;
  password: string;
  vehicleInfo?: string;
  shippingAddress?: string;
}): Promise<{
  ok: boolean;
  token?: string;
  customer?: CustomerProfile;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      token?: string;
      customer?: CustomerProfile;
      error?: string;
    };
    if (!res.ok || !data.token || !data.customer) {
      return { ok: false, error: data.error ?? "Đăng ký tài khoản thất bại." };
    }
    return { ok: true, token: data.token, customer: data.customer };
  } catch {
    return {
      ok: false,
      error: "Chưa kết nối được Backend API (localhost:4000) để đăng ký.",
    };
  }
}

export async function loginCustomer(
  identifier: string,
  password: string,
): Promise<{
  ok: boolean;
  token?: string;
  customer?: CustomerProfile;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = (await res.json()) as {
      token?: string;
      customer?: CustomerProfile;
      error?: string;
    };
    if (!res.ok || !data.token || !data.customer) {
      return { ok: false, error: data.error ?? "Đăng nhập thất bại." };
    }
    return { ok: true, token: data.token, customer: data.customer };
  } catch {
    return {
      ok: false,
      error: "Chưa kết nối được Backend API (localhost:4000) để đăng nhập.",
    };
  }
}

export async function fetchCustomerSession(token: string): Promise<{
  ok: boolean;
  unauthorized?: boolean;
  customer?: CustomerProfile;
  orders?: OrderRecord[];
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/me`, {
      headers: customerHeaders(token, false),
      cache: "no-store",
    });
    if (res.status === 401) {
      return { ok: false, unauthorized: true, error: "Phiên đăng nhập hết hạn." };
    }
    const data = (await res.json()) as {
      customer?: CustomerProfile;
      orders?: OrderRecord[];
      error?: string;
    };
    if (!res.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Không tải được hồ sơ khách hàng." };
    }
    return {
      ok: true,
      customer: data.customer,
      orders: Array.isArray(data.orders) ? data.orders : [],
    };
  } catch {
    return { ok: false, error: "Chưa kết nối được Backend API." };
  }
}

export async function updateCustomerProfile(
  token: string,
  payload: {
    fullName?: string;
    phone?: string | null;
    email?: string | null;
    shippingAddress?: string | null;
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<{ ok: boolean; customer?: CustomerProfile; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/me`, {
      method: "PATCH",
      headers: customerHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { customer?: CustomerProfile; error?: string };
    if (!res.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Cập nhật hồ sơ thất bại." };
    }
    notifyCustomerAuthChange();
    return { ok: true, customer: data.customer };
  } catch {
    return { ok: false, error: "Không kết nối được Backend API." };
  }
}

export async function addCustomerGarageVehicle(
  token: string,
  vehicle: Omit<CustomerGarageVehicle, "id"> & { id?: string },
): Promise<{ ok: boolean; customer?: CustomerProfile; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/garage`, {
      method: "POST",
      headers: customerHeaders(token),
      body: JSON.stringify(vehicle),
    });
    const data = (await res.json()) as { customer?: CustomerProfile; error?: string };
    if (!res.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Không thêm được xe vào gara." };
    }
    notifyCustomerAuthChange();
    return { ok: true, customer: data.customer };
  } catch {
    return { ok: false, error: "Không kết nối được Backend API." };
  }
}

export async function removeCustomerGarageVehicle(
  token: string,
  vehicleId: string,
): Promise<{ ok: boolean; customer?: CustomerProfile; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/customer/garage/${encodeURIComponent(vehicleId)}`,
      {
        method: "DELETE",
        headers: customerHeaders(token, false),
      },
    );
    const data = (await res.json()) as { customer?: CustomerProfile; error?: string };
    if (!res.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Không xóa được xe khỏi gara." };
    }
    notifyCustomerAuthChange();
    return { ok: true, customer: data.customer };
  } catch {
    return { ok: false, error: "Không kết nối được Backend API." };
  }
}
