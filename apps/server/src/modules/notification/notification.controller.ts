import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Headers('x-ledger-id') ledgerId: string,
    @Query('unread') unread?: string,
  ) {
    const userId = req.user?.id || 'local-user';
    return this.notificationService.findAll(userId, ledgerId, unread === 'true');
  }

  @Get('unread-count')
  async getUnreadCount(
    @Req() req: any,
    @Headers('x-ledger-id') ledgerId: string,
  ) {
    const userId = req.user?.id || 'local-user';
    return { count: await this.notificationService.getUnreadCount(userId, ledgerId) };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 'local-user';
    return this.notificationService.markAsRead(id, userId);
  }

  @Post('read-all')
  async markAllAsRead(
    @Req() req: any,
    @Headers('x-ledger-id') ledgerId: string,
  ) {
    const userId = req.user?.id || 'local-user';
    return this.notificationService.markAllAsRead(userId, ledgerId);
  }
}
