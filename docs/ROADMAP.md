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
- [ ] Chuyển lưu trữ từ file JSON/in-memory sang **PostgreSQL + Prisma ORM**
- [ ] Thiết kế bảng: `Product`, `VehicleFitment`, `Order`, `OrderItem`, `AdminUser`, `DailyInventoryLog`
- [ ] Thêm API CRUD sản phẩm & cập nhật trạng thái đơn cho Admin (`PATCH /api/admin/orders/:code`)
- [ ] Xác thực Admin bằng JWT + Refresh Token (`POST /api/auth/login`)
- [ ] Upload ảnh/video phụ tùng (kết nối Cloudinary hoặc Cloudflare R2 cho thư mục ảnh đèn LED thực tế)

### Frontend
- [ ] Trang chi tiết sản phẩm chuyên sâu `/san-pham/[slug]` (SEO metadata, gallery ảnh, video test ánh sáng thực tế)
- [ ] Trang Admin Dashboard `/admin` (giao diện tối đồng bộ phố đèn đỏ: quản lý tồn kho, duyệt đơn, cập nhật giá)
- [ ] Lưu giỏ hàng bền vững trên `localStorage` để reload trang không mất giỏ
- [ ] Bộ lọc nâng cao theo khoảng giá, nhiệt màu Kelvin, tình trạng kho (`Sẵn kho` / `Đặt Nhật`)

---

## Phase 3 — Thanh Toán, Tìm Kiếm Thông Minh & Tương Tác Khách Hàng (Tuần 3–4)

### Backend
- [ ] Tích hợp Webhook thanh toán chuyển khoản QR (VietQR / SePay / PayOS) tự xác nhận đã thanh toán
- [ ] Gửi thông báo đơn hàng mới tức thì về Telegram Bot / Zalo OA cho chủ shop
- [ ] Full-text search tiếng Việt không dấu (`PostgreSQL pg_trgm` hoặc Meilisearch) cho mã OEM & tên phụ tùng
- [ ] Hệ thống đánh giá & ảnh lắp đặt thực tế từ khách hàng (kèm kiểm duyệt)

### Frontend
- [ ] Hiển thị mã VietQR động ngay màn hình đặt hàng thành công
- [ ] Trang "Xe Đã Lên Đèn" (Before / After gallery thực tế cho Mazda, Civic, Ranger, Camry...)
- [ ] Mini Chatbot / Form tư vấn chọn chân bóng theo đời xe & ảnh chóa đèn
- [ ] Tối ưu Core Web Vitals, `next/image` tối ưu dung lượng, sitemap & OpenGraph SEO

---

## Phase 4 — Triển Khai Production, Monitoring & Vận Hành (Tuần 5+)

### Deploy & DevOps
- [ ] Deploy **Frontend** lên **Vercel** (Auto-deploy mỗi khi push branch `main`)
- [ ] Deploy **Backend** lên **Render / Railway / VPS Docker** kèm PostgreSQL managed (Supabase hoặc Neon)
- [ ] Cấu hình Custom Domain (VD: `akariyokocho.vn` & `api.akariyokocho.vn`) + SSL tự động
- [ ] Thiết lập **Uptime Monitoring** (UptimeRobot / BetterStack) + **Error Tracking** (Sentry)
- [ ] Tự động backup PostgreSQL hằng ngày + Staging branch (`develop`) trước khi merge vào `main`

