import type { Metadata } from 'next';
import { AuthProviderWrapper } from '@/components/auth/auth-provider';
import { ToasterProvider } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
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
        <QueryProvider>
          <AuthProviderWrapper>
            <ToasterProvider />
            {children}
          </AuthProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}