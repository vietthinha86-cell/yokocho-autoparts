# Nhật Ký Cập Nhật Web Theo Ngày (Daily Changelog)

Mỗi ngày phát triển hoặc cập nhật web sẽ được ghi nhận tại đây và đẩy thẳng lên GitHub.

## [2026-11-13] — Ngày 01: Khởi tạo dự án & Giao diện Ma Mị Phố Đèn Đỏ Nhật Bản
- **UI/UX:** Xây dựng toàn bộ storefront `AKARI YOKOCHO // 赤灯横丁` phong cách ma mị phố đèn đỏ đêm mưa Nhật Bản (Obsidian `#060406` + Crimson Lantern `#e11d2e` + Amber Fog `#f59e0b`).
- **Assets:** Tạo 4 hình ảnh chủ đạo (phố đêm mưa JDM, Bi-LED projector, Bi-Gầm 3000K, Đèn hậu LED khói & cùm phanh).
- **Features:** Tra cứu phụ tùng theo hãng xe (`FitmentBar`), phòng thử tia sáng đêm mưa 3000K/4300K/6000K (`RainBeamSimulator`), modal thông số Nhật, giỏ hàng + đặt hàng + tra cứu mã đơn.
- **Backend:** Khởi tạo Express 5 + TypeScript API với 6 endpoints và 4 automated tests pass.
- **Plan & CI/CD:** Hoàn thiện bộ tài liệu `ARCHITECTURE.md`, `ROADMAP.md`, `DEPLOY_GUIDE.md`, `DAILY_WORKFLOW.md`, `scripts/daily-push.ps1` và GitHub Actions CI.


- **[2026-11-13 21:02]** feat(ui): mo ta thay doi hom nay

- **[2026-11-13 21:35]** feat(ui): nang cap giao dien Pho Den Do Nhat Ban v2 — 6/6 anh san pham rieng biet, rem Noren + bang hieu neon doc, hieu ung anh den theo chuot + Kanji watermark, va Phong Thu 2 Tia Sang Z-Cutoff + Da Pha Laser (+80W) tren con hem mua dem.
- **[2026-11-13 21:45]** fix(ui): thay card thong tin ky thuat noi bo tren trang chu bang card Cam Ket Lap Dat & Bao Hanh Doc Quyen cho khach hang.
- **[2026-11-13 21:53]** feat(ui): nang cap v3 anh dong & do sac xao JDM — Canvas mua dem + goi anh sang den o to thoi gian thuc (MidnightRainCanvas), cinemagraph Ken Burns + vet cat kiem quang hoc + hieu ung theo tung san pham (AnimatedProductVisual), mat cat Z-Step sac net & cac khung chamfer vat canh 45 do dong bo toan site.
- **[2026-11-13 22:07]** fix(ui): tinh chinh he thong font chu JDM Chakra Petch + Be Vietnam Pro + JetBrains Mono + Noto Sans JP ho tro day du dau tieng Viet & Kanji, can lai bo cuc Hero 2 dong gon tren man hinh laptop.
- **[2026-11-13 23:00]** feat(v4): mo rong ke hang len 8 san pham + 3 Combo Xe Da Len Den (1 cham them combo), thanh keo so sanh Halogen Zin 35W vs Bi-LED trong phong thu tia sang, bo loc Kelvin/Ton kho/Sap xep + bang So Sanh toi da 3 san pham, gio hang luu localStorage, trang chi tiet rieng /san-pham/[slug], ma VietQR thanh toan nhanh va Timeline 4 buoc tra cuu don hang.
- **[2026-11-13 23:25]** feat(v5): hoan thien Phase 2 & 3 (#2, #3, #4, #5, #6, #7, #8 + kien truc Prisma #1) — Prisma schema + migration SQL + seed + PrismaRepository/JsonRepository, Auth Admin JWT + bcrypt + API CRUD san pham/don hang/nhat ky kho, Signed Media Upload URL, Webhook VietQR HMAC-SHA256 + Telegram alerts, va giao dien /admin & /admin/login dong bo Pho Den Do.
- **[2026-11-14 11:15]** feat(v6): tich hop bo 5 tinh nang AI Toan Dien (A1-A5) — Chatbot AI Tho Dem (POST /api/ai/advise voi Gemini 2.5 Flash Vision + fallback thong minh), upload & nen anh choa den gui AI kiem tra, tim kiem tieng Viet khong dau + tu dong nghia (den gam/coi xe to/city 2021), chon gu lai xe + ngan sach + nut Thu Tia Nay dong bo RainBeamSimulator, va tro ly AI Admin tao SKU/ten tieng Nhat/mo ta trong /admin (POST /api/ai/admin-generate).
- **[2026-11-14 11:30]** feat(v7): bat AI Thuc Te Multi-Provider (Gemini + OpenAI/Groq/OpenRouter + Ollama Local qwen2.5:3b & Vision qwen2.5vl:3b), them envLoader.ts ghi de bien moi truong cu trong .env, endpoint GET /api/ai/status & /api/admin/ai-config + /api/admin/ai-test, hien thi model AI dang chay trong AkariAiDrawer va them tab Cau Hinh AI Thuc Te ngay trong /admin.
