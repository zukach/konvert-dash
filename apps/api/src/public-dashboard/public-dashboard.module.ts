import { Module } from '@nestjs/common';
import { PublicDashboardController } from './public-dashboard.controller';
import { PublicDashboardService } from './public-dashboard.service';

@Module({
  controllers: [PublicDashboardController],
  providers: [PublicDashboardService],
})
export class PublicDashboardModule {}
