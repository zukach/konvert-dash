import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string | null;
}

export class BulkAssignDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  campaignIds: string[];

  @ApiPropertyOptional()
  @IsString()
  clientId: string;
}
