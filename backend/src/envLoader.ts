import fs from "node:fs";
import path from "node:path";

const ENV_FILE_PATH = path.resolve(import.meta.dirname, "../.env");

export function getEnvFilePath(): string {
  return ENV_FILE_PATH;
}

function unquoteEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function loadProjectEnv(overrideExisting = true): void {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    return;
  }
  const content = fs.readFileSync(ENV_FILE_PATH, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = unquoteEnvValue(trimmed.slice(eqIndex + 1));
    if (overrideExisting || process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

export function upsertEnvVars(updates: Record<string, string | undefined>): void {
  const existingLines = fs.existsSync(ENV_FILE_PATH)
    ? fs.readFileSync(ENV_FILE_PATH, "utf8").split(/\r?\n/)
    : ["PORT=4000", "CORS_ORIGIN=http://localhost:3000"];

  const pending = new Map<string, string>();
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) {
      pending.set(k, v.replace(/\r?\n/g, "").trim());
    }
  }

  const nextLines = existingLines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) return line;
    const key = trimmed.slice(0, eqIndex).trim();
    if (!pending.has(key)) return line;
    const val = pending.get(key) ?? "";
    pending.delete(key);
    return `${key}=${val}`;
  });

  for (const [key, val] of pending.entries()) {
    nextLines.push(`${key}=${val}`);
  }

  fs.writeFileSync(ENV_FILE_PATH, `${nextLines.join("\n").replace(/\n+$/, "")}\n`, "utf8");

  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) {
      process.env[k] = v.replace(/\r?\n/g, "").trim();
    }
  }
}

export function maskSecret(value?: string): string {
  const clean = value?.trim() ?? "";
  if (!clean) return "";
  if (clean.length <= 8) return "*".repeat(clean.length);
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

