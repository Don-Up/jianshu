import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';

interface JwtUser {
  id: string;
  email: string;
}

@ApiTags('articles')
@Controller({ path: 'articles', version: '1' })
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
    @CurrentUser() user?: JwtUser,
  ) {
    return this.articlesService.findAll(query, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get article by slug' })
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.articlesService.findBySlug(slug, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  async create(
    @CurrentUser() user: JwtUser,
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
    @CurrentUser() user: JwtUser,
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
    @CurrentUser() user: JwtUser,
  ) {
    return this.articlesService.delete(slug, user.id);
  }

  @Post(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like or unlike an article' })
  async like(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.articlesService.like(slug, user.id);
  }

  @Post(':slug/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bookmark or unbookmark an article' })
  async bookmark(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.articlesService.bookmark(slug, user.id);
  }
}
