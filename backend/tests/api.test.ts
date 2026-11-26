import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.ts";

describe("Akari Yokocho AutoParts API", () => {
  let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
  let baseUrl = "";
  let tempDir = "";
  let prevAiProvider: string | undefined;

  before(async () => {
    prevAiProvider = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = "local";
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
    if (prevAiProvider === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = prevAiProvider;
    }
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

  it("filters by kelvin and sorts ascending by price", async () => {
    const res = await fetch(`${baseUrl}/api/products?kelvin=3000K&sort=price_asc`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      total: number;
      items: Array<{ id: string; priceVnd: number }>;
    };
    assert.ok(data.total >= 2);
    for (let i = 1; i < data.items.length; i += 1) {
      assert.ok(data.items[i].priceVnd >= data.items[i - 1].priceVnd);
    }
  });

  it("returns curated vehicle build combos referencing catalog parts", async () => {
    const [combosRes, productsRes] = await Promise.all([
      fetch(`${baseUrl}/api/combos`),
      fetch(`${baseUrl}/api/products`),
    ]);
    assert.equal(combosRes.status, 200);
    const combosData = (await combosRes.json()) as {
      items: Array<{ id: string; productIds: string[] }>;
    };
    const productsData = (await productsRes.json()) as {
      items: Array<{ id: string }>;
    };
    const validIds = new Set(productsData.items.map((p) => p.id));
    assert.equal(combosData.items.length, 3);
    for (const combo of combosData.items) {
      assert.ok(combo.productIds.length >= 2);
      for (const pid of combo.productIds) {
        assert.ok(validIds.has(pid), `Missing product ${pid} in catalog`);
      }
    }
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

  it("applies standard shipping fee when subtotal is under 3M VND", async () => {
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Trần Tuấn",
        phone: "0912345678",
        vehicleInfo: "Toyota Vios 2021",
        shippingAddress: "Đà Nẵng",
        items: [
          {
            productId: "piaa-horn-kabuki",
            quantity: 1,
          },
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      item: { subtotalVnd: number; shippingFeeVnd: number; totalVnd: number };
    };
    assert.equal(created.item.subtotalVnd, 1150000);
    assert.equal(created.item.shippingFeeVnd, 45000);
    assert.equal(created.item.totalVnd, 1195000);
  });

  it("rejects empty checkout payload with 400", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: "A" }),
    });
    assert.equal(res.status, 400);
  });

  it("blocks unauthenticated requests to admin endpoints", async () => {
    const res = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(res.status, 401);
  });

  it("authenticates admin, creates/updates/deletes product, and updates order status", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "yokocho2026",
      }),
    });
    assert.equal(loginRes.status, 200);
    const loginData = (await loginRes.json()) as { token: string; admin: { username: string } };
    assert.ok(loginData.token.length > 20);
    assert.equal(loginData.admin.username, process.env.ADMIN_USERNAME || "admin");

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginData.token}`,
    };

    const createProdRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        sku: "YKC-TEST-99",
        nameVi: "Đèn Sương Mù Mini JDM Test",
        category: "bi-fog",
        priceVnd: 1850000,
        stockQty: 6,
      }),
    });
    assert.equal(createProdRes.status, 201);
    const createdProd = (await createProdRes.json()) as { item: { id: string; sku: string } };
    assert.equal(createdProd.item.sku, "YKC-TEST-99");

    const patchProdRes = await fetch(`${baseUrl}/api/admin/products/${createdProd.item.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        priceVnd: 1950000,
        stockQty: 12,
        reason: "Nhập thêm hàng đêm",
      }),
    });
    assert.equal(patchProdRes.status, 200);
    const updatedProd = (await patchProdRes.json()) as {
      item: { priceVnd: number; stockQty: number };
    };
    assert.equal(updatedProd.item.priceVnd, 1950000);
    assert.equal(updatedProd.item.stockQty, 12);

    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`, { headers: authHeaders });
    assert.equal(overviewRes.status, 200);
    const overview = (await overviewRes.json()) as {
      recentInventoryLogs: Array<{ sku: string; deltaQty: number }>;
    };
    assert.ok(overview.recentInventoryLogs.some((l) => l.sku === "YKC-TEST-99" && l.deltaQty === 6));

    const signRes = await fetch(`${baseUrl}/api/admin/media/sign`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        filename: "civic-beam-night.jpg",
        contentType: "image/jpeg",
      }),
    });
    assert.equal(signRes.status, 200);
    const signData = (await signRes.json()) as {
      item: { publicUrl: string; optimization: { maxWidthPx: number } };
    };
    assert.equal(signData.item.optimization.maxWidthPx, 1200);

    const delProdRes = await fetch(`${baseUrl}/api/admin/products/${createdProd.item.id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delProdRes.status, 200);

    const ordersRes = await fetch(`${baseUrl}/api/admin/orders`, { headers: authHeaders });
    assert.equal(ordersRes.status, 200);
    const ordersData = (await ordersRes.json()) as { items: Array<{ orderCode: string }> };
    assert.ok(ordersData.items.length >= 1);

    const targetCode = ordersData.items[0].orderCode;
    const patchOrderRes = await fetch(`${baseUrl}/api/admin/orders/${targetCode}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "shipping" }),
    });
    assert.equal(patchOrderRes.status, 200);
    const patchedOrder = (await patchOrderRes.json()) as { item: { status: string } };
    assert.equal(patchedOrder.item.status, "shipping");
  });

  it("verifies VietQR payment webhook HMAC signature and marks order paid", async () => {
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Lê Hoàng",
        phone: "0988777666",
        vehicleInfo: "Honda Civic 2023",
        shippingAddress: "Hà Nội",
        items: [{ productId: "piaa-horn-kabuki", quantity: 1 }],
      }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      item: { orderCode: string; totalVnd: number };
    };

    const payloadStr = JSON.stringify({
      content: `CK ${created.item.orderCode} AKARI`,
      transferAmount: created.item.totalVnd,
      referenceCode: "FT2611139999",
    });

    const badWebhookRes = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": "invalid-sig",
      },
      body: payloadStr,
    });
    assert.equal(badWebhookRes.status, 401);

    const sig = crypto
      .createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET || "yokocho-vietqr-dev-secret")
      .update(payloadStr)
      .digest("hex");

    const okWebhookRes = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": `sha256=${sig}`,
      },
      body: payloadStr,
    });
    assert.equal(okWebhookRes.status, 200);
    const paidData = (await okWebhookRes.json()) as {
      ok: boolean;
      item: { paymentStatus: string; status: string; paymentRef: string };
    };
    assert.equal(paidData.ok, true);
    assert.equal(paidData.item.paymentStatus, "paid");
    assert.equal(paidData.item.status, "packed");
    assert.equal(paidData.item.paymentRef, "FT2611139999");
  });

  it("supports accent-insensitive smart search for Vietnamese queries", async () => {
    const fogRes = await fetch(
      `${baseUrl}/api/products?q=${encodeURIComponent("den gam suong mu")}`,
    );
    assert.equal(fogRes.status, 200);
    const fogData = (await fogRes.json()) as { items: Array<{ id: string }> };
    assert.ok(fogData.items.some((p) => p.id === "kuro-fog-kitsune-f30"));

    const hornRes = await fetch(
      `${baseUrl}/api/products?q=${encodeURIComponent("coi xe to")}`,
    );
    assert.equal(hornRes.status, 200);
    const hornData = (await hornRes.json()) as { items: Array<{ id: string }> };
    assert.ok(hornData.items.some((p) => p.id === "piaa-horn-kabuki"));
  });

  it("provides AI garage recommendations, custom combo pricing, and admin spec generation", async () => {
    const adviseRes = await fetch(`${baseUrl}/api/ai/advise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Xe City 2021 di deo mua tam 4 trieu lap den gi khong choi?",
        drivingProfile: "mountain_rain",
      }),
    });
    assert.equal(adviseRes.status, 200);
    const adviseData = (await adviseRes.json()) as {
      item: {
        detectedVehicle?: string;
        recommendedBeamMode: string;
        recommendedProducts: Array<{ id: string }>;
        bundleTotalVnd: number;
      };
    };
    assert.ok(adviseData.item.detectedVehicle?.includes("Honda"));
    assert.equal(adviseData.item.recommendedBeamMode, "3000k");
    assert.ok(adviseData.item.recommendedProducts.length >= 1);
    assert.ok(adviseData.item.bundleTotalVnd > 0);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "yokocho2026",
      }),
    });
    const { token } = (await loginRes.json()) as { token: string };

    const genRes = await fetch(`${baseUrl}/api/ai/admin-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nameVi: "Bi-LED Akari Titan V10",
        category: "bi-led",
        wattage: "75W",
      }),
    });
    assert.equal(genRes.status, 200);
    const genData = (await genRes.json()) as {
      item: { nameJp: string; kanjiMark: string; highlights: string[] };
    };
    assert.ok(genData.item.nameJp.length > 0);
    assert.ok(genData.item.kanjiMark.length > 0);
    assert.ok(genData.item.highlights.length >= 2);
  });

  it("exposes AI engine runtime status publicly and masked config to admin", async () => {
    const pubStatusRes = await fetch(`${baseUrl}/api/ai/status`);
    assert.equal(pubStatusRes.status, 200);
    const pubStatus = (await pubStatusRes.json()) as {
      item: { activeProvider: string; modePreference: string };
    };
    assert.ok(pubStatus.item.activeProvider.length > 0);
    assert.ok(pubStatus.item.modePreference.length > 0);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "yokocho2026",
      }),
    });
    const { token } = (await loginRes.json()) as { token: string };

    const cfgRes = await fetch(`${baseUrl}/api/admin/ai-config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(cfgRes.status, 200);
    const cfg = (await cfgRes.json()) as {
      item: { activeProvider: string; geminiModel: string; ollamaBaseUrl: string };
    };
    assert.ok(cfg.item.geminiModel.length > 0);
    assert.ok(cfg.item.ollamaBaseUrl.includes("11434"));
  });

  it("supports customer installation photo reviews with admin moderation workflow", async () => {
    const publicBeforeRes = await fetch(`${baseUrl}/api/reviews`);
    assert.equal(publicBeforeRes.status, 200);
    const publicBefore = (await publicBeforeRes.json()) as {
      items: Array<{ id: string; status: string }>;
      averageRating: number;
    };
    assert.ok(publicBefore.items.length >= 4);
    assert.ok(publicBefore.items.every((r) => r.status === "approved"));

    // Reject unsafe photo scheme
    const badPhotoRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "akari-biled-yami-v9",
        customerName: "Test User",
        vehicleInfo: "Civic 2022",
        rating: 5,
        comment: "Đánh giá thử với URL ảnh không hợp lệ",
        photoUrl: "javascript:alert(1)",
      }),
    });
    assert.equal(badPhotoRes.status, 400);

    // Create a valid review tied to an order created earlier in test run
    const ordersListRes = await fetch(`${baseUrl}/api/orders/NONEXISTENT-999`);
    assert.equal(ordersListRes.status, 404);

    const ordRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Hoàng Nam",
        phone: "0912000999",
        vehicleInfo: "Mazda CX-5 2024",
        shippingAddress: "Đà Nẵng",
        items: [{ productId: "akari-biled-yami-v9", quantity: 1 }],
      }),
    });
    const ordData = (await ordRes.json()) as { item: { orderCode: string } };

    const submitRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "akari-biled-yami-v9",
        customerName: "Hoàng Nam",
        vehicleInfo: "Mazda CX-5 2024",
        rating: 5,
        title: "Ánh sáng bám đường ướt cực tốt",
        comment: "Mình vừa nhận đèn lắp trên CX-5, mặt cắt rất đều và đẹp.",
        beamMode: "4300k",
        orderCode: ordData.item.orderCode,
        photoUrl: "/images/build-mazda3-tokyo.jpg",
      }),
    });
    assert.equal(submitRes.status, 201);
    const createdRev = (await submitRes.json()) as {
      item: { id: string; status: string; verifiedPurchase: boolean };
    };
    assert.equal(createdRev.item.status, "pending");
    assert.equal(createdRev.item.verifiedPurchase, true);

    // Must not leak to public before approval
    const publicMidRes = await fetch(`${baseUrl}/api/reviews?productId=akari-biled-yami-v9`);
    const publicMid = (await publicMidRes.json()) as { items: Array<{ id: string }> };
    assert.ok(!publicMid.items.some((r) => r.id === createdRev.item.id));

    // Admin moderates & approves review
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "yokocho2026",
      }),
    });
    const { token } = (await loginRes.json()) as { token: string };

    const adminListRes = await fetch(`${baseUrl}/api/admin/reviews?status=pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(adminListRes.status, 200);
    const adminList = (await adminListRes.json()) as {
      items: Array<{ id: string }>;
      counts: { pending: number };
    };
    assert.ok(adminList.items.some((r) => r.id === createdRev.item.id));
    assert.ok(adminList.counts.pending >= 1);

    const approveRes = await fetch(`${baseUrl}/api/admin/reviews/${createdRev.item.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "approved", adminNote: "Ảnh rõ nét" }),
    });
    assert.equal(approveRes.status, 200);

    const publicAfterRes = await fetch(`${baseUrl}/api/reviews?productId=akari-biled-yami-v9`);
    const publicAfter = (await publicAfterRes.json()) as { items: Array<{ id: string }> };
    assert.ok(publicAfter.items.some((r) => r.id === createdRev.item.id));

    const delRes = await fetch(`${baseUrl}/api/admin/reviews/${createdRev.item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delRes.status, 200);
  });

  it("supports customer registration, normalized login, My Garage, order history & token isolation", async () => {
    // 1. Guest places an order before registering
    const guestOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Anh Tuấn",
        phone: "0988 111 222",
        vehicleInfo: "Mazda CX-30 2023",
        shippingAddress: "Cầu Giấy, Hà Nội",
        items: [{ productId: "kuro-fog-kitsune-f30", quantity: 1 }],
      }),
    });
    assert.equal(guestOrderRes.status, 201);
    const guestOrder = (await guestOrderRes.json()) as {
      item: { orderCode: string };
    };

    // 2. Register customer with same phone (normalized) + email
    const regRes = await fetch(`${baseUrl}/api/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Anh Tuấn JDM",
        phone: "+84988111222",
        email: "tuan@example.com",
        password: "secret123",
        shippingAddress: "Số 18 Hoàng Quốc Việt, Hà Nội",
        vehicleInfo: "Mazda CX-30 2023",
      }),
    });
    assert.equal(regRes.status, 201);
    const regData = (await regRes.json()) as {
      token: string;
      customer: { id: string; phone: string; email: string; garageVehicles: Array<{ id: string }> };
    };
    assert.equal(regData.customer.phone, "0988111222");
    assert.ok(regData.customer.garageVehicles.length === 1);

    // Reject duplicate phone
    const dupRes = await fetch(`${baseUrl}/api/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Another User",
        phone: "0988111222",
        password: "secret123",
      }),
    });
    assert.equal(dupRes.status, 409);

    // 3. Security isolation: customer token cannot access admin overview
    const forbidAdmin = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    assert.equal(forbidAdmin.status, 401);

    // 4. Login by email & check phone order history + new authenticated order
    const loginRes = await fetch(`${baseUrl}/api/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "TUAN@EXAMPLE.COM",
        password: "secret123",
      }),
    });
    assert.equal(loginRes.status, 200);
    const { token } = (await loginRes.json()) as { token: string };
    const custHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const addCarRes = await fetch(`${baseUrl}/api/customer/garage`, {
      method: "POST",
      headers: custHeaders,
      body: JSON.stringify({
        make: "Honda",
        model: "CR-V L",
        year: "2024",
        nickname: "Xe Gia Đình",
      }),
    });
    assert.equal(addCarRes.status, 201);
    const addCarData = (await addCarRes.json()) as {
      customer: { garageVehicles: Array<{ id: string; make: string }> };
    };
    assert.equal(addCarData.customer.garageVehicles.length, 2);
    const addedCarId = addCarData.customer.garageVehicles[0].id;

    const delCarRes = await fetch(`${baseUrl}/api/customer/garage/${addedCarId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delCarRes.status, 200);

    const authOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: custHeaders,
      body: JSON.stringify({
        customerName: "Anh Tuấn JDM",
        phone: "0988111222",
        vehicleInfo: "Mazda CX-30 2023",
        shippingAddress: "Số 18 Hoàng Quốc Việt, Hà Nội",
        items: [{ productId: "akari-biled-yami-v9", quantity: 1 }],
      }),
    });
    assert.equal(authOrderRes.status, 201);
    const authOrder = (await authOrderRes.json()) as {
      item: { orderCode: string; customerId?: string };
    };
    assert.equal(authOrder.item.customerId, regData.customer.id);

    const meRes = await fetch(`${baseUrl}/api/customer/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meRes.status, 200);
    const meData = (await meRes.json()) as {
      customer: { fullName: string };
      orders: Array<{ orderCode: string }>;
    };
    assert.equal(meData.customer.fullName, "Anh Tuấn JDM");
    assert.ok(meData.orders.some((o) => o.orderCode === guestOrder.item.orderCode));
    assert.ok(meData.orders.some((o) => o.orderCode === authOrder.item.orderCode));
  });

  it("validates vouchers, applies server-side discount on checkout, and supports admin voucher CRUD", async () => {
    const pubRes = await fetch(`${baseUrl}/api/vouchers/public`);
    assert.equal(pubRes.status, 200);
    const pubData = (await pubRes.json()) as { items: Array<{ code: string }> };
    assert.ok(pubData.items.some((v) => v.code === "YOKOCHO10"));

    // Reject below minimum order value
    const tooLowRes = await fetch(`${baseUrl}/api/vouchers/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "YOKOCHO10", subtotalVnd: 1_000_000 }),
    });
    assert.equal(tooLowRes.status, 400);

    // Valid percentage voucher capped at 600K
    const valRes = await fetch(`${baseUrl}/api/vouchers/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "yokocho10", subtotalVnd: 8_900_000 }),
    });
    assert.equal(valRes.status, 200);
    const valData = (await valRes.json()) as { valid: boolean; discountVnd: number };
    assert.equal(valData.valid, true);
    assert.equal(valData.discountVnd, 600_000);

    // Checkout order using YOKOCHO10 on 5,850,000 => 585,000 discount + free ship => 5,265,000
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Nguyễn Khôi",
        phone: "0908123456",
        vehicleInfo: "Honda Civic 2024",
        shippingAddress: "Quận 1, TP.HCM",
        voucherCode: "YOKOCHO10",
        items: [{ productId: "akari-biled-yami-v9", quantity: 1 }],
      }),
    });
    assert.equal(orderRes.status, 201);
    const orderData = (await orderRes.json()) as {
      item: { subtotalVnd: number; discountVnd: number; voucherCode: string; totalVnd: number };
    };
    assert.equal(orderData.item.voucherCode, "YOKOCHO10");
    assert.equal(orderData.item.discountVnd, 585_000);
    assert.equal(orderData.item.totalVnd, 5_265_000);

    // Admin creates, toggles, and deletes a custom voucher
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "yokocho2026",
      }),
    });
    const { token } = (await loginRes.json()) as { token: string };
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const createVchRes = await fetch(`${baseUrl}/api/admin/vouchers`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        code: "NIGHTTEST200",
        title: "Voucher Test 200K",
        discountType: "fixed",
        discountValue: 200_000,
        minOrderVnd: 1_500_000,
        usageLimit: 10,
      }),
    });
    assert.equal(createVchRes.status, 201);
    const createdVch = (await createVchRes.json()) as { item: { id: string; code: string } };
    assert.equal(createdVch.item.code, "NIGHTTEST200");

    const pauseRes = await fetch(`${baseUrl}/api/admin/vouchers/${createdVch.item.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ active: false }),
    });
    assert.equal(pauseRes.status, 200);

    const pausedValidate = await fetch(`${baseUrl}/api/vouchers/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "NIGHTTEST200", subtotalVnd: 3_000_000 }),
    });
    assert.equal(pausedValidate.status, 400);

    const delVchRes = await fetch(`${baseUrl}/api/admin/vouchers/${createdVch.item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delVchRes.status, 200);
  });

  it("manages garage installation booking slots, prevents overbooking, and updates booking status", async () => {
    const testDate = "2026-12-15";
    const slotsBeforeRes = await fetch(
      `${baseUrl}/api/bookings/slots?date=${testDate}&branch=hcm_q7`,
    );
    assert.equal(slotsBeforeRes.status, 200);
    const slotsBefore = (await slotsBeforeRes.json()) as {
      slots: Array<{ timeSlot: string; remainingBays: number; available: boolean }>;
    };
    const slot19 = slotsBefore.slots.find((s) => s.timeSlot === "19:00");
    assert.equal(slot19?.remainingBays, 2);

    // Book 2 bays at 19:00 (max capacity = 2)
    const bk1Res = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Trần Nam",
        phone: "0909888777",
        vehicleInfo: "Honda Civic RS 2023",
        garageBranch: "hcm_q7",
        serviceType: "bi_led_retrofit",
        bookingDate: testDate,
        timeSlot: "19:00",
        orderCode: "YKC-DEMO-01",
      }),
    });
    assert.equal(bk1Res.status, 201);
    const bk1 = (await bk1Res.json()) as { item: { bookingCode: string; status: string } };
    assert.match(bk1.item.bookingCode, /^BK-/);

    const bk2Res = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Lê Minh",
        phone: "0911222333",
        vehicleInfo: "Mazda 3 2022",
        garageBranch: "hcm_q7",
        serviceType: "combo_full_night",
        bookingDate: testDate,
        timeSlot: "19:00",
      }),
    });
    assert.equal(bk2Res.status, 201);

    // 3rd booking in same slot must be rejected with 409
    const bk3Res = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Khách Thứ 3",
        phone: "0922333444",
        vehicleInfo: "Toyota Camry 2023",
        garageBranch: "hcm_q7",
        serviceType: "beam_alignment",
        bookingDate: testDate,
        timeSlot: "19:00",
      }),
    });
    assert.equal(bk3Res.status, 409);

    // Lookup booking publicly
    const lookupRes = await fetch(`${baseUrl}/api/bookings/${bk1.item.bookingCode}`);
    assert.equal(lookupRes.status, 200);

    // Admin confirms & moves booking to in_bay
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "yokocho2026",
      }),
    });
    const { token } = (await loginRes.json()) as { token: string };
    const patchBkRes = await fetch(
      `${baseUrl}/api/admin/bookings/${bk1.item.bookingCode}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "in_bay" }),
      },
    );
    assert.equal(patchBkRes.status, 200);
    const patchedBk = (await patchBkRes.json()) as { item: { status: string } };
    assert.equal(patchedBk.item.status, "in_bay");
  });
});
