import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicDashboardService {
  constructor(private prisma: PrismaService) {}

  private async resolveToken(token: string) {
    const record = await this.prisma.publicDashboardToken.findUnique({
      where: { token },
      include: { client: true },
    });
    if (!record || !record.isActive) {
      throw new NotFoundException('Invalid or expired link');
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      throw new NotFoundException('Link has expired');
    }
    return record;
  }

  async validate(token: string) {
    const record = await this.resolveToken(token);
    return {
      clientName: record.client.name,
      clientId: record.clientId,
    };
  }

  async getFunnel(token: string) {
    const record = await this.resolveToken(token);
    const clientId = record.clientId;

    const campaigns = await this.prisma.campaign.aggregate({
      where: { clientId },
      _sum: {
        emailsSent: true,
        opened: true,
        replied: true,
      },
    });

    const totalMeetings = await this.prisma.meeting.count({
      where: { clientId },
    });
    const showedUp = await this.prisma.meeting.count({
      where: { clientId, meetingStatus: 'SHOWED_UP' },
    });
    const conversions = await this.prisma.meeting.count({
      where: { clientId, conversionStatus: 'CONVERTED' },
    });

    return {
      emailsSent: campaigns._sum.emailsSent || 0,
      opened: campaigns._sum.opened || 0,
      replied: campaigns._sum.replied || 0,
      meetings: totalMeetings,
      showedUp,
      conversions,
    };
  }

  async getCampaigns(token: string) {
    const record = await this.resolveToken(token);
    return this.prisma.campaign.findMany({
      where: { clientId: record.clientId },
      select: {
        id: true,
        name: true,
        status: true,
        emailsSent: true,
        opened: true,
        replied: true,
        bounced: true,
        completionPercentage: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMeetings(token: string) {
    const record = await this.resolveToken(token);

    const statusCounts = await this.prisma.meeting.groupBy({
      by: ['meetingStatus'],
      where: { clientId: record.clientId },
      _count: true,
    });

    const conversionCounts = await this.prisma.meeting.groupBy({
      by: ['conversionStatus'],
      where: { clientId: record.clientId },
      _count: true,
    });

    return { statusCounts, conversionCounts };
  }

  async getTimeline(token: string, days = 30) {
    const record = await this.resolveToken(token);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await this.prisma.campaignSnapshot.findMany({
      where: {
        campaign: { clientId: record.clientId },
        snapshotDate: { gte: since },
      },
      orderBy: { snapshotDate: 'asc' },
    });

    const grouped = new Map<string, { emailsSent: number; replied: number; opened: number }>();
    for (const s of snapshots) {
      const date = s.snapshotDate.toISOString().split('T')[0];
      const existing = grouped.get(date) || { emailsSent: 0, replied: 0, opened: 0 };
      existing.emailsSent += s.emailsSent;
      existing.replied += s.replied;
      existing.opened += s.opened;
      grouped.set(date, existing);
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}
