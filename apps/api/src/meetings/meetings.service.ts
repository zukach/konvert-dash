import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeetingDto } from './meetings.dto';

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    clientId?: string;
    meetingStatus?: string;
    conversionStatus?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.meetingStatus) where.meetingStatus = filters.meetingStatus;
    if (filters?.conversionStatus) where.conversionStatus = filters.conversionStatus;
    if (filters?.from || filters?.to) {
      where.startTime = {};
      if (filters.from) where.startTime.gte = new Date(filters.from);
      if (filters.to) where.startTime.lte = new Date(filters.to);
    }

    return this.prisma.meeting.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { startTime: 'desc' },
    });
  }

  async findUnassigned() {
    return this.prisma.meeting.findMany({
      where: { clientId: null },
      orderBy: { startTime: 'desc' },
    });
  }

  async findById(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto) {
    await this.findById(id);
    return this.prisma.meeting.update({
      where: { id },
      data: dto as any,
      include: { client: { select: { id: true, name: true } } },
    });
  }
}
