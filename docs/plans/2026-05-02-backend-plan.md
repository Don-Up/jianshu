# Jianshu Backend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a NestJS backend for a minimalist blogging platform with user authentication, article CRUD, user profiles, and social features (follow, like).

**Architecture:** NestJS 10 with TypeScript, PostgreSQL database with Prisma ORM, JWT authentication, REST API with Swagger documentation.

**Tech Stack:** NestJS 10, Prisma, PostgreSQL, JWT (Passport), bcrypt, class-validator, Swagger

---

## File Structure

```
apps/api/
├── src/
│   ├── main.ts                           # Application bootstrap
│   ├── app.module.ts                     # Root module
│   ├── prisma/
│   │   └── prisma.module.ts             # Prisma service module
│   ├── prisma.service.ts                 # Prisma client service
│   ├── prisma.binding.ts                 # Prisma bindings for DI
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── optional-jwt.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── articles/
│   │   ├── articles.module.ts
│   │   ├── articles.controller.ts
│   │   ├── articles.service.ts
│   │   ├── dto/
│   │   │   ├── create-article.dto.ts
│   │   │   ├── update-article.dto.ts
│   │   │   └── query-article.dto.ts
│   │   └── entities/
│   │       └── article.entity.ts
│   └── common/
│       ├── decorators/
│       │   └── current-user.decorator.ts
│       ├── filters/
│       │   └── http-exception.filter.ts
│       └── interceptors/
│           └── transform.interceptor.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── nest-cli.json
└── tsconfig.build.json
```

---

## Task 1: Prisma Setup & Database Schema

**Files:**
- Modify: `apps/api/package.json`
- Create: `prisma/schema.prisma`
- Create: `apps/api/src/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`

- [ ] **Step 1: Install Prisma dependencies**

```bash
cd apps/api
pnpm add @prisma/client
pnpm add -D prisma
```

- [ ] **Step 2: Initialize Prisma**

```bash
cd apps/api
npx prisma init
```

- [ ] **Step 3: Create database schema**

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  username     String    @unique
  name         String
  password     String
  bio          String?
  avatar       String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  articles     Article[]
  comments     Comment[]
  likes        Like[]
  bookmarks    Bookmark[]

  followers    Follow[]  @relation("following")
  following    Follow[]  @relation("follower")

  @@map("users")
}

model Article {
  id           String    @id @default(cuid())
  title        String
  slug         String    @unique
  content      String    @db.Text
  excerpt      String?
  coverImage   String?
  likeCount    Int       @default(0)
  commentCount Int       @default(0)
  readCount    Int       @default(0)
  published    Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  authorId     String
  author       User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  tags         TagsOnArticles[]
  comments     Comment[]
  likes        Like[]
  bookmarks    Bookmark[]

  @@index([authorId])
  @@index([slug])
  @@map("articles")
}

model Tag {
  id       String           @id @default(cuid())
  name     String           @unique
  articles TagsOnArticles[]

  @@map("tags")
}

model TagsOnArticles {
  articleId String
  tagId     String
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("tags_on_articles")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId  String
  author    User    @relation(fields: [authorId], references: [id], onDelete: Cascade)

  articleId String
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Like {
  userId    String
  articleId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@id([userId, articleId])
  @@map("likes")
}

model Bookmark {
  userId    String
  articleId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@id([userId, articleId])
  @@map("bookmarks")
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@map("follows")
}
```

- [ ] **Step 4: Create Prisma service**

Create `apps/api/src/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 5: Create Prisma module**

Create `apps/api/src/prisma/prisma.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: Add DATABASE_URL to environment**

Create `apps/api/.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jianshu?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

- [ ] **Step 7: Run Prisma migration**

```bash
cd apps/api
npx prisma migrate dev --name init
```

- [ ] **Step 8: Commit**

```bash
cd c:/Users/10691/Documents/GitHub/jianshu
git add apps/api/prisma/schema.prisma apps/api/src/prisma.service.ts apps/api/src/prisma/prisma.module.ts apps/api/.env
git commit -m "feat(api): add Prisma with PostgreSQL schema for users, articles, comments, likes"
```

---

## Task 2: Auth Module with JWT

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/guards/optional-jwt.guard.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Install auth dependencies**

```bash
cd apps/api
pnpm add @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
pnpm add -D @types/passport-jwt @types/bcrypt
```

- [ ] **Step 2: Create login DTO**

Create `apps/api/src/auth/dto/login.dto.ts`:

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;
}
```

- [ ] **Step 3: Create register DTO**

Create `apps/api/src/auth/dto/register.dto.ts`:

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(2, 50, { message: '昵称长度应在2-50个字符之间' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  @Length(3, 30, { message: '用户名长度应在3-30个字符之间' })
  username: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

- [ ] **Step 4: Create JWT strategy**

Create `apps/api/src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
```

- [ ] **Step 5: Create JWT auth guard**

Create `apps/api/src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

- [ ] **Step 6: Create optional JWT guard**

Create `apps/api/src/auth/guards/optional-jwt.guard.ts`:

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    return user || null;
  }
}
```

- [ ] **Step 7: Create current user decorator**

Create `apps/api/src/common/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
```

- [ ] **Step 8: Create auth service**

Create `apps/api/src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('该邮箱已被注册');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException('该用户名已被使用');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        username: dto.username,
        bio: dto.bio,
        avatar: dto.avatar,
      },
    });

    const token = this.generateToken(user);

    return {
      success: true,
      data: {
        token,
        user: this.sanitizeUser(user),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const token = this.generateToken(user);

    return {
      success: true,
      data: {
        token,
        user: this.sanitizeUser(user),
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  async validateUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return this.sanitizeUser(user);
  }

  private generateToken(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }
}
```

- [ ] **Step 9: Create auth controller**

Create `apps/api/src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }
}
```

- [ ] **Step 10: Create auth module**

Create `apps/api/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 11: Update app module**

Modify `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
})
export class AppModule {}
```

- [ ] **Step 12: Update main.ts with Swagger and CORS**

Modify `apps/api/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Jianshu API')
    .setDescription('简书博客平台 API')
    .setVersion('1.0')
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

- [ ] **Step 13: Build and test**

```bash
cd apps/api
pnpm build
```

Expected: Successful build

- [ ] **Step 14: Commit**

```bash
git add apps/api/src/auth apps/api/src/common apps/api/src/app.module.ts apps/api/src/main.ts
git commit -m "feat(api): add JWT authentication module with login, register, me endpoints"
```

---

## Task 3: Users Module

**Files:**
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.controller.ts`
- Create: `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/users/dto/update-user.dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create update user DTO**

Create `apps/api/src/users/dto/update-user.dto.ts`:

```typescript
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;
}
```

- [ ] **Step 2: Create users service**

Create `apps/api/src/users/users.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            articles: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...result } = user;
    return {
      success: true,
      data: {
        ...result,
        articleCount: user._count.articles,
        followerCount: user._count.followers,
        followingCount: user._count.following,
      },
    };
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { password, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      return { success: false, error: '不能关注自己' };
    }

    const following = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!following) {
      throw new NotFoundException('用户不存在');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return {
        success: true,
        data: { isFollowing: false },
      };
    } else {
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });
      return {
        success: true,
        data: { isFollowing: true },
      };
    }
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      success: true,
      data: {
        items: followers.map((f) => f.follower),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      success: true,
      data: {
        items: following.map((f) => f.following),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

- [ ] **Step 3: Create users controller**

Create `apps/api/src/users/users.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Param, Query, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile by username' })
  async getByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow or unfollow a user' })
  async toggleFollow(
    @CurrentUser() user: User,
    @Param('userId') followingId: string,
  ) {
    return this.usersService.follow(user.id, followingId);
  }

  @Get(':username/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFollowers(
    @Param('username') username: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getFollowers(user.data.id, page || 1, limit || 20);
  }

  @Get(':username/following')
  @ApiOperation({ summary: 'Get users that this user follows' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFollowing(
    @Param('username') username: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getFollowing(user.data.id, page || 1, limit || 20);
  }
}
```

- [ ] **Step 4: Create users module**

Create `apps/api/src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: Update app module**

Modify `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
})
export class AppModule {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/users apps/api/src/app.module.ts
git commit -m "feat(api): add users module with profile, follow/unfollow endpoints"
```

---

## Task 4: Articles Module

**Files:**
- Create: `apps/api/src/articles/articles.module.ts`
- Create: `apps/api/src/articles/articles.controller.ts`
- Create: `apps/api/src/articles/articles.service.ts`
- Create: `apps/api/src/articles/dto/create-article.dto.ts`
- Create: `apps/api/src/articles/dto/update-article.dto.ts`
- Create: `apps/api/src/articles/dto/query-article.dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create create article DTO**

Create `apps/api/src/articles/dto/create-article.dto.ts`:

```typescript
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsArray, MaxLength, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

- [ ] **Step 2: Create update article DTO**

Create `apps/api/src/articles/dto/update-article.dto.ts`:

```typescript
import { IsOptional, IsString, IsUrl, IsArray, MaxLength, MinLength } from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

- [ ] **Step 3: Create query article DTO**

Create `apps/api/src/articles/dto/query-article.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryArticleDto {
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

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
```

- [ ] **Step 4: Create articles service**

Create `apps/api/src/articles/articles.service.ts`:

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  async create(authorId: string, dto: CreateArticleDto) {
    const slug = this.generateSlug(dto.title);

    let tags: { connect: { name: string }[] } = {};
    if (dto.tags && dto.tags.length > 0) {
      const tagConnections = dto.tags.map((name) => ({ name }));
      tags = {
        connectOrCreate: tagConnections.map((t) => ({
          where: { name: t.name },
          create: t,
        })),
      };
    }

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        authorId,
        tags,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      success: true,
      data: this.formatArticle(article),
    };
  }

  async findAll(query: QueryArticleDto, userId?: string) {
    const { page = 1, limit = 20, authorId, tag, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      published: true,
    };

    if (authorId) {
      where.authorId = authorId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          likes: userId ? { where: { userId } } : false,
          bookmarks: userId ? { where: { userId } } : false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: articles.map((a) => this.formatArticle(a, userId)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        likes: userId ? { where: { userId } } : false,
        bookmarks: userId ? { where: { userId } } : false,
      },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    await this.prisma.article.update({
      where: { id: article.id },
      data: { readCount: { increment: 1 } },
    });

    return {
      success: true,
      data: this.formatArticle(article, userId),
    };
  }

  async update(slug: string, userId: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('无权修改此文章');
    }

    let tags: any = undefined;
    if (dto.tags !== undefined) {
      const tagConnections = dto.tags.map((name) => ({ name }));
      tags = {
        deleteMany: {},
        connectOrCreate: tagConnections.map((t) => ({
          where: { name: t.name },
          create: t,
        })),
      };
    }

    const updated = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        tags,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      success: true,
      data: this.formatArticle(updated),
    };
  }

  async delete(slug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('无权删除此文章');
    }

    await this.prisma.article.delete({
      where: { id: article.id },
    });

    return {
      success: true,
      message: '文章已删除',
    };
  }

  async like(articleSlug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id,
          },
        },
      });

      await this.prisma.article.update({
        where: { id: article.id },
        data: { likeCount: { decrement: 1 } },
      });

      return {
        success: true,
        data: { likeCount: article.likeCount - 1, isLiked: false },
      };
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          articleId: article.id,
        },
      });

      await this.prisma.article.update({
        where: { id: article.id },
        data: { likeCount: { increment: 1 } },
      });

      return {
        success: true,
        data: { likeCount: article.likeCount + 1, isLiked: true },
      };
    }
  }

  async bookmark(articleSlug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (existingBookmark) {
      await this.prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id,
          },
        },
      });

      return {
        success: true,
        data: { isBookmarked: false },
      };
    } else {
      await this.prisma.bookmark.create({
        data: {
          userId,
          articleId: article.id,
        },
      });

      return {
        success: true,
        data: { isBookmarked: true },
      };
    }
  }

  private formatArticle(article: any, userId?: string) {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      readCount: article.readCount,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
      tags: article.tags?.map((t: any) => t.tag.name) || [],
      isLiked: article.likes?.length > 0 || false,
      isBookmarked: article.bookmarks?.length > 0 || false,
    };
  }
}
```

- [ ] **Step 5: Create articles controller**

Create `apps/api/src/articles/articles.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get articles with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiQuery({ name: 'tag', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query() query: QueryArticleDto,
    @CurrentUser() user?: User,
  ) {
    return this.articlesService.findAll(query, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get article by slug' })
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() user?: User,
  ) {
    return this.articlesService.findBySlug(slug, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articlesService.create(user.id, dto);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an article' })
  async update(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(slug, user.id, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an article' })
  async delete(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ) {
    return this.articlesService.delete(slug, user.id);
  }

  @Post(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like or unlike an article' })
  async like(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ) {
    return this.articlesService.like(slug, user.id);
  }

  @Post(':slug/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bookmark or unbookmark an article' })
  async bookmark(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ) {
    return this.articlesService.bookmark(slug, user.id);
  }
}
```

- [ ] **Step 6: Create articles module**

Create `apps/api/src/articles/articles.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
```

- [ ] **Step 7: Update app module**

Modify `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ArticlesModule],
})
export class AppModule {}
```

- [ ] **Step 8: Build and test**

```bash
cd apps/api
pnpm build
```

Expected: Successful build

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/articles apps/api/src/app.module.ts
git commit -m "feat(api): add articles module with full CRUD, like, bookmark"
```

---

## Task 5: User Articles Endpoint

**Files:**
- Modify: `apps/api/src/users/users.controller.ts`
- Modify: `apps/api/src/users/users.service.ts`

- [ ] **Step 1: Add getUserArticles to users service**

Modify `apps/api/src/users/users.service.ts` - add method:

```typescript
async getUserArticles(username: string, page: number = 1, limit: number = 20, requestUserId?: string) {
  const user = await this.prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new NotFoundException('用户不存在');
  }

  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    this.prisma.article.findMany({
      where: { authorId: user.id, published: true },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        likes: requestUserId ? { where: { userId: requestUserId } } : false,
        bookmarks: requestUserId ? { where: { userId: requestUserId } } : false,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.article.count({ where: { authorId: user.id, published: true } }),
  ]);

  return {
    success: true,
    data: {
      items: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        content: a.content,
        excerpt: a.excerpt,
        coverImage: a.coverImage,
        likeCount: a.likeCount,
        commentCount: a.commentCount,
        readCount: a.readCount,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        author: a.author,
        tags: a.tags?.map((t) => t.tag.name) || [],
        isLiked: a.likes?.length > 0 || false,
        isBookmarked: a.bookmarks?.length > 0 || false,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

- [ ] **Step 2: Add getUserArticles endpoint to users controller**

Modify `apps/api/src/users/users.controller.ts` - add method:

```typescript
@Get(':username/articles')
@UseGuards(OptionalJwtAuthGuard)
@ApiOperation({ summary: 'Get articles by username' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
async getUserArticles(
  @Param('username') username: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @CurrentUser() user?: User,
) {
  return this.usersService.getUserArticles(username, page || 1, limit || 20, user?.id);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/users
git commit -m "feat(api): add user articles endpoint for profile page"
```

---

## Task 6: Error Handling & Response Format

**Files:**
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Create: `apps/api/src/common/interceptors/transform.interceptor.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Create HTTP exception filter**

Create `apps/api/src/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || message;
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      }
    }

    response.status(status).json({
      success: false,
      error: message,
      statusCode: status,
    });
  }
}
```

- [ ] **Step 2: Create transform interceptor**

Create `apps/api/src/common/interceptors/transform.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
```

- [ ] **Step 3: Update main.ts to use filters and interceptors**

Modify `apps/api/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Jianshu API')
    .setDescription('简书博客平台 API')
    .setVersion('1.0')
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

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/common apps/api/src/main.ts
git commit -m "feat(api): add global exception filter and response transform interceptor"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run full build**

```bash
cd apps/api
pnpm build
```

Expected: Successful build with no errors

- [ ] **Step 2: Verify API starts**

```bash
cd apps/api
node dist/main.js
```

Expected: API starts on port 4000

- [ ] **Step 3: Test endpoints with curl**

```bash
# Health check
curl http://localhost:4000/api/health

# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User","username":"testuser"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

Expected: Valid JSON responses

- [ ] **Step 4: Commit final state**

```bash
cd c:/Users/10691/Documents/GitHub/jianshu
git add -A
git commit -m "feat(api): complete MVP backend with auth, users, articles"
```

---

## Database Setup Requirements

Before running the backend:

1. **Install PostgreSQL** (if not already installed)
2. **Create database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE jianshu;"
   ```
3. **Set DATABASE_URL** in `apps/api/.env`
4. **Run migrations:**
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name init
   ```
5. **Start server:**
   ```bash
   cd apps/api
   pnpm start:dev
   ```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/users/:username | No | Get user profile |
| PATCH | /api/users/me | Yes | Update current user |
| POST | /api/users/:userId/follow | Yes | Follow/unfollow user |
| GET | /api/articles | No | List articles |
| GET | /api/articles/:slug | No | Get article |
| POST | /api/articles | Yes | Create article |
| PATCH | /api/articles/:slug | Yes | Update article |
| DELETE | /api/articles/:slug | Yes | Delete article |
| POST | /api/articles/:slug/like | Yes | Like/unlike article |
| POST | /api/articles/:slug/bookmark | Yes | Bookmark/unbookmark article |
