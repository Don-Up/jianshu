import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('collections')
@Controller({ path: 'collections', version: '1' })
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user collections' })
  getMyCollections(@CurrentUser() user: User) {
    return this.collectionsService.findAll(user.id);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bookmarks' })
  getMyBookmarks(@CurrentUser() user: User) {
    return this.collectionsService.getBookmarks(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection by ID' })
  getCollection(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.collectionsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collection' })
  create(@CurrentUser() user: User, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a collection' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a collection' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.collectionsService.delete(id, user.id);
  }

  @Post(':id/articles/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add article to collection' })
  addArticle(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ) {
    return this.collectionsService.addArticle(id, slug, user.id);
  }

  @Delete(':id/articles/:articleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove article from collection' })
  removeArticle(
    @Param('id') id: string,
    @Param('articleId') articleId: string,
    @CurrentUser() user: User,
  ) {
    return this.collectionsService.removeArticle(id, articleId, user.id);
  }

  @Post('bookmark/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle bookmark on article' })
  toggleBookmark(@Param('slug') slug: string, @CurrentUser() user: User) {
    return this.collectionsService.toggleBookmark(user.id, slug);
  }
}
