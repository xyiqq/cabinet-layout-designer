import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "柜体尺寸自动设计系统",
  description: "配电箱、控制柜、网络机柜尺寸自动设计 MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
