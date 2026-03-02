import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailBisonService } from './emailbison.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private emailBisonService: EmailBisonService,
  ) {}

  async syncEmailBison() {
    const syncJob = await this.prisma.syncJob.create({
      data: { source: 'EMAILBISON', status: 'RUNNING' },
    });

    try {
      const campaigns = await this.emailBisonService.fetchAllCampaigns();
      this.logger.log(`Fetched ${campaigns.length} campaigns from EmailBison`);

      let synced = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const c of campaigns) {
        const stats = c.stats || {};

        const data = {
          name: c.name,
          status: this.emailBisonService.mapStatus(c.status) as any,
          type: this.emailBisonService.mapType(c.type || 'outbound') as any,
          totalLeads: stats.total_leads || 0,
          emailsSent: stats.emails_sent || 0,
          opened: stats.opened || 0,
          replied: stats.replied || 0,
          uniqueReplies: stats.unique_replies || 0,
          bounced: stats.bounced || 0,
          interested: stats.interested || 0,
          completionPercentage: stats.completion_percentage || 0,
          lastSyncedAt: new Date(),
        };

        const campaign = await this.prisma.campaign.upsert({
          where: { emailbisonId: c.id },
          update: data,
          create: { ...data, emailbisonId: c.id },
        });

        await this.prisma.campaignSnapshot.upsert({
          where: {
            campaignId_snapshotDate: {
              campaignId: campaign.id,
              snapshotDate: today,
            },
          },
          update: {
            totalLeads: data.totalLeads,
            emailsSent: data.emailsSent,
            opened: data.opened,
            replied: data.replied,
            uniqueReplies: data.uniqueReplies,
            bounced: data.bounced,
            interested: data.interested,
            completionPercentage: data.completionPercentage,
          },
          create: {
            campaignId: campaign.id,
            snapshotDate: today,
            totalLeads: data.totalLeads,
            emailsSent: data.emailsSent,
            opened: data.opened,
            replied: data.replied,
            uniqueReplies: data.uniqueReplies,
            bounced: data.bounced,
            interested: data.interested,
            completionPercentage: data.completionPercentage,
          },
        });

        synced++;
      }

      await this.prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'COMPLETED',
          campaignsSynced: synced,
          completedAt: new Date(),
        },
      });

      return { status: 'completed', campaignsSynced: synced };
    } catch (error: any) {
      this.logger.error(`Sync failed: ${error.message}`);
      await this.prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async getSyncStatus() {
    const latest = await this.prisma.syncJob.findFirst({
      where: { source: 'EMAILBISON' },
      orderBy: { startedAt: 'desc' },
    });
    return latest;
  }

  async getSyncHistory(limit = 20) {
    return this.prisma.syncJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
