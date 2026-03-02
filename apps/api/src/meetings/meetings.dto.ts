import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ enum: ['SCHEDULED', 'SHOWED_UP', 'NO_SHOW', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['SCHEDULED', 'SHOWED_UP', 'NO_SHOW', 'CANCELLED'])
  meetingStatus?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'CONVERTED', 'NOT_CONVERTED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'CONVERTED', 'NOT_CONVERTED'])
  conversionStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
