import { PageLayout } from '@/components/layout/page-layout';
import { NotificationList } from '@/components/notifications/notification-list';

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <NotificationList />
      </div>
    </PageLayout>
  );
}