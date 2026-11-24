import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AdminTokenPayload {
  sub: string;
  kind?: "admin";
  username: string;
  displayName: string;
  role: string;
}

export interface CustomerTokenPayload {
  sub: string;
  kind: "customer";
  fullName: string;
  phone?: string;
  email?: string;
}

export function getJwtSecret(override?: string): string {
  const configured = override?.trim() || process.env.JWT_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable must be set in production.");
  }
  return "akari-yokocho-dev-jwt-secret-change-me";
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("84") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits.replace(/\D/g, "");
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signAdminToken(payload: AdminTokenPayload, secret?: string): string {
  return jwt.sign({ ...payload, kind: "admin" }, getJwtSecret(secret), {
    expiresIn: "12h",
  });
}

export function verifyAdminToken(token: string, secret?: string): AdminTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret(secret));
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  const raw = decoded as { kind?: string };
  if (raw.kind === "customer") {
    throw new Error("Customer token cannot access admin endpoints");
  }
  return decoded as unknown as AdminTokenPayload;
}

export function signCustomerToken(
  payload: Omit<CustomerTokenPayload, "kind">,
  secret?: string,
): string {
  return jwt.sign({ ...payload, kind: "customer" }, getJwtSecret(secret), {
    expiresIn: "7d",
  });
}

export function verifyCustomerToken(
  token: string,
  secret?: string,
): CustomerTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret(secret));
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid customer token payload");
  }
  const payload = decoded as unknown as CustomerTokenPayload;
  if (payload.kind !== "customer" || !payload.sub) {
    throw new Error("Token is not a customer token");
  }
  return payload;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

export function extractOptionalCustomer(
  req: Request,
  secret?: string,
): CustomerTokenPayload | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    return verifyCustomerToken(token, secret);
  } catch {
    return null;
  }
}

export function createRequireAdminAuth(secret?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({
        error: "Yêu cầu đăng nhập quản trị (thiếu Bearer token).",
      });
      return;
    }

    try {
      const payload = verifyAdminToken(token, secret);
      res.locals.admin = payload;
      next();
    } catch {
      res.status(401).json({
        error: "Phiên đăng nhập quản trị đã hết hạn hoặc không hợp lệ.",
      });
    }
  };
}

export function createRequireCustomerAuth(secret?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({
        error: "Vui lòng đăng nhập tài khoản khách hàng để sử dụng tính năng này.",
      });
      return;
    }

    try {
      const payload = verifyCustomerToken(token, secret);
      res.locals.customer = payload;
      next();
    } catch {
      res.status(401).json({
        error: "Phiên đăng nhập khách hàng đã hết hạn hoặc không hợp lệ.",
      });
    }
  };
}

