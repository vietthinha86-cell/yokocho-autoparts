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
