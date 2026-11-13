# AKARI YOKOCHO // 赤灯横丁 — Web Phụ Tùng Ô Tô Phong Cách Phố Đèn Đỏ Nhật Bản

> Dự án thương mại điện tử chuyên **phụ tùng ô tô, đèn Bi-LED, Bi-Gầm phá sương và đồ chơi JDM**, thiết kế theo thẩm mỹ **Ma Mị Phố Đèn Đỏ Đêm Nhật Bản (Akachōchin / Midnight Yokocho Noir)**.

---

## Điểm Nổi Bật UI/UX & Tính Năng Đã Có (Phase 1)

- **Thẩm mỹ Phố Đèn Đỏ Nhật Đêm (`Midnight Yokocho`):**
  - Tông nền đen sơn mài (`#060406`) hòa cùng ánh đỏ đèn lồng giấy (`#e11d2e`) và hổ phách phá sương (`#f59e0b`), lưới Shōji/Kumiko mảnh, hạt mưa đêm và lồng đèn Kanji chuyển động nhẹ (`灯`, `闇`, `速`).
  - Typography song ngữ Nhật – Việt (`Noto Serif JP` + `Be Vietnam Pro` + `JetBrains Mono`).
- **Nghiệp vụ Phụ Tùng Ô Tô Thực Chiến:**
  - **Tra cứu tương thích theo xe (`FitmentBar`):** Lọc nhanh theo Hãng xe (Toyota, Honda, Mazda, Hyundai, Ford, Mitsubishi), gợi ý chân bóng & mã OEM (`H4`, `H7`, `H11`, `Bi-LED 3.0 inch`).
  - **Phòng thử ánh sáng trong đêm mưa (`RainBeamSimulator`):** Chuyển trực quan 4 chế độ (`Tắt đèn`, `3000K Phá Sương`, `4300K Nắng Ấm`, `6000K Laser Trắng`) ngay trên nền phố đèn đỏ mưa đêm.
  - **Kệ Hàng Đêm & Modal Thông Số Nhật (`ProductCard` / `ProductModal`):** Xem thông số `Watt`, `Lumen`, `Kelvin`, `Bảo hành`, `SKU/OEM` và chọn nhiệt màu trước khi thêm giỏ.
  - **Giỏ Hàng Đêm & Đặt Hàng Thật (`CartDrawer`) + Tra Cứu Đơn (`OrderLookup`):** Tính phí ship (Freeship từ 3.000.000₫), gửi đơn qua REST API `POST /api/orders` và tra mã `YKC-...`.

---

## Cấu Trúc Monorepo

```text
yokocho-autoparts/
├── frontend/                 # Next.js 15 + React 19 + TypeScript + Tailwind CSS v4
├── backend/                  # Express 5 + TypeScript (Node 24 native TS) + Order Persistence + Tests
├── docs/
│   ├── ARCHITECTURE.md       # Kiến trúc hệ thống, API Contract & Database Schema
│   ├── ROADMAP.md            # Kế hoạch chi tiết Backend / Frontend / Deploy từng Phase
│   ├── DEPLOY_GUIDE.md       # Hướng dẫn Deploy Production (Vercel + Render/VPS + PostgreSQL)
│   ├── DAILY_WORKFLOW.md     # Quy trình code & đẩy GitHub hằng ngày
│   └── GITHUB_ISSUES_PLAN.md # Bộ Issues chuẩn để đưa lên tab Issues trên GitHub
├── scripts/
│   └── daily-push.ps1        # Script tự động test + ghi nhật ký + commit + push mỗi ngày
├── .github/
│   ├── workflows/ci.yml      # GitHub Actions CI tự động kiểm tra Backend Test + Frontend Build
│   └── ISSUE_TEMPLATE/       # Template tạo task Frontend / Backend / Deploy
└── CHANGELOG.md              # Nhật ký cập nhật web theo từng ngày
```

---

## Chạy Nhanh Trên Máy Local

### 1. Chạy Backend API (Cổng `4000`)

```powershell
npm --prefix backend install
npm --prefix backend run dev
```

Chạy test Backend:

```powershell
npm --prefix backend test
```

### 2. Chạy Frontend Web (Cổng `3000`)

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Mở trình duyệt tại: `http://localhost:3000`

---

## Kế Hoạch Chi Tiết & Quy Trình GitHub

- Xem kiến trúc hệ thống: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Xem lộ trình **Backend / Frontend / Deploy**: [docs/ROADMAP.md](docs/ROADMAP.md)
- Xem hướng dẫn Deploy thực tế: [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md)
- Xem quy trình đẩy update mỗi ngày: [docs/DAILY_WORKFLOW.md](docs/DAILY_WORKFLOW.md)

