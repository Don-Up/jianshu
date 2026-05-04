import { PageLayout } from '@/components/layout/page-layout';
import { ArticleEditor } from '@/components/article/article-editor';

export default function WritePage() {
  return (
    <PageLayout>
      <div className="bg-secondary/30 min-h-screen py-8">
        <ArticleEditor />
      </div>
    </PageLayout>
  );
}