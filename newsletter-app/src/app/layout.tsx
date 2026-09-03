import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ニュースレター配信管理",
  description: "1年間有料ニュースレター配信システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
