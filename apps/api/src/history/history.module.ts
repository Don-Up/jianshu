import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { HistoryArticleController } from './history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HistoryController, HistoryArticleController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
