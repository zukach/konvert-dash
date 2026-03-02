import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, CreateTokenDto } from './clients.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.clientsService.delete(id);
  }

  @Get(':id/funnel')
  getFunnel(@Param('id') id: string) {
    return this.clientsService.getClientFunnel(id);
  }

  @Get(':id/campaigns')
  getCampaigns(@Param('id') id: string) {
    return this.clientsService.getClientCampaigns(id);
  }

  @Get(':id/meetings')
  getMeetings(@Param('id') id: string) {
    return this.clientsService.getClientMeetings(id);
  }

  @Get(':id/timeline')
  getTimeline(
    @Param('id') id: string,
    @Query('days') days?: number,
  ) {
    return this.clientsService.getClientTimeline(id, days || 30);
  }

  @Post(':id/tokens')
  createToken(@Param('id') id: string, @Body() dto: CreateTokenDto) {
    return this.clientsService.createToken(id, dto);
  }

  @Get(':id/tokens')
  getTokens(@Param('id') id: string) {
    return this.clientsService.getTokens(id);
  }

  @Delete(':id/tokens/:tokenId')
  deleteToken(
    @Param('id') id: string,
    @Param('tokenId') tokenId: string,
  ) {
    return this.clientsService.deleteToken(id, tokenId);
  }
}
