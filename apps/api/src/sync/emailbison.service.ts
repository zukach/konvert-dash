import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailBisonCampaign {
  id: number;
  name: string;
  status: string;
  type?: string;
  stats?: {
    total_leads?: number;
    emails_sent?: number;
    opened?: number;
    replied?: number;
    unique_replies?: number;
    bounced?: number;
    interested?: number;
    completion_percentage?: number;
  };
}

@Injectable()
export class EmailBisonService {
  private readonly logger = new Logger(EmailBisonService.name);
  private apiKey: string;
  private instanceUrl: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('EMAILBISON_API_KEY', '');
    this.instanceUrl = this.config.get('EMAILBISON_INSTANCE_URL', '');
  }

  async fetchAllCampaigns(): Promise<EmailBisonCampaign[]> {
    const allCampaigns: EmailBisonCampaign[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `${this.instanceUrl}/api/campaigns?page=${page}&per_page=${perPage}`;
      this.logger.log(`Fetching campaigns page ${page}`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`EmailBison API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const campaigns = data.data || data;

      if (!Array.isArray(campaigns) || campaigns.length === 0) break;

      allCampaigns.push(...campaigns);

      if (campaigns.length < perPage) break;
      page++;
    }

    return allCampaigns;
  }

  async fetchCampaignStats(campaignId: number): Promise<any> {
    const url = `${this.instanceUrl}/api/campaigns/${campaignId}/stats`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`EmailBison stats API error: ${response.status}`);
    }

    return response.json();
  }

  mapStatus(status: string): string {
    const mapping: Record<string, string> = {
      draft: 'DRAFT',
      active: 'ACTIVE',
      paused: 'PAUSED',
      completed: 'COMPLETED',
      stopped: 'STOPPED',
      archived: 'ARCHIVED',
    };
    return mapping[status?.toLowerCase()] || 'DRAFT';
  }

  mapType(type: string): string {
    return type === 'reply_followup' ? 'REPLY_FOLLOWUP' : 'OUTBOUND';
  }
}
