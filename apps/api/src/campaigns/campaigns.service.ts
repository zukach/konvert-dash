import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCampaignDto, BulkAssignDto } from './campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { clientId?: string; status?: string; search?: string }) {
    const where: any = {};
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.campaign.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findUnassigned() {
    return this.prisma.campaign.findMany({
      where: { clientId: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findById(id);
    return this.prisma.campaign.update({
      where: { id },
      data: { clientId: dto.clientId },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async bulkAssign(dto: BulkAssignDto) {
    return this.prisma.campaign.updateMany({
      where: { id: { in: dto.campaignIds } },
      data: { clientId: dto.clientId },
    });
  }
}
