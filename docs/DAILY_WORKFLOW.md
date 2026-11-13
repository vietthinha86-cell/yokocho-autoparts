# Quy Trình Cập Nhật Hằng Ngày Lên GitHub (Daily Update Workflow)

Mỗi ngày khi bạn chỉnh sửa giao diện, thêm phụ tùng mới, chụp thêm ảnh đèn LED hoặc nâng cấp tính năng backend, hãy chạy theo quy trình chuẩn sau để lịch sử Git sạch sẽ và web tự động kiểm tra/deploy:

---

## 1. Quy Ước Đặt Tên Commit Theo Ngày

- `feat(ui): ...` — Thêm phần giao diện mới (VD: `feat(ui): add product image zoom gallery`)
- `feat(api): ...` — Thêm API hoặc logic backend
- `content(catalog): ...` — Thêm sản phẩm phụ tùng / cập nhật giá / ảnh mới
- `fix(...): ...` — Sửa lỗi hiển thị hoặc lỗi logic
- `docs(...): ...` — Cập nhật tài liệu kế hoạch

---

## 2. Cách Đẩy Update Nhanh Trong 1 Lệnh

Trong thư mục `d:\yokocho-autoparts`, chạy script đã chuẩn bị sẵn:

```powershell
.\scripts\daily-push.ps1 "feat(ui): cap nhat bang gia den bi-led ngay 14-11"
```

Script này sẽ tự động làm 4 việc:
1. Chạy `npm run typecheck` và `npm run test:backend` để đảm bảo không đẩy code lỗi lên GitHub.
2. Ghi lại một dòng nhật ký kèm ngày giờ vào `CHANGELOG.md`.
3. Thực hiện `git add .` và `git commit -m "..."`.
4. Chạy `git push origin main` để đưa toàn bộ thay đổi lên GitHub (đồng thời kích hoạt **GitHub Actions CI** và auto-deploy).

---

## 3. Quy Trình Khuyến Nghị Cho Các Thay Đổi Lớn

Với tính năng lớn (ví dụ: tích hợp PostgreSQL hoặc cổng thanh toán QR):
1. Tạo nhánh riêng: `git checkout -b feat/ten-tinh-nang`
2. Code và test từng ngày trên nhánh đó, push đều đặn: `git push -u origin feat/ten-tinh-nang`
3. Khi ổn định, mở **Pull Request** trên GitHub để CI kiểm tra rồi Merge vào `main`.

