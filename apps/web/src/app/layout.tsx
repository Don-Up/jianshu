import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '简书 - 创作你的创作',
  description: '一个优质的创作社区',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
