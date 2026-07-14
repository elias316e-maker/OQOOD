import type { Metadata } from "next";
import "@oqood/design-system/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "عقود | OQOOD",
  description:
    "منصة عربية لإدارة المنافسات والمشتريات والتعاقدات بين شركات القطاع الخاص.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
