import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { GatewayModule } from './gateway/gateway.module';
import { CollectionsModule } from './collections/collections.module';
import { VersionsModule } from './versions/versions.module';
import { ShareModule } from './share/share.module';
import { FollowModule } from './follow/follow.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    CommentsModule,
    NotificationsModule,
    UploadModule,
    GatewayModule,
    CollectionsModule,
    VersionsModule,
    ShareModule,
    FollowModule,
    AnalyticsModule,
    HistoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}