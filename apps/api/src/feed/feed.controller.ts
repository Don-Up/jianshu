import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { QueryFeedDto } from './dto/query-feed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized home feed (articles from followed users)' })
  getHomeFeed(@CurrentUser() user: User, @Query() query: QueryFeedDto) {
    return this.feedService.getHomeFeed(user.id, query);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended articles for user' })
  getRecommendedFeed(@CurrentUser() user: User, @Query() query: QueryFeedDto) {
    return this.feedService.getRecommendedFeed(user.id, query);
  }
}
