import fs from "node:fs";
import path from "node:path";
import type { OrderRecord } from "../types.ts";

export class OrderStore {
  private readonly filePath: string;
  private orders: OrderRecord[];

  constructor(filePath: string) {
    this.filePath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.orders = this.load();
  }

  private load(): OrderRecord[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OrderRecord[]) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.orders, null, 2), "utf8");
  }

  create(order: OrderRecord): OrderRecord {
    this.orders.unshift(order);
    this.save();
    return order;
  }

  findByCode(orderCode: string): OrderRecord | undefined {
    const normalized = orderCode.trim().toUpperCase();
    return this.orders.find((o) => o.orderCode.toUpperCase() === normalized);
  }

  listRecent(limit = 20): OrderRecord[] {
    return this.orders.slice(0, limit);
  }
}

