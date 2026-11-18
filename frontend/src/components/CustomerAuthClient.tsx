"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  loginCustomer,
  registerCustomer,
  setStoredCustomerToken,
} from "@/lib/customerApi";
import { useCustomerSession } from "@/lib/useCustomerSession";

function sanitizeRedirectTarget(raw: string | null): string {
  if (!raw) return "/tai-khoan";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/tai-khoan";
}

export function CustomerAuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer } = useCustomerSession();

  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const nextUrl = sanitizeRedirectTarget(searchParams.get("next"));

  const [mode, setMode] = useState<"login" | "register">(initialTab);
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      router.replace(nextUrl);
    }
  }, [customer, nextUrl, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await loginCustomer(identifier.trim(), loginPassword);
    setSubmitting(false);
    if (!res.ok || !res.token) {
      setError(res.error ?? "Đăng nhập thất bại.");
      return;
    }
    setStoredCustomerToken(res.token);
    router.push(nextUrl);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (regPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSubmitting(true);
    const res = await registerCustomer({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      password: regPassword,
      vehicleInfo: vehicleInfo.trim() || undefined,
      shippingAddress: shippingAddress.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok || !res.token) {
      setError(res.error ?? "Đăng ký thất bại.");
      return;
    }
    setStoredCustomerToken(res.token);
    router.push(nextUrl);
  }

  return (
    <div className="kumiko-grid relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(225,29,46,0.16),transparent_48%),radial-gradient(circle_at_82%_78%,rgba(245,158,11,0.12),transparent_45%)]" />

      <div className="yokocho-panel chamfer-md relative z-10 w-full max-w-lg border-red-600/60 p-6 shadow-[0_0_60px_rgba(225,29,46,0.35)] sm:p-8">
        <span className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t border-l border-[#ff2e43]" />
        <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r border-b border-amber-400" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về Cửa Hàng AKARI</span>
          </Link>
          <span className="font-mono text-[10px] tracking-widest text-amber-300 uppercase">
            <span className="font-jp">会員口座</span> {"//"} Thành Viên Garage
          </span>
        </div>

        <div className="mt-4 border-b border-red-900/45 pb-4">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            {mode === "login"
              ? "Đăng Nhập Tài Khoản Khách Hàng"
              : "Đăng Ký Thành Viên Xưởng Đêm"}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Lưu thông tin xe của bạn, tự điền địa chỉ giao hàng và theo dõi toàn bộ lịch sử đơn hàng.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`chamfer-sm flex cursor-pointer items-center justify-center gap-1.5 border py-2 text-xs font-bold transition ${
                mode === "login"
                  ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_18px_rgba(225,29,46,0.4)]"
                  : "border-red-900/55 bg-[#12070b] text-zinc-300 hover:border-red-500"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Đăng Nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`chamfer-sm flex cursor-pointer items-center justify-center gap-1.5 border py-2 text-xs font-bold transition ${
                mode === "register"
                  ? "border-red-400 bg-[#e11d2e] text-white shadow-[0_0_18px_rgba(225,29,46,0.4)]"
                  : "border-red-900/55 bg-[#12070b] text-zinc-300 hover:border-red-500"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Đăng Ký Mới</span>
            </button>
          </div>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-4 text-xs">
            <div>
              <label
                htmlFor="cust-identifier"
                className="mb-1.5 block font-semibold text-zinc-300"
              >
                Số điện thoại hoặc Email *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-red-400" />
                <input
                  id="cust-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="VD: 0909888777 hoặc khachhang@akari.vn"
                  className="w-full border border-red-900/60 bg-[#090406] py-2.5 pr-3 pl-9 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="cust-login-pass"
                className="mb-1.5 block font-semibold text-zinc-300"
              >
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-red-400" />
                <input
                  id="cust-login-pass"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu tài khoản"
                  className="w-full border border-red-900/60 bg-[#090406] py-2.5 pr-3 pl-9 text-xs text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 border border-red-700/70 bg-red-950/60 px-3 py-2 text-xs text-red-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="chamfer-sm w-full cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] py-3 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_24px_rgba(225,29,46,0.5)] transition hover:brightness-115 disabled:opacity-50"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng Nhập Ngay"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier("0909888777");
                setLoginPassword("yokocho2026");
                setError(null);
              }}
              className="chamfer-sm flex w-full cursor-pointer items-center justify-center gap-1.5 border border-amber-600/50 bg-amber-950/30 py-2 font-mono text-[11px] font-semibold text-amber-300 transition hover:border-amber-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Điền tài khoản khách mẫu (Minh Quân • 0909888777)</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-5 grid gap-3.5 text-xs sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-zinc-300">
                Họ và tên *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-red-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Quân"
                  className="w-full border border-red-900/60 bg-[#090406] py-2 pr-3 pl-9 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-zinc-300">
                Số điện thoại (Zalo) *
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-red-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909xxxxxx"
                  className="w-full border border-red-900/60 bg-[#090406] py-2 pr-3 pl-9 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-zinc-300">
                Email (tùy chọn)
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-red-900/60 bg-[#090406] py-2 pr-3 pl-9 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-zinc-300">
                Xe chính đang đi (lưu vào Gara của bạn)
              </label>
              <div className="relative">
                <CarFront className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-amber-400" />
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="VD: Honda Civic RS 2023 hoặc Ford Ranger 2024"
                  className="w-full border border-red-900/60 bg-[#090406] py-2 pr-3 pl-9 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-zinc-300">
                Địa chỉ giao hàng mặc định
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                  className="w-full border border-red-900/60 bg-[#090406] py-2 pr-3 pl-9 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-zinc-300">
                Mật khẩu (tối thiểu 6 ký tự) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border border-red-900/60 bg-[#090406] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-zinc-300">
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border border-red-900/60 bg-[#090406] px-3 py-2 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="sm:col-span-2 flex items-start gap-2 border border-red-700/70 bg-red-950/60 px-3 py-2 text-xs text-red-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d5e]" />
                <span>{error}</span>
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="chamfer-sm w-full cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] py-3 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_24px_rgba(225,29,46,0.5)] transition hover:brightness-115 disabled:opacity-50"
              >
                {submitting ? "Đang tạo tài khoản..." : "Tạo Tài Khoản Thành Viên"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-red-900/40 pt-3 text-[11px] text-zinc-400">
          <span>Mua nhanh không cần đăng nhập vẫn dùng bình thường tại Giỏ hàng.</span>
          <Link href="/admin/login" className="font-mono text-zinc-500 hover:text-amber-300">
            Admin Xưởng →
          </Link>
        </div>
      </div>
    </div>
  );
}
