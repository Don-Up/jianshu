import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { CreateArticleDto } from '../articles/dto/create-article.dto';
import { UpdateArticleDto } from '../articles/dto/update-article.dto';
import { QueryDraftsDto } from './dto/query-drafts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('drafts')
@Controller('articles/drafts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DraftsController {
  constructor(private draftsService: DraftsService) {}

  @Get()
  @ApiOperation({ summary: 'List user drafts' })
  findAll(@CurrentUser() user: User, @Query() query: QueryDraftsDto) {
    return this.draftsService.findAll(user.id, query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get draft by slug' })
  findOne(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.draftsService.findOne(user.id, slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new draft' })
  create(@CurrentUser() user: User, @Body() dto: CreateArticleDto) {
    return this.draftsService.create(user.id, dto);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update a draft' })
  update(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.draftsService.update(user.id, slug, dto);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a draft' })
  delete(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.draftsService.delete(user.id, slug);
  }

  @Post(':slug/publish')
  @ApiOperation({ summary: 'Publish a draft' })
  publish(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.draftsService.publish(user.id, slug);
  }
}
