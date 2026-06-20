import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('comments')
@Controller({ version: '1' })
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('articles/:slug/comments')
  @ApiOperation({ summary: 'Get comments for an article' })
  async findAll(@Param('slug') slug: string, @Request() req: any) {
    const userId = req.user?.id;
    return this.commentsService.findByArticle(slug, userId);
  }

  @Post('articles/:slug/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment or reply' })
  async create(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(slug, user.id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.delete(id, user.id);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a comment' })
  async like(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.likeComment(id, user.id);
  }

  @Delete('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a comment' })
  async unlike(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentsService.unlikeComment(id, user.id);
  }
}
