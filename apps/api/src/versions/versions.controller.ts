import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { VersionsService } from './versions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('versions')
@Controller({ version: '1', path: 'articles/:slug/versions' })
export class VersionsController {
  constructor(private versionsService: VersionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get article version history' })
  getVersions(@Param('slug') slug: string) {
    return this.versionsService.findAll(slug);
  }

  @Get(':versionId')
  @ApiOperation({ summary: 'Get specific version of an article' })
  getVersion(@Param('slug') slug: string, @Param('versionId') versionId: string) {
    return this.versionsService.findOne(slug, versionId);
  }

  @Post(':versionId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore article to a specific version' })
  restoreVersion(
    @Param('slug') slug: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: User,
  ) {
    return this.versionsService.restore(slug, versionId, user.id);
  }
}
