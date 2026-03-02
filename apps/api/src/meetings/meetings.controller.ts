import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { UpdateMeetingDto } from './meetings.dto';

@ApiTags('meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Get()
  findAll(
    @Query('clientId') clientId?: string,
    @Query('meetingStatus') meetingStatus?: string,
    @Query('conversionStatus') conversionStatus?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetingsService.findAll({
      clientId,
      meetingStatus,
      conversionStatus,
      from,
      to,
    });
  }

  @Get('unassigned')
  findUnassigned() {
    return this.meetingsService.findUnassigned();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.meetingsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.update(id, dto);
  }
}
