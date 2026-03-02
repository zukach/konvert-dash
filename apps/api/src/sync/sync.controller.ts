import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { CalendlyService } from './calendly.service';
import { Public } from '../auth/public.decorator';
import { Request } from 'express';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(
    private syncService: SyncService,
    private calendlyService: CalendlyService,
  ) {}

  @ApiBearerAuth()
  @Post('emailbison')
  syncEmailBison() {
    return this.syncService.syncEmailBison();
  }

  @ApiBearerAuth()
  @Get('status')
  getSyncStatus() {
    return this.syncService.getSyncStatus();
  }

  @ApiBearerAuth()
  @Get('history')
  getSyncHistory(@Query('limit') limit?: number) {
    return this.syncService.getSyncHistory(limit || 20);
  }

  @Public()
  @Post('calendly/webhook')
  async handleCalendlyWebhook(
    @Body() body: any,
    @Headers('calendly-webhook-signature') signature: string,
  ) {
    const event = body.event;
    const payload = body.payload;
    return this.calendlyService.handleWebhookEvent(event, payload);
  }

  @ApiBearerAuth()
  @Get('calendly/config')
  getCalendlyConfig() {
    return this.calendlyService.getConfig();
  }

  @ApiBearerAuth()
  @Post('calendly/setup')
  setupCalendlyWebhook(@Body() body: { callbackUrl: string }) {
    return this.calendlyService.setupWebhook(body.callbackUrl);
  }
}
