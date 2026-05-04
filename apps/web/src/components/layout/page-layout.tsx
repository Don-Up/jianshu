import { Header } from './header';
import { Footer } from './footer';

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function PageLayout({ children, showFooter = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
