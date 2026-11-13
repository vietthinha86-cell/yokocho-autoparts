import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AdminTokenPayload {
  sub: string;
  username: string;
  displayName: string;
  role: string;
}

export function getJwtSecret(override?: string): string {
  return (
    override?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "akari-yokocho-dev-jwt-secret-change-me"
  );
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signAdminToken(payload: AdminTokenPayload, secret?: string): string {
  return jwt.sign(payload, getJwtSecret(secret), {
    expiresIn: "12h",
  });
}

export function verifyAdminToken(token: string, secret?: string): AdminTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret(secret));
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as unknown as AdminTokenPayload;
}

export function createRequireAdminAuth(secret?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Yêu cầu đăng nhập quản trị (thiếu Bearer token).",
      });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();
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

