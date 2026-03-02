import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { PublicDashboardService } from './public-dashboard.service';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicDashboardController {
  constructor(private publicDashboardService: PublicDashboardService) {}

  @Get(':token')
  validate(@Param('token') token: string) {
    return this.publicDashboardService.validate(token);
  }

  @Get(':token/funnel')
  getFunnel(@Param('token') token: string) {
    return this.publicDashboardService.getFunnel(token);
  }

  @Get(':token/campaigns')
  getCampaigns(@Param('token') token: string) {
    return this.publicDashboardService.getCampaigns(token);
  }

  @Get(':token/meetings')
  getMeetings(@Param('token') token: string) {
    return this.publicDashboardService.getMeetings(token);
  }

  @Get(':token/timeline')
  getTimeline(
    @Param('token') token: string,
    @Query('days') days?: number,
  ) {
    return this.publicDashboardService.getTimeline(token, days || 30);
  }
}
