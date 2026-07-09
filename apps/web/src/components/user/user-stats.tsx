interface UserStatsProps {
  followersCount: number;
  followingCount: number;
  articlesCount: number;
}

export function UserStats({ followersCount, followingCount, articlesCount }: UserStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <span>
        <strong className="text-foreground">{followersCount || 0}</strong> 粉丝
      </span>
      <span>
        <strong className="text-foreground">{followingCount || 0}</strong> 关注
      </span>
      <span>
        <strong className="text-foreground">{articlesCount || 0}</strong> 文章
      </span>
    </div>
  );
}
