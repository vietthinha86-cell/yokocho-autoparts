---
name: "[DEPLOY] Task"
about: Công việc CI/CD, hạ tầng Deploy Production & Monitoring
title: "[DEPLOY] "
labels: ["deploy", "devops"]
---

## Hạ tầng mục tiêu
- [ ] Vercel (Frontend)
- [ ] Render / Railway / VPS (Backend)
- [ ] PostgreSQL (Supabase / Neon)

## Checklist kiểm tra
- [ ] Biến môi trường đã cấu hình đầy đủ (không lộ secret)
- [ ] GitHub Actions CI pass trên `main`
- [ ] Kiểm tra healthcheck `/api/health` và luồng đặt hàng live

