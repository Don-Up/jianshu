# Jianshu Backend v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add production-ready features: comments API, notifications system, refresh tokens, rate limiting, enhanced security, and proper error handling.

**Architecture:** NestJS 10 with TypeScript, PostgreSQL with Prisma, Redis for caching and sessions, JWT with refresh tokens.

**Tech Stack:** NestJS 10, Prisma, PostgreSQL, Redis, @nestjs/throttler, @nestjs/jwt

---

## File Structure

```
apps/api/
├── src/
│   ├── main.ts                           # MODIFY: Add throttler, helmet
│   ├── app.module.ts                     # MODIFY: Add modules
│   ├── auth/
│   │   ├── auth.module.ts               # MODIFY: Add refresh token
│   │   ├── auth.service.ts              # MODIFY: Add refresh token methods
│   │   ├── auth.controller.ts           # MODIFY: Add refresh endpoint
│   │   └── dto/
│   │       ├── refresh-token.dto.ts      # NEW
│   │       └── change-password.dto.ts    # NEW
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts              # MODIFY: Add password change
│   │   └── users.controller.ts           # MODIFY: Add password change
│   ├── articles/
│   │   ├── articles.module.ts
│   │   ├── articles.controller.ts        # MODIFY: Add comments endpoints
│   │   ├── articles.service.ts            # MODIFY: Add comment counts
│   │   └── dto/
│   │       ├── create-comment.dto.ts      # NEW
│   │       └── query-comment.dto.ts       # NEW
│   ├── comments/                          # NEW: Comments module
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── dto/
│   ├── notifications/                    # NEW: Notifications module
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── dto/
│   ├── common/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── middleware/
│   │       └── logging.middleware.ts     # NEW: Request logging
│   └── redis/
│       ├── redis.module.ts               # NEW
│       └── redis.service.ts              # NEW
├── prisma/
│   └── schema.prisma                     # MODIFY: Add notifications, refresh tokens
└── package.json
```

---

## Task 1: Comments Module ✅ COMPLETE

**Files (completed):**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/comments/comments.module.ts`
- Create: `apps/api/src/comments/comments.controller.ts`
- Create: `apps/api/src/comments/comments.service.ts`
- Create: `apps/api/src/comments/dto/create-comment.dto.ts`
- Create: `apps/api/src/comments/dto/query-comment.dto.ts`
- Create: `apps/api/src/comments/__tests__/comments.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `docs/mental-models/V2-BTask1.md`

- [ ] **Step 1: Update Prisma schema**

Modify `apps/api/prisma/schema.prisma` - add Comment model:

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId  String
  author    User    @relation(fields: [authorId], references: [id], onDelete: Cascade)

  articleId String
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([articleId])
  @@index([authorId])
  @@map("comments")
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
cd apps/api
npx prisma migrate dev --name add_comments
```

- [ ] **Step 3: Create comment DTOs**

Create `apps/api/src/comments/dto/create-comment.dto.ts`:

```typescript
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'The comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comments can be up to 2,000 characters long' })
  content: string;
}
```

Create `apps/api/src/comments/dto/query-comment.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCommentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
```

- [ ] **Step 4: Create comments service**

Create `apps/api/src/comments/comments.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(articleId: string, authorId: string, dto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId,
        articleId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update comment count on article
    await this.prisma.article.update({
      where: { id: articleId },
      data: { commentCount: { increment: 1 } },
    });

    // Create notification for article author
    if (article.authorId !== authorId) {
      await this.prisma.notification.create({
        data: {
          type: 'COMMENT',
          userId: article.authorId,
          actorId: authorId,
          articleId,
          message: '评论了你的文章',
        },
      });
    }

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
      },
    };
  }

  async findByArticle(articleId: string, query: QueryCommentDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { articleId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { articleId } }),
    ]);

    return {
      success: true,
      data: {
        items: comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: c.author,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Update comment count
    await this.prisma.article.update({
      where: { id: comment.articleId },
      data: { commentCount: { decrement: 1 } },
    });

    return { success: true };
  }
}
```

- [ ] **Step 5: Create comments controller**

Create `apps/api/src/comments/comments.controller.ts`:

```typescript
import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('comments')
@Controller('articles/:articleId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get comments for an article' })
  async findAll(
    @Param('articleId') articleId: string,
    @Query() query: QueryCommentDto,
  ) {
    return this.commentsService.findByArticle(articleId, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment' })
  async create(
    @Param('articleId') articleId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(articleId, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.delete(id, user.id);
  }
}
```

- [ ] **Step 6: Create comments module**

Create `apps/api/src/comments/comments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
```

- [ ] **Step 7: Update app module**

Modify `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ArticlesModule,
    CommentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

---

## Task 2: Notifications Module

**Files:**
- Create: `apps/api/prisma/notification.prisma` (extend schema)
- Create: `apps/api/src/notifications/notifications.module.ts`
- Create: `apps/api/src/notifications/notifications.controller.ts`
- Create: `apps/api/src/notifications/notifications.service.ts`
- Create: `apps/api/src/notifications/dto/query-notification.dto.ts`

- [ ] **Step 1: Update Prisma schema**

Modify `apps/api/prisma/schema.prisma` - add Notification model:

```prisma
model Notification {
  id        String   @id @default(cuid())
  type      String   // COMMENT, LIKE, FOLLOW, SYSTEM
  message   String
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  actorId   String?
  actor     User?   @relation("NotificationActor", fields: [actorId], references: [id])

  articleId String?
  article   Article? @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

// Add to User model:
notifications Notification[] @relation("NotificationUser")
actorNotifications Notification[] @relation("NotificationActor")

// Add to Article model:
notifications Notification[]
```

- [ ] **Step 2: Create notifications service**

Create `apps/api/src/notifications/notifications.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: QueryNotificationDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          actor: {
            select: { id: true, username: true, name: true, avatar: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      success: true,
      data: {
        items: notifications,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { success: true, data: { count } };
  }
}
```

- [ ] **Step 3: Create notifications controller**

Create `apps/api/src/notifications/notifications.controller.ts`:

```typescript
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findAll(@CurrentUser() user: User, @Query() query: QueryNotificationDto) {
    return this.notificationsService.findAll(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
```

- [ ] **Step 4: Create notifications module**

Create `apps/api/src/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/notifications apps/api/prisma/schema.prisma
git commit -m "feat(api): add notifications module"
```

---

## Task 3: Refresh Tokens & Enhanced Auth

**Files:**
- Modify: `apps/api/prisma/schema.prisma` - add refresh tokens
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/dto/refresh-token.dto.ts`

- [ ] **Step 1: Update Prisma schema**

Modify `apps/api/prisma/schema.prisma` - add RefreshToken model:

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

// Add to User model:
refreshTokens RefreshToken[]
```

- [ ] **Step 2: Run Prisma migration**

```bash
cd apps/api
npx prisma migrate dev --name add_refresh_tokens
```

- [ ] **Step 3: Create refresh token DTO**

Create `apps/api/src/auth/dto/refresh-token.dto.ts`:

```typescript
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

- [ ] **Step 4: Update auth service**

Modify `apps/api/src/auth/auth.service.ts`:

```typescript
// Add refresh token methods
private generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

async refreshTokens(refreshToken: string) {
  const tokenRecord = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token 无效或已过期');
  }

  // Delete old refresh token
  await this.prisma.refreshToken.delete({
    where: { id: tokenRecord.id },
  });

  // Generate new tokens
  const newAccessToken = this.generateToken(tokenRecord.user);
  const newRefreshToken = this.generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await this.prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      expiresAt,
      userId: tokenRecord.userId,
    },
  });

  return {
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(tokenRecord.user),
    },
  };
}

async logout(userId: string) {
  // Delete all refresh tokens for user
  await this.prisma.refreshToken.deleteMany({
    where: { userId },
  });

  return { success: true };
}

// Update register and login to create refresh tokens
```

- [ ] **Step 5: Update auth controller**

Modify `apps/api/src/auth/auth.controller.ts` - add endpoints:

```typescript
@Post('refresh')
@ApiOperation({ summary: 'Refresh access token' })
async refresh(@Body() dto: RefreshTokenDto) {
  return this.authService.refreshTokens(dto.refreshToken);
}

@Post('logout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Logout user' })
async logout(@CurrentUser() user: User) {
  return this.authService.logout(user.id);
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth apps/api/prisma/schema.prisma
git commit -m "feat(api): add refresh tokens and logout endpoint"
```

---

## Task 4: Security Enhancements (Rate Limiting, Helmet, Logging)

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/main.ts`
- Create: `apps/api/src/common/middleware/logging.middleware.ts`

- [ ] **Step 1: Install security dependencies**

```bash
cd apps/api
pnpm add @nestjs/throttler helmet
pnpm add -D @types/helmet
```

- [ ] **Step 2: Create logging middleware**

Create `apps/api/src/common/middleware/logging.middleware.ts`:

```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - start;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength || 0}b - ${duration}ms - ${ip} ${userAgent}`,
      );
    });

    next();
  }
}
```

- [ ] **Step 3: Update main.ts**

Modify `apps/api/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Rate limiting
  app.useGlobalGuards(new ThrottlerGuard());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Jianshu API')
    .setDescription('简书博客平台 API')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(4000);
  console.log('API running on http://localhost:4000');
  console.log('Swagger docs on http://localhost:4000/api/docs');
}
bootstrap();
```

- [ ] **Step 4: Add ThrottlerModule to app module**

Modify `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
// ... imports

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/main.ts apps/api/src/app.module.ts apps/api/src/common/middleware/logging.middleware.ts apps/api/package.json
git commit -m "feat(api): add rate limiting, helmet security headers, and request logging"
```

---

## Task 5: Password Change Endpoint

**Files:**
- Create: `apps/api/src/auth/dto/change-password.dto.ts`
- Modify: `apps/api/src/users/users.service.ts`
- Modify: `apps/api/src/users/users.controller.ts`

- [ ] **Step 1: Create change password DTO**

Create `apps/api/src/auth/dto/change-password.dto.ts`:

```typescript
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '当前密码不能为空' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;
}
```

- [ ] **Step 2: Add password change to users service**

Modify `apps/api/src/users/users.service.ts`:

```typescript
import * as bcrypt from 'bcrypt';

async changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('用户不存在');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new UnauthorizedException('当前密码错误');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await this.prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}
```

- [ ] **Step 3: Add endpoint to users controller**

Modify `apps/api/src/users/users.controller.ts`:

```typescript
import { ChangePasswordDto } from '../auth/dto/change-password.dto';

@Post('change-password')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Change password' })
async changePassword(
  @CurrentUser() user: User,
  @Body() dto: ChangePasswordDto,
) {
  return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/auth/dto/change-password.dto.ts apps/api/src/users
git commit -m "feat(api): add password change endpoint"
```

---

## Task 6: Final Verification

- [ ] **Step 1: Run Prisma migrations**

```bash
cd apps/api
npx prisma migrate dev --name v2_updates
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @jianshu/api test
```

Expected: All tests pass

- [ ] **Step 3: Run build**

```bash
pnpm --filter @jianshu/api build
```

Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(api): complete v2 with comments, notifications, refresh tokens, security"
```

---

## API Endpoints Summary v2

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user |
| POST | /api/auth/refresh | No | Refresh access token |
| POST | /api/auth/logout | Yes | Logout user |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/users/:username | No | Get user profile |
| PATCH | /api/users/me | Yes | Update current user |
| POST | /api/users/me/change-password | Yes | Change password |
| POST | /api/users/:userId/follow | Yes | Follow/unfollow user |
| GET | /api/articles | No | List articles |
| GET | /api/articles/:slug | No | Get article |
| POST | /api/articles | Yes | Create article |
| PATCH | /api/articles/:slug | Yes | Update article |
| DELETE | /api/articles/:slug | Yes | Delete article |
| POST | /api/articles/:slug/like | Yes | Like/unlike article |
| POST | /api/articles/:slug/bookmark | Yes | Bookmark/unbookmark article |
| GET | /api/articles/:slug/comments | No | Get article comments |
| POST | /api/articles/:slug/comments | Yes | Create comment |
| DELETE | /api/comments/:id | Yes | Delete comment |
| GET | /api/notifications | Yes | Get notifications |
| GET | /api/notifications/unread-count | Yes | Get unread count |
| POST | /api/notifications/:id/read | Yes | Mark as read |
| POST | /api/notifications/read-all | Yes | Mark all as read |