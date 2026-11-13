import cors from "cors";
import express from "express";
import path from "node:path";
import { AUTO_PARTS_CATALOG, VEHICLE_FITMENTS } from "./data/catalog.ts";
import { OrderStore } from "./store/orderStore.ts";
import type { OrderItemInput, OrderItemRecord, OrderRecord } from "./types.ts";

export interface AppOptions {
  ordersFilePath?: string;
}

const FREE_SHIPPING_THRESHOLD_VND = 3_000_000;
const STANDARD_SHIPPING_FEE_VND = 45_000;

function generateOrderCode(): string {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timePart = Date.now().toString().slice(-4);
  return `YKC-${timePart}-${randomPart}`;
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const ordersFilePath =
    options.ordersFilePath ??
    path.resolve(process.cwd(), "data", "orders.runtime.json");
  const orderStore = new OrderStore(ordersFilePath);

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "akari-yokocho-autoparts-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/fitments", (_req, res) => {
    res.json({
      items: VEHICLE_FITMENTS,
    });
  });

  app.get("/api/products", (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const make = typeof req.query.make === "string" ? req.query.make.trim().toLowerCase() : "";
    const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

    const filtered = AUTO_PARTS_CATALOG.filter((part) => {
      if (category && category !== "all" && part.category !== category) {
        return false;
      }
      if (
        make &&
        !part.compatibleVehicles.some((v) => v.toLowerCase() === make)
      ) {
        return false;
      }
      if (query) {
        const haystack = [
          part.nameVi,
          part.nameJp,
          part.sku,
          part.oemRef,
          part.brand,
          part.specs.socket ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });

    res.json({
      total: filtered.length,
      items: filtered,
    });
  });

  app.get("/api/products/:slug", (req, res) => {
    const product = AUTO_PARTS_CATALOG.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
    if (!product) {
      res.status(404).json({ error: "Không tìm thấy phụ tùng theo mã yêu cầu." });
      return;
    }
    res.json({ item: product });
  });

  app.post("/api/orders", (req, res) => {
    const body = req.body as Record<string, unknown>;
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const vehicleInfo = typeof body.vehicleInfo === "string" ? body.vehicleInfo.trim() : "";
    const shippingAddress = typeof body.shippingAddress === "string" ? body.shippingAddress.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : undefined;
    const rawItems = Array.isArray(body.items) ? (body.items as OrderItemInput[]) : [];

    if (!customerName || !phone || !shippingAddress) {
      res.status(400).json({
        error: "Vui lòng nhập đầy đủ tên khách hàng, số điện thoại và địa chỉ giao hàng.",
      });
      return;
    }

    if (rawItems.length === 0) {
      res.status(400).json({ error: "Giỏ hàng đang trống." });
      return;
    }

    const orderItems: OrderItemRecord[] = [];
    for (const item of rawItems) {
      const product = AUTO_PARTS_CATALOG.find((p) => p.id === item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
        res.status(400).json({
          error: `Sản phẩm hoặc số lượng không hợp lệ (${String(item.productId)}).`,
        });
        return;
      }
      orderItems.push({
        productId: product.id,
        sku: product.sku,
        nameVi: product.nameVi,
        quantity,
        selectedKelvin: item.selectedKelvin,
        unitPriceVnd: product.priceVnd,
        lineTotalVnd: product.priceVnd * quantity,
      });
    }

    const subtotalVnd = orderItems.reduce((sum, item) => sum + item.lineTotalVnd, 0);
    const shippingFeeVnd = subtotalVnd >= FREE_SHIPPING_THRESHOLD_VND ? 0 : STANDARD_SHIPPING_FEE_VND;
    const order: OrderRecord = {
      orderCode: generateOrderCode(),
      customerName,
      phone,
      vehicleInfo: vehicleInfo || "Chưa cung cấp dòng xe",
      shippingAddress,
      note,
      items: orderItems,
      subtotalVnd,
      shippingFeeVnd,
      totalVnd: subtotalVnd + shippingFeeVnd,
      status: "pending_confirm",
      createdAt: new Date().toISOString(),
    };

    orderStore.create(order);
    res.status(201).json({ item: order });
  });

  app.get("/api/orders/:orderCode", (req, res) => {
    const order = orderStore.findByCode(req.params.orderCode);
    if (!order) {
      res.status(404).json({ error: "Không tìm thấy đơn hàng với mã này." });
      return;
    }
    res.json({ item: order });
  });

  return app;
}

