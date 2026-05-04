import type { Metadata } from 'next';
import { AuthProviderWrapper } from '@/components/auth/auth-provider';
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
      <body>
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
