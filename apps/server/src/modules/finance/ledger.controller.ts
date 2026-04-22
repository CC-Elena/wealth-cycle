import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { LedgerService } from './ledger.service';

@Controller('finance/ledgers')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  getLedgers() {
    return this.ledgerService.getLedgers();
  }

  @Post()
  createLedger(@Body() data: { name: string; icon?: string }) {
    const userId = 'default-local-user-1';
    return this.ledgerService.createLedger(userId, data);
  }

  @Post('switch')
  switchLedger(@Body() data: { ledgerId: string }) {
    const userId = 'default-local-user-1';
    return this.ledgerService.switchDefaultLedger(userId, data.ledgerId);
  }
}
