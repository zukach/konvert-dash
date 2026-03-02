import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('funnel')
  getFunnel(@Query('clientId') clientId?: string) {
    return this.analyticsService.getFunnel(clientId);
  }

  @Get('timeline')
  getTimeline(
    @Query('days') days?: number,
    @Query('clientId') clientId?: string,
  ) {
    return this.analyticsService.getTimeline(days || 30, clientId);
  }

  @Get('clients-comparison')
  getClientsComparison() {
    return this.analyticsService.getClientsComparison();
  }
}
