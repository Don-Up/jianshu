import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller({ version: '1' })
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('articles/:slug/analytics')
  @ApiOperation({ summary: 'Get article analytics' })
  getArticleAnalytics(@Param('slug') slug: string) {
    return this.analyticsService.getArticleAnalytics(slug);
  }

  @Get('users/:username/analytics')
  @ApiOperation({ summary: 'Get user analytics' })
  getUserAnalytics(@Param('username') username: string) {
    return this.analyticsService.getUserAnalytics(username);
  }
}
