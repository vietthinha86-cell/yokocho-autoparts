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
- [x] Chuyển lưu trữ trực tiếp sang **PostgreSQL 18** cục bộ (database `yokocho_autoparts`, Prisma migrations `0001_init` → `0003_customers`, `PrismaRepository`, `seed.ts` & lệnh `npm run db:setup`)
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
- [x] Hệ thống đánh giá & ảnh lắp đặt thực tế từ khách hàng (kèm kiểm duyệt tại `/admin` & tự xác thực mã đơn)
- [x] Hệ thống Tài Khoản & Đăng Nhập Khách Hàng (`CustomerUser`, JWT `kind: "customer"`, `/api/customer/*` cho đăng ký/đăng nhập SĐT & Email, hồ sơ, Gara xe & lịch sử đơn theo tài khoản/SĐT)

### Frontend
- [x] Hiển thị mã VietQR động ngay màn hình đặt hàng thành công
- [x] Trang "Xe Đã Lên Đèn" (Gallery cấu hình combo thực tế cho Civic, Bán tải Custom, Mazda 3...)
- [x] Chatbot `AI Thợ Đêm` Multi-Provider AI Thực Tế (Gemini Vision / OpenAI-Groq-OpenRouter / Local Ollama `qwen2.5:3b` + `qwen2.5vl:3b` + Fallback) kèm Tab cấu hình & test AI trong `/admin` (`AkariAiDrawer`, `/api/ai/status`, `/api/admin/ai-config`)
- [x] Tối ưu `next/image` (AVIF/WebP), dynamic `sitemap.xml`, `robots.txt`, JSON-LD `Product`/`AggregateRating` & OpenGraph SEO + ổn định AI Ollama warmup
- [x] Cổng thành viên (`/dang-nhap` & `/tai-khoan` gồm Lịch Sử Đơn Hàng, Lịch Lắp Đặt, Gara Xe Của Tôi, Hồ Sơ & tự điền checkout/review mà vẫn giữ Guest Checkout song song)
- [x] **Phase 3.5 — Bán Hàng Thực Chiến:** Mã Giảm Giá / Voucher (`Voucher` PostgreSQL + áp mã 1 chạm trong Giỏ hàng + trừ tiền thực tế trên Server & VietQR + CRUD tại `/admin`) và Đặt Lịch Lắp Đặt Tại Xưởng (`InstallationBooking`, kiểm tra khoang trống thời gian thực tối đa 2 xe/khung giờ, ca 19:00 test đèn đêm, quản lý tại `/tai-khoan` & `/admin`)

---

## Phase 4 — Triển Khai Production, Monitoring & Vận Hành (Tuần 5+)

### Deploy & DevOps
- [ ] Deploy **Frontend** lên **Vercel** (Auto-deploy mỗi khi push branch `main`)
- [ ] Deploy **Backend** lên **Render / Railway / VPS Docker** kèm PostgreSQL managed (Supabase hoặc Neon)
- [ ] Cấu hình Custom Domain (VD: `akariyokocho.vn` & `api.akariyokocho.vn`) + SSL tự động
- [ ] Thiết lập **Uptime Monitoring** (UptimeRobot / BetterStack) + **Error Tracking** (Sentry)
- [ ] Tự động backup PostgreSQL hằng ngày + Staging branch (`develop`) trước khi merge vào `main`

