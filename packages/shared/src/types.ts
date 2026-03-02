export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  STOPPED = 'STOPPED',
  ARCHIVED = 'ARCHIVED',
}

export enum CampaignType {
  OUTBOUND = 'OUTBOUND',
  REPLY_FOLLOWUP = 'REPLY_FOLLOWUP',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  SHOWED_UP = 'SHOWED_UP',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export enum ConversionStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  NOT_CONVERTED = 'NOT_CONVERTED',
}

export enum SyncSource {
  EMAILBISON = 'EMAILBISON',
  CALENDLY = 'CALENDLY',
}

export enum SyncStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface FunnelData {
  emailsSent: number;
  opened: number;
  replied: number;
  meetings: number;
  showedUp: number;
  conversions: number;
}

export interface TimelinePoint {
  date: string;
  emailsSent: number;
  replied: number;
  meetings: number;
}

export interface ClientSummary {
  id: string;
  name: string;
  campaignCount: number;
  funnel: FunnelData;
}
