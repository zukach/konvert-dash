import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const campaignStats = await this.prisma.campaign.aggregate({
      _sum: {
        emailsSent: true,
        opened: true,
        replied: true,
        bounced: true,
        interested: true,
        totalLeads: true,
      },
      _count: true,
    });

    const activeCampaigns = await this.prisma.campaign.count({
      where: { status: 'ACTIVE' },
    });

    const meetingCounts = await this.prisma.meeting.groupBy({
      by: ['meetingStatus'],
      _count: true,
    });

    const conversions = await this.prisma.meeting.count({
      where: { conversionStatus: 'CONVERTED' },
    });

    const totalMeetings = meetingCounts.reduce((sum, m) => sum + m._count, 0);
    const showedUp =
      meetingCounts.find((m) => m.meetingStatus === 'SHOWED_UP')?._count || 0;

    return {
      totalLeads: campaignStats._sum.totalLeads || 0,
      emailsSent: campaignStats._sum.emailsSent || 0,
      opened: campaignStats._sum.opened || 0,
      replied: campaignStats._sum.replied || 0,
      bounced: campaignStats._sum.bounced || 0,
      interested: campaignStats._sum.interested || 0,
      totalCampaigns: campaignStats._count,
      activeCampaigns,
      meetings: totalMeetings,
      showedUp,
      conversions,
      replyRate: campaignStats._sum.emailsSent
        ? ((campaignStats._sum.replied || 0) / campaignStats._sum.emailsSent) * 100
        : 0,
      openRate: campaignStats._sum.emailsSent
        ? ((campaignStats._sum.opened || 0) / campaignStats._sum.emailsSent) * 100
        : 0,
    };
  }

  async getFunnel(clientId?: string) {
    const where = clientId ? { clientId } : {};

    const campaigns = await this.prisma.campaign.aggregate({
      where,
      _sum: {
        emailsSent: true,
        opened: true,
        replied: true,
      },
    });

    const meetingWhere = clientId ? { clientId } : {};

    const totalMeetings = await this.prisma.meeting.count({ where: meetingWhere });
    const showedUp = await this.prisma.meeting.count({
      where: { ...meetingWhere, meetingStatus: 'SHOWED_UP' },
    });
    const conversions = await this.prisma.meeting.count({
      where: { ...meetingWhere, conversionStatus: 'CONVERTED' },
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

  async getTimeline(days = 30, clientId?: string) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshotWhere: any = { snapshotDate: { gte: since } };
    if (clientId) {
      snapshotWhere.campaign = { clientId };
    }

    const snapshots = await this.prisma.campaignSnapshot.findMany({
      where: snapshotWhere,
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

  async getClientsComparison() {
    const clients = await this.prisma.client.findMany({
      where: { isActive: true },
      include: {
        campaigns: {
          select: {
            emailsSent: true,
            opened: true,
            replied: true,
          },
        },
        meetings: {
          select: {
            meetingStatus: true,
            conversionStatus: true,
          },
        },
        _count: { select: { campaigns: true } },
      },
    });

    return clients.map((client) => {
      const emailsSent = client.campaigns.reduce((s, c) => s + c.emailsSent, 0);
      const replied = client.campaigns.reduce((s, c) => s + c.replied, 0);
      const meetings = client.meetings.length;
      const showedUp = client.meetings.filter(
        (m) => m.meetingStatus === 'SHOWED_UP',
      ).length;
      const conversions = client.meetings.filter(
        (m) => m.conversionStatus === 'CONVERTED',
      ).length;

      return {
        id: client.id,
        name: client.name,
        campaignCount: client._count.campaigns,
        emailsSent,
        replied,
        replyRate: emailsSent ? (replied / emailsSent) * 100 : 0,
        meetings,
        showedUp,
        conversions,
      };
    });
  }
}
