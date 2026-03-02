import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, CreateTokenDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        _count: { select: { campaigns: true, meetings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        _count: { select: { campaigns: true, meetings: true } },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findById(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.client.delete({ where: { id } });
  }

  async getClientFunnel(id: string) {
    await this.findById(id);

    const campaigns = await this.prisma.campaign.aggregate({
      where: { clientId: id },
      _sum: {
        emailsSent: true,
        opened: true,
        replied: true,
        bounced: true,
        interested: true,
      },
      _count: true,
    });

    const meetings = await this.prisma.meeting.groupBy({
      by: ['meetingStatus'],
      where: { clientId: id },
      _count: true,
    });

    const conversions = await this.prisma.meeting.count({
      where: { clientId: id, conversionStatus: 'CONVERTED' },
    });

    const meetingCount = meetings.reduce((sum, m) => sum + m._count, 0);
    const showedUp =
      meetings.find((m) => m.meetingStatus === 'SHOWED_UP')?._count || 0;

    return {
      emailsSent: campaigns._sum.emailsSent || 0,
      opened: campaigns._sum.opened || 0,
      replied: campaigns._sum.replied || 0,
      meetings: meetingCount,
      showedUp,
      conversions,
      activeCampaigns: campaigns._count,
    };
  }

  async getClientCampaigns(id: string) {
    await this.findById(id);
    return this.prisma.campaign.findMany({
      where: { clientId: id },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getClientMeetings(id: string) {
    await this.findById(id);
    return this.prisma.meeting.findMany({
      where: { clientId: id },
      orderBy: { startTime: 'desc' },
    });
  }

  async getClientTimeline(id: string, days: number = 30) {
    await this.findById(id);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await this.prisma.campaignSnapshot.findMany({
      where: {
        campaign: { clientId: id },
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

  async createToken(clientId: string, dto: CreateTokenDto) {
    await this.findById(clientId);
    return this.prisma.publicDashboardToken.create({
      data: {
        clientId,
        label: dto.label,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async getTokens(clientId: string) {
    await this.findById(clientId);
    return this.prisma.publicDashboardToken.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteToken(clientId: string, tokenId: string) {
    return this.prisma.publicDashboardToken.delete({
      where: { id: tokenId, clientId },
    });
  }
}
