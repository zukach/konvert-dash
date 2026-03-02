import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { EmailBisonService } from './emailbison.service';
import { CalendlyService } from './calendly.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService, EmailBisonService, CalendlyService],
  exports: [SyncService],
})
export class SyncModule {}
