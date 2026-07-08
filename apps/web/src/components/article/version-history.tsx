'use client';

import { VersionItem } from './version-item';
import { Button } from '@/components/ui/button';
import type { ArticleVersion } from '@/lib/api';

interface VersionHistoryProps {
  versions: ArticleVersion[];
  currentVersion?: number;
  isLoading?: boolean;
  onRestore?: (version: ArticleVersion) => void;
  isRestoring?: boolean;
}

export function VersionHistory({
  versions,
  currentVersion,
  isLoading,
  onRestore,
  isRestoring,
}: VersionHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg border animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无版本记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          版本历史 ({versions.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          共 {versions.length} 个版本
        </p>
      </div>

      <div className="space-y-2">
        {versions.map((version, index) => (
          <VersionItem
            key={version.id}
            version={version}
            isCurrent={version.version === currentVersion}
            onRestore={onRestore}
            isRestoring={isRestoring}
          />
        ))}
      </div>

      {onRestore && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            恢复版本将创建当前内容的新快照，然后恢复到选定的版本。所有修改都会被保留。
          </p>
        </div>
      )}
    </div>
  );
}
