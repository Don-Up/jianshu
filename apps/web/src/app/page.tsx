import { PageLayout } from '@/components/layout/page-layout';

export default function Home() {
  return (
    <PageLayout>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">发现</h1>
        <p className="text-muted-foreground mb-8">在这里发现有趣的内容</p>
        <div className="text-muted-foreground text-center py-12">
          文章列表将在后续步骤中添加
        </div>
      </div>
    </PageLayout>
  );
}
