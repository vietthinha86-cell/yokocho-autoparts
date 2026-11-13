# Kế Hoạch Deploy Production (Frontend + Backend + Database)

Tài liệu này hướng dẫn từng bước đưa web từ máy cá nhân lên Internet ổn định, tự động cập nhật mỗi khi bạn push code lên GitHub.

---

## 1. Kiến Trúc Deploy Đề Xuất (Chi Phí Tối Ưu & Auto-Deploy)

| Thành phần | Nền tảng khuyên dùng | Ghi chú |
| :--- | :--- | :--- |
| **Frontend (`frontend/`)** | **Vercel** | Miễn phí cho dự án cá nhân, hỗ trợ Next.js gốc, tự build & deploy khi push `main` |
| **Backend (`backend/`)** | **Render** hoặc **Railway** (hoặc VPS Docker) | Chạy Node 24 Express API, auto-deploy từ thư mục `backend/` |
| **Database (Phase 2)** | **Supabase** hoặc **Neon PostgreSQL** | Có gói Free ổn định, dễ kết nối qua `DATABASE_URL` |
| **Ảnh/Video Đèn LED** | **Cloudinary** hoặc **Cloudflare R2** | Lưu ảnh thực tế sản phẩm từ thư mục `VIDEO sản phẩm` / `ảnh đèn led` |

---

## 2. Cấu Hình Deploy Từng Bước

### Bước A — Deploy Backend lên Render / Railway
1. Kết nối repo GitHub `vietthinha86-cell/yokocho-autoparts`.
2. Chọn **Root Directory**: `backend`.
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Thiết lập biến môi trường:
   - `PORT=4000` (hoặc để Render tự cấp `$PORT`)
   - `CORS_ORIGIN=https://<ten-domain-vercel>.vercel.app`
6. Kiểm tra sau khi deploy: mở `https://<backend-url>/api/health` thấy `{"status":"ok"}`.

### Bước B — Deploy Frontend lên Vercel
1. Vào Vercel -> **Add New Project** -> chọn repo `vietthinha86-cell/yokocho-autoparts`.
2. Chọn **Root Directory**: `frontend`.
3. Framework Preset: **Next.js**.
4. Thêm Environment Variable:
   - `NEXT_PUBLIC_API_URL=https://<backend-url>`
5. Bấm **Deploy**. Từ lần sau, mỗi khi bạn push code mới lên GitHub, Vercel và Render sẽ **tự động cập nhật web sau ~1–2 phút**.

### Bước C — Kiểm Tra Trước Khi Lên Production (Go-Live Checklist)
- [ ] `npm run test:backend` pass 100%
- [ ] `npm run typecheck` không lỗi TypeScript
- [ ] `npm run build` Next.js build thành công
- [ ] Không commit file `.env` chứa secret/password lên GitHub
- [ ] Kiểm tra đặt thử 1 đơn hàng trên môi trường live và tra lại mã `YKC-...`

