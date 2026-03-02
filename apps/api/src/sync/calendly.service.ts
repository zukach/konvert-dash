import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CalendlyService {
  private readonly logger = new Logger(CalendlyService.name);
  private accessToken: string;
  private webhookSigningKey: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.accessToken = this.config.get('CALENDLY_PERSONAL_ACCESS_TOKEN', '');
    this.webhookSigningKey = this.config.get('CALENDLY_WEBHOOK_SIGNING_KEY', '');
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSigningKey) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSigningKey)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  }

  async handleWebhookEvent(event: string, payload: any) {
    this.logger.log(`Processing Calendly event: ${event}`);

    if (event === 'invitee.created') {
      return this.handleInviteeCreated(payload);
    } else if (event === 'invitee.canceled') {
      return this.handleInviteeCanceled(payload);
    }
  }

  private async handleInviteeCreated(payload: any) {
    const invitee = payload.resource || payload;
    const eventUri = invitee.event;
    const inviteeUri = invitee.uri;

    const existing = await this.prisma.meeting.findUnique({
      where: { calendlyInviteeUri: inviteeUri },
    });
    if (existing) return existing;

    let eventDetails: any = {};
    if (eventUri && this.accessToken) {
      try {
        const res = await fetch(eventUri, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        if (res.ok) eventDetails = await res.json();
      } catch (e) {
        this.logger.warn(`Failed to fetch event details: ${e}`);
      }
    }

    const resource = eventDetails.resource || {};

    return this.prisma.meeting.create({
      data: {
        calendlyEventUri: eventUri,
        calendlyInviteeUri: inviteeUri,
        inviteeEmail: invitee.email || '',
        inviteeName: invitee.name || null,
        startTime: resource.start_time
          ? new Date(resource.start_time)
          : new Date(),
        endTime: resource.end_time ? new Date(resource.end_time) : null,
        eventTypeName: resource.event_type_name || invitee.event_type_name || null,
        meetingStatus: 'SCHEDULED',
        conversionStatus: 'PENDING',
        utmSource: invitee.tracking?.utm_source || null,
        utmMedium: invitee.tracking?.utm_medium || null,
        utmCampaign: invitee.tracking?.utm_campaign || null,
        utmTerm: invitee.tracking?.utm_term || null,
        utmContent: invitee.tracking?.utm_content || null,
      },
    });
  }

  private async handleInviteeCanceled(payload: any) {
    const invitee = payload.resource || payload;
    const inviteeUri = invitee.uri;

    const meeting = await this.prisma.meeting.findUnique({
      where: { calendlyInviteeUri: inviteeUri },
    });

    if (meeting) {
      return this.prisma.meeting.update({
        where: { id: meeting.id },
        data: { meetingStatus: 'CANCELLED' },
      });
    }
  }

  async setupWebhook(callbackUrl: string) {
    if (!this.accessToken) {
      throw new Error('Calendly access token not configured');
    }

    const userRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!userRes.ok) throw new Error('Failed to fetch Calendly user');
    const userData = await userRes.json();
    const organizationUri = userData.resource.current_organization;
    const userUri = userData.resource.uri;

    const webhookRes = await fetch(
      'https://api.calendly.com/webhook_subscriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: callbackUrl,
          events: ['invitee.created', 'invitee.canceled'],
          organization: organizationUri,
          user: userUri,
          scope: 'user',
        }),
      },
    );

    if (!webhookRes.ok) {
      const error = await webhookRes.text();
      throw new Error(`Failed to create webhook: ${error}`);
    }

    const webhookData = await webhookRes.json();
    const resource = webhookData.resource;

    return this.prisma.calendlyWebhookConfig.create({
      data: {
        webhookUri: resource.uri,
        callbackUrl,
        organizationUri,
        userUri,
      },
    });
  }

  async getConfig() {
    return this.prisma.calendlyWebhookConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }
}
