import { PageLayout } from '@/components/layout/page-layout';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <PageLayout showFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <LoginForm />
      </div>
    </PageLayout>
  );
}
