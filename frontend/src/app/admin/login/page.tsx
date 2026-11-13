"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, ShieldAlert, Wrench } from "lucide-react";
import { useState } from "react";
import { adminLogin, setStoredAdminToken } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await adminLogin(username, password);
    setLoading(false);

    if (!res.ok || !res.token) {
      setError(res.error ?? "Đăng nhập thất bại.");
      return;
    }

    setStoredAdminToken(res.token);
    router.push("/admin");
  }

  return (
    <div className="kumiko-grid relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(225,29,46,0.16),transparent_48%),radial-gradient(circle_at_80%_75%,rgba(245,158,11,0.1),transparent_45%)]" />

      <div className="yokocho-panel chamfer-md relative z-10 w-full max-w-md border-red-600/60 p-7 shadow-[0_0_60px_rgba(225,29,46,0.35)]">
        <span className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t border-l border-[#ff2e43]" />
        <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r border-b border-amber-400" />

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Về Storefront Phố Đèn Đỏ</span>
        </Link>

        <div className="mt-5 flex items-center gap-3 border-b border-red-900/45 pb-4">
          <div className="flex h-11 w-11 items-center justify-center border border-[#ff2e43]/70 bg-gradient-to-b from-[#e11d2e] to-[#7f0a17] shadow-[0_0_22px_rgba(225,29,46,0.55)]">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-amber-300 uppercase">
              <span className="font-jp">管理室</span> {"//"} Night Garage Admin
            </p>
            <h1 className="font-display text-xl font-bold text-white">
              Đăng Nhập Quản Trị Xưởng Đêm
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label htmlFor="admin-user" className="mb-1.5 block font-semibold text-zinc-300">
              Tài khoản quản trị
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-red-400" />
              <input
                id="admin-user"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-red-900/60 bg-[#090406] py-2.5 pr-3 pl-9 font-mono text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-pass" className="mb-1.5 block font-semibold text-zinc-300">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-red-400" />
              <input
                id="admin-pass"
                type="password"
                required
                placeholder="Nhập mật khẩu xưởng (mặc định dev: yokocho2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-red-900/60 bg-[#090406] py-2.5 pr-3 pl-9 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
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
            disabled={loading}
            className="chamfer-sm w-full cursor-pointer bg-gradient-to-r from-[#c81628] to-[#ff2e43] py-3 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_24px_rgba(225,29,46,0.5)] transition hover:brightness-115 disabled:opacity-50"
          >
            {loading ? "Đang xác thực JWT..." : "Vào Bảng Điều Khiển Admin"}
          </button>
        </form>

        <div className="mt-5 border-t border-red-900/40 pt-3 text-[11px] text-zinc-400">
          Tài khoản dev mặc định: <code className="text-amber-300">admin</code> /{" "}
          <code className="text-amber-300">yokocho2026</code> (có thể đổi qua{" "}
          <code className="text-zinc-300">ADMIN_USERNAME</code> &amp;{" "}
          <code className="text-zinc-300">ADMIN_PASSWORD</code> trong{" "}
          <code className="text-zinc-300">backend/.env</code>).
        </div>
      </div>
    </div>
  );
}

