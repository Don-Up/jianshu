export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">简书</span> © 2026
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">关于</a>
            <a href="#" className="hover:text-foreground">联系我们</a>
            <a href="#" className="hover:text-foreground">隐私政策</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
