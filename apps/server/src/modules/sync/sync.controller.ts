import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SyncChange, SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  async push(@Body() data: { changes: SyncChange[] }) {
    const userId = 'local-user'; // 简化处理，实际应从 Auth 获取
    return this.syncService.pushChanges(userId, data.changes);
  }

  @Get('pull')
  async pull(@Query('since') since?: string) {
    const userId = 'local-user';
    return this.syncService.pullChanges(userId, since);
  }
}
