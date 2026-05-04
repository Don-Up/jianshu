import { PageLayout } from '@/components/layout/page-layout';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <PageLayout showFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <RegisterForm />
      </div>
    </PageLayout>
  );
}
