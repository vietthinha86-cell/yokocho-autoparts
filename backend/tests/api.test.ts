import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.ts";

describe("Akari Yokocho AutoParts API", () => {
  let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
  let baseUrl = "";
  let tempDir = "";

  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yokocho-api-test-"));
    const app = createApp({
      ordersFilePath: path.join(tempDir, "orders.json"),
    });
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns health status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as { status: string };
    assert.equal(data.status, "ok");
  });

  it("filters products by category and vehicle make", async () => {
    const res = await fetch(`${baseUrl}/api/products?category=bi-fog&make=Toyota`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as { total: number; items: Array<{ id: string }> };
    assert.ok(data.total >= 1);
    assert.equal(data.items[0].id, "kuro-fog-kitsune-f30");
  });

  it("creates and retrieves an order with free shipping calculation", async () => {
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Nguyễn Minh",
        phone: "0909123456",
        vehicleInfo: "Mazda 3 2022",
        shippingAddress: "Quận 7, TP.HCM",
        items: [
          {
            productId: "akari-biled-yami-v9",
            quantity: 1,
            selectedKelvin: "5500K",
          },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      item: { orderCode: string; shippingFeeVnd: number; totalVnd: number };
    };
    assert.match(created.item.orderCode, /^YKC-/);
    assert.equal(created.item.shippingFeeVnd, 0);
    assert.equal(created.item.totalVnd, 5850000);

    const lookupRes = await fetch(`${baseUrl}/api/orders/${created.item.orderCode}`);
    assert.equal(lookupRes.status, 200);
    const fetched = (await lookupRes.json()) as { item: { customerName: string } };
    assert.equal(fetched.item.customerName, "Nguyễn Minh");
  });

  it("rejects empty checkout payload with 400", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: "A" }),
    });
    assert.equal(res.status, 400);
  });
});

