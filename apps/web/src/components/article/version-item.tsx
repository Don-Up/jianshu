'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { ArticleVersion } from '@/lib/api';

interface VersionItemProps {
  version: ArticleVersion;
  isCurrent?: boolean;
  onRestore?: (version: ArticleVersion) => void;
  isRestoring?: boolean;
}

export function VersionItem({ version, isCurrent, onRestore, isRestoring }: VersionItemProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
          v{version.version}
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {version.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(version.createdAt)}
            </p>
            {version.excerpt && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {version.excerpt}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {isCurrent ? (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                当前版本
              </span>
            ) : onRestore ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore(version)}
                disabled={isRestoring}
              >
                {isRestoring ? '恢复中...' : '恢复此版本'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
