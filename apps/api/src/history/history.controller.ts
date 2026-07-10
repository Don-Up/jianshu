import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { QueryHistoryDto } from './dto/query-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('history')
@Controller('users/me/history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get user reading history' })
  getHistory(@CurrentUser() user: User, @Query() query: QueryHistoryDto) {
    return this.historyService.getHistory(user.id, query);
  }

  @Delete(':articleId')
  @ApiOperation({ summary: 'Remove article from reading history' })
  removeFromHistory(
    @Param('articleId') articleId: string,
    @CurrentUser() user: User,
  ) {
    return this.historyService.removeFromHistory(user.id, articleId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all reading history' })
  clearHistory(@CurrentUser() user: User) {
    return this.historyService.clearHistory(user.id);
  }
}

@ApiTags('articles')
@Controller('articles')
export class HistoryArticleController {
  constructor(private historyService: HistoryService) {}

  @Post(':slug/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record article view' })
  recordView(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ) {
    return this.historyService.recordView(user.id, slug);
  }
}
