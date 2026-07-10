import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('settings')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  getSettings(@CurrentUser() user: User) {
    return this.settingsService.getSettings(user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update user settings (name, bio, avatar)' })
  updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.id, dto);
  }

  @Patch('settings/notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  updateNotificationPreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.settingsService.updateNotificationPreferences(user.id, dto);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account' })
  deleteAccount(@CurrentUser() user: User) {
    return this.settingsService.deleteAccount(user.id);
  }
}
