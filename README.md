# OQOOD | عقود

منصة عربية لإدارة المنافسات والمشتريات والتعاقدات بين شركات القطاع الخاص.

## الإصدار
`v0.1.0 — Sprint 1 Foundation`

## المكونات الحالية
- موقع عام عربي RTL
- صفحة تسجيل دخول تجريبية
- Platform Shell موحد
- Command Center
- قائمة الفرص والمنافسات
- معالج أولي لإنشاء RFQ وBOQ
- هياكل أولية لشركاء الأعمال والمشاريع والعقود والمستندات والتقارير
- حزمة UI مشتركة
- توثيق ADR وخارطة المنتج

## المتطلبات
- Node.js 20.9 أو أحدث
- pnpm 10 أو أحدث

## التشغيل
```bash
pnpm install
pnpm dev
```
ثم افتح `http://localhost:3000`.

## البناء
```bash
pnpm build
```

## هيكل المشروع
```text
apps/web       موقع OQOOD والمنصة
packages/ui    مكونات التصميم المشتركة
docs/adr       القرارات المعمارية
docs/product   وثائق المنتج
```

## الرفع إلى GitHub
```bash
git add .
git commit -m "feat: initialize OQOOD v0.1.0 foundation"
git push origin main
```
