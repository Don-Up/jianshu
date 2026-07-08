import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('follow')
@Controller({ version: '1' })
export class FollowController {
  constructor(private followService: FollowService) {}

  @Get(':username/followers')
  @ApiOperation({ summary: 'Get user followers' })
  getFollowers(
    @Param('username') username: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followService.getFollowers(username, page, limit);
  }

  @Get(':username/following')
  @ApiOperation({ summary: 'Get users followed by user' })
  getFollowing(
    @Param('username') username: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followService.getFollowing(username, page, limit);
  }

  @Get(':username/stats')
  @ApiOperation({ summary: 'Get user follow stats' })
  getStats(@Param('username') username: string) {
    return this.followService.getStats(username);
  }

  @Get(':username/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user follows this user' })
  isFollowing(
    @Param('username') username: string,
    @CurrentUser() user: User,
  ) {
    return this.followService.isFollowing(user.id, username);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow or unfollow a user' })
  follow(
    @Param('username') username: string,
    @CurrentUser() user: User,
  ) {
    return this.followService.follow(user.id, username);
  }
}
