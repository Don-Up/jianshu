import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jianshu',
  description: 'A monorepo with Next.js and Nest.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
