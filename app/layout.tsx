import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مسیر روشن",
  description: "ثبت نمازهای قضا و نگهداری خودکار پیشرفت",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
