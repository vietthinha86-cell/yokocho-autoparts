# Kiến Trúc Hệ Thống — AKARI YOKOCHO AutoParts

## 1. Sơ Đồ Tổng Quan

```text
[ Người dùng / Gara / Khách lẻ ]
               │
               ▼
┌─────────────────────────────────────────┐
│  Frontend (Next.js 15 + Tailwind CSS)   │  --> Deploy: Vercel (HTTPS + Edge CDN)
│  - Storefront Phố Đèn Đỏ Nhật Bản       │
│  - Vehicle Fitment Filter               │
│  - Rain Night Beam Simulator            │
│  - Cart Drawer & Order Lookup           │
└──────────────────┬──────────────────────┘
                   │ REST API (JSON / HTTPS)
                   ▼
┌─────────────────────────────────────────┐
│  Backend (Node.js + Express + TS)       │  --> Deploy: Render / Railway / VPS Docker
│  - /api/health                          │
│  - /api/fitments                        │
│  - /api/products & /api/products/:slug  │
│  - /api/orders & /api/orders/:orderCode │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
[ Phase 1: JSON Store ]   [ Phase 2: PostgreSQL + Prisma ]
                          [ + Cloudinary / R2 Media ]
```

---

## 2. Hợp Đồng API (API Contract)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Kiểm tra tình trạng API |
| `GET` | `/api/fitments` | Lấy danh sách hãng xe, đời xe và chân bóng chuẩn |
| `GET` | `/api/products?category=&make=&q=` | Lọc sản phẩm theo danh mục, hãng xe, mã SKU/OEM |
| `GET` | `/api/products/:slug` | Lấy chi tiết 1 sản phẩm |
| `POST` | `/api/orders` | Tạo đơn hàng mới, tính phí ship và sinh mã `YKC-...` |
| `GET` | `/api/orders/:orderCode` | Tra cứu trạng thái đơn hàng theo mã |

---

## 3. Lược Đồ Database Dự Kiến (Phase 2 — Prisma / PostgreSQL)

```prisma
model Product {
  id                 String   @id @default(cuid())
  slug               String   @unique
  sku                String   @unique
  oemRef             String
  nameVi             String
  nameJp             String
  brand              String
  category           String
  priceVnd           Int
  originalPriceVnd   Int?
  stockStatus        String
  stockQty           Int
  imageUrl           String
  specsJson          Json
  compatibleVehicles String[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model Order {
  id              String      @id @default(cuid())
  orderCode       String      @unique
  customerName    String
  phone           String
  vehicleInfo     String
  shippingAddress String
  note            String?
  subtotalVnd     Int
  shippingFeeVnd  Int
  totalVnd        Int
  status          String      @default("pending_confirm")
  items           OrderItem[]
  createdAt       DateTime    @default(now())
}
```

