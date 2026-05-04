import { PageLayout } from '@/components/layout/page-layout';

export default function WritePage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">写文章</h1>
        <p className="text-muted-foreground">文章编辑器将在 Task 8 中实现</p>
      </div>
    </PageLayout>
  );
}