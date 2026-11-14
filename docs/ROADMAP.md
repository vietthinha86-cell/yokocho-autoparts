# Lộ Trình Phát Triển Dự Án (Frontend / Backend / Deploy)

Dự án được chia thành **4 Phase** rõ ràng để bạn có thể phát triển cuốn chiếu, ngày nào cũng có tính năng hoặc cải tiến mới đẩy lên GitHub.

---

## Phase 1 — Khung Giao Diện Ma Mị Phố Đèn Đỏ & API Cốt Lõi (Đã Khởi Tạo)

### Frontend (`frontend/`)
- [x] Thiết kế hệ thống màu Obsidian + Crimson Lantern + Amber Fog (`globals.css`)
- [x] Hero Phố Đèn Đỏ Đêm Mưa (`HeroAlley.tsx`) + Lồng đèn SVG chuyển động (`ChochinLantern.tsx`)
- [x] Bộ lọc tương thích theo Hãng xe / Mã OEM / Chân bóng (`FitmentBar.tsx`)
- [x] Trình mô phỏng tia sáng 3000K / 4300K / 6000K trong mưa đêm (`RainBeamSimulator.tsx`)
- [x] Kệ hàng & Modal bảng thông số kỹ thuật Nhật (`ProductCard.tsx`, `ProductModal.tsx`)
- [x] Giỏ hàng Drawer + Checkout form + Tra cứu mã đơn (`CartDrawer.tsx`, `OrderLookup.tsx`)

### Backend (`backend/`)
- [x] Express 5 REST API TypeScript chạy native trên Node.js 24
- [x] Endpoints: `GET /api/health`, `GET /api/fitments`, `GET /api/products`, `GET /api/products/:slug`, `POST /api/orders`, `GET /api/orders/:orderCode`
- [x] Validation đơn hàng, tính freeship từ 3.000.000₫, lưu đơn ra JSON runtime store
- [x] Automated API test suite (`node --test`)

### Git & CI/CD
- [x] GitHub Actions CI (`.github/workflows/ci.yml`) tự chạy typecheck, backend tests, frontend build
- [x] Script đẩy update hằng ngày (`scripts/daily-push.ps1`) + `CHANGELOG.md`

---

## Phase 2 — Cơ Sở Dữ Liệu Thật & Trang Chi Tiết / Quản Trị (Tuần 1–2)

### Backend
- [ ] Chuyển lưu trữ trực tiếp sang **PostgreSQL 18** cục bộ (đã hoàn thiện `Prisma schema`, `migration SQL`, `seed.ts` & `PrismaRepository`, chờ cấp `DATABASE_URL`)
- [x] Thiết kế bảng: `Product`, `VehicleFitment`, `VehicleBuildCombo`, `Order`, `OrderItem`, `AdminUser`, `DailyInventoryLog`
- [x] Thêm API CRUD sản phẩm & cập nhật trạng thái đơn cho Admin (`PATCH /api/admin/orders/:orderCode/status`)
- [x] Xác thực Admin bằng JWT + bcrypt (`POST /api/auth/login`)
- [x] Ký URL upload ảnh/video phụ tùng (`POST /api/admin/media/sign` cho Cloudinary / Cloudflare R2 / Sandbox)

### Frontend
- [x] Trang chi tiết sản phẩm chuyên sâu `/san-pham/[slug]` (SEO metadata, OpenGraph, mô phỏng tia sáng đêm mưa & thông số Nhật)
- [x] Trang Admin Dashboard `/admin` & `/admin/login` (giao diện tối đồng bộ phố đèn đỏ: quản lý tồn kho, duyệt đơn, cập nhật giá, nhật ký kho)
- [x] Lưu giỏ hàng bền vững trên `localStorage` để reload trang không mất giỏ
- [x] Bộ lọc nâng cao theo khoảng giá, nhiệt màu Kelvin, tình trạng kho (`Sẵn kho` / `Đặt Nhật`)

---

## Phase 3 — Thanh Toán, Tìm Kiếm Thông Minh & Tương Tác Khách Hàng (Tuần 3–4)

### Backend
- [x] Tích hợp Webhook thanh toán chuyển khoản QR (`POST /api/payments/webhook` xác thực HMAC-SHA256) tự xác nhận đã thanh toán
- [x] Gửi thông báo đơn hàng mới & thanh toán về Telegram Bot / Notification log (`NotificationDispatcher`)
- [x] Full-text search tiếng Việt không dấu & đồng nghĩa kỹ thuật (`normalizeViText` + `matchesSmartProductQuery`) cho mã OEM, dòng xe & tên phụ tùng
- [ ] Hệ thống đánh giá & ảnh lắp đặt thực tế từ khách hàng (kèm kiểm duyệt)

### Frontend
- [x] Hiển thị mã VietQR động ngay màn hình đặt hàng thành công
- [x] Trang "Xe Đã Lên Đèn" (Gallery cấu hình combo thực tế cho Civic, Bán tải Custom, Mazda 3...)
- [x] Chatbot `AI Thợ Đêm` (Gemini Vision + Local Fallback) tư vấn chân bóng theo đời xe, cung đường, ngân sách & ảnh chóa đèn (`AkariAiDrawer` + `POST /api/ai/advise`)
- [ ] Tối ưu Core Web Vitals, `next/image` tối ưu dung lượng, sitemap & OpenGraph SEO

---

## Phase 4 — Triển Khai Production, Monitoring & Vận Hành (Tuần 5+)

### Deploy & DevOps
- [ ] Deploy **Frontend** lên **Vercel** (Auto-deploy mỗi khi push branch `main`)
- [ ] Deploy **Backend** lên **Render / Railway / VPS Docker** kèm PostgreSQL managed (Supabase hoặc Neon)
- [ ] Cấu hình Custom Domain (VD: `akariyokocho.vn` & `api.akariyokocho.vn`) + SSL tự động
- [ ] Thiết lập **Uptime Monitoring** (UptimeRobot / BetterStack) + **Error Tracking** (Sentry)
- [ ] Tự động backup PostgreSQL hằng ngày + Staging branch (`develop`) trước khi merge vào `main`

