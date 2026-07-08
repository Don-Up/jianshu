import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

class CreateShareDto {
  platform!: string;
}

@ApiTags('shares')
@Controller({ version: '1', path: 'articles/:slug/shares' })
export class ShareController {
  constructor(private shareService: ShareService) {}

  @Get()
  @ApiOperation({ summary: 'Get share counts for an article' })
  getShares(@Param('slug') slug: string) {
    return this.shareService.getShares(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Record a share' })
  createShare(@Param('slug') slug: string, @Body() dto: CreateShareDto) {
    return this.shareService.create(slug, dto.platform);
  }
}
