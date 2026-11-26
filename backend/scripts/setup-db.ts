import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { seedDatabase } from "../prisma/seed.ts";
import { loadProjectEnv, upsertEnvVars } from "../src/envLoader.ts";

const SAFE_DB_NAME_RE = /^[a-zA-Z0-9_]{1,63}$/;

function runPrismaCli(args: string[]): void {
  const prismaCli = path.resolve(
    import.meta.dirname,
    "../node_modules/prisma/build/index.js",
  );
  const res = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: path.resolve(import.meta.dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) {
    throw new Error(`Lệnh prisma ${args.join(" ")} thất bại (exit=${String(res.status)}).`);
  }
}

function buildMaintenanceUrl(targetUrl: URL): string {
  const adminUrl = new URL(targetUrl.toString());
  adminUrl.pathname = "/postgres";
  return adminUrl.toString();
}

async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
  const parsed = new URL(databaseUrl);
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!SAFE_DB_NAME_RE.test(dbName)) {
    throw new Error(
      `Tên database "${dbName}" không hợp lệ (chỉ hỗ trợ chữ, số và dấu _).`,
    );
  }

  const maintenanceClient = new PrismaClient({
    datasources: { db: { url: buildMaintenanceUrl(parsed) } },
  });

  try {
    const existing = await maintenanceClient.$queryRaw<Array<{ exists: number }>>`
      SELECT 1 AS exists FROM pg_database WHERE datname = ${dbName}
    `;
    if (existing.length === 0) {
      console.log(`==> Tạo database PostgreSQL mới: "${dbName}"...`);
      await maintenanceClient.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`==> Đã tạo xong database "${dbName}".`);
    } else {
      console.log(`==> Database "${dbName}" đã tồn tại trên PostgreSQL.`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `==> Bỏ qua bước tạo database tự động (nếu dùng DB cloud đã tạo sẵn thì bình thường): ${msg}`,
    );
  } finally {
    await maintenanceClient.$disconnect();
  }
}

async function main(): Promise<void> {
  loadProjectEnv(true);

  const cliUrl = process.argv[2]?.trim();
  if (cliUrl) {
    upsertEnvVars({ DATABASE_URL: cliUrl });
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (
    !databaseUrl ||
    databaseUrl.includes("your_password") ||
    databaseUrl.includes("MAT_KHAU")
  ) {
    console.error(
      [
        "",
        "Chưa có DATABASE_URL hợp lệ trong backend/.env.",
        "Hãy mở file backend/.env, bỏ dấu # và điền mật khẩu PostgreSQL 18 của bạn:",
        "  DATABASE_URL=postgresql://postgres:MAT_KHAU_CUA_BAN@localhost:5432/yokocho_autoparts",
        "",
        "Hoặc truyền trực tiếp 1 lần:",
        '  npm run db:setup -- "postgresql://postgres:MAT_KHAU@localhost:5432/yokocho_autoparts"',
        "",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    console.error("DATABASE_URL phải bắt đầu bằng postgresql:// hoặc postgres://");
    process.exitCode = 1;
    return;
  }

  await ensureDatabaseExists(databaseUrl);

  console.log("==> Chạy Prisma migrate deploy...");
  runPrismaCli(["migrate", "deploy"]);

  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma);
    const [
      products,
      fitments,
      combos,
      reviews,
      customers,
      orders,
      admins,
      vouchers,
      bookings,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.vehicleFitment.count(),
      prisma.vehicleBuildCombo.count(),
      prisma.productReview.count(),
      prisma.customerUser.count(),
      prisma.order.count(),
      prisma.adminUser.count(),
      prisma.voucher.count(),
      prisma.installationBooking.count(),
    ]);

    console.log(
      `==> PostgreSQL READY: products=${products}, fitments=${fitments}, combos=${combos}, reviews=${reviews}, customers=${customers}, orders=${orders}, admins=${admins}, vouchers=${vouchers}, bookings=${bookings}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Lỗi setup database:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
