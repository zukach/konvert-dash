'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { FunnelChart } from '@/components/charts/funnel-chart';
import { TimelineChart } from '@/components/charts/timeline-chart';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatNumber, formatPercent, formatDate } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Calendar,
  UserCheck,
  Award,
  Activity,
  Link2,
  Copy,
} from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [copiedToken, setCopiedToken] = useState('');

  useEffect(() => {
    loadData();
  }, [clientId, period]);

  async function loadData() {
    try {
      const [c, f, camp, meet, t, tok] = await Promise.all([
        api.getClient(clientId),
        api.getClientFunnel(clientId),
        api.getClientCampaigns(clientId),
        api.getClientMeetings(clientId),
        api.getClientTimeline(clientId, period),
        api.getTokens(clientId),
      ]);
      setClient(c);
      setFunnel(f);
      setCampaigns(camp);
      setMeetings(meet);
      setTimeline(t);
      setTokens(tok);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateShareLink() {
    try {
      await api.createToken(clientId, { label: 'Share Link' });
      const tok = await api.getTokens(clientId);
      setTokens(tok);
    } catch (err) {
      console.error(err);
    }
  }

  function copyShareLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  }

  async function updateMeetingStatus(meetingId: string, field: string, value: string) {
    try {
      await api.updateMeeting(meetingId, { [field]: value });
      const meet = await api.getClientMeetings(clientId);
      setMeetings(meet);
      const f = await api.getClientFunnel(clientId);
      setFunnel(f);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading client...</div>;
  }

  if (!client) {
    return <div className="text-muted-foreground">Client not found</div>;
  }

  const funnelData = funnel
    ? [
        { label: 'Emails Sent', value: funnel.emailsSent, color: '#3b82f6' },
        { label: 'Opened', value: funnel.opened, color: '#8b5cf6' },
        { label: 'Replied', value: funnel.replied, color: '#10b981' },
        { label: 'Meetings', value: funnel.meetings, color: '#f59e0b' },
        { label: 'Showed Up', value: funnel.showedUp, color: '#ef4444' },
        { label: 'Conversions', value: funnel.conversions, color: '#06b6d4' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            {client.contactName && <span>Contact: {client.contactName}</span>}
            {client.contactEmail && <span>Email: {client.contactEmail}</span>}
          </div>
        </div>
        <Button onClick={generateShareLink} variant="outline">
          <Link2 className="h-4 w-4 mr-2" />
          Generate Share Link
        </Button>
      </div>

      {tokens.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">Share Links</div>
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">
                  {window.location.origin}/share/{t.token}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyShareLink(t.token)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {copiedToken === t.token ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {funnel && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Emails Sent" value={funnel.emailsSent} icon={Mail} />
          <KpiCard
            title="Replies"
            value={funnel.replied}
            subtitle={funnel.emailsSent ? formatPercent((funnel.replied / funnel.emailsSent) * 100) + ' rate' : '0%'}
            icon={MessageSquare}
          />
          <KpiCard title="Meetings" value={funnel.meetings} icon={Calendar} />
          <KpiCard title="Show-ups" value={funnel.showedUp} icon={UserCheck} />
          <KpiCard title="Conversions" value={funnel.conversions} icon={Award} />
          <KpiCard title="Campaigns" value={funnel.activeCampaigns} icon={Activity} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnelData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Timeline</CardTitle>
              <div className="flex gap-1">
                {[7, 30, 90].map((d) => (
                  <Button
                    key={d}
                    variant={period === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod(d)}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TimelineChart data={timeline} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaigns ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns assigned to this client.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Replied</TableHead>
                  <TableHead className="text-right">Bounced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(c.emailsSent)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.opened)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.replied)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.bounced)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meetings ({meetings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings yet for this client.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{m.inviteeName || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{m.inviteeEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(m.startTime)}</TableCell>
                    <TableCell>{m.eventTypeName || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={m.meetingStatus}
                        onChange={(e) => updateMeetingStatus(m.id, 'meetingStatus', e.target.value)}
                        className="w-32"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="SHOWED_UP">Showed Up</option>
                        <option value="NO_SHOW">No Show</option>
                        <option value="CANCELLED">Cancelled</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={m.conversionStatus}
                        onChange={(e) => updateMeetingStatus(m.id, 'conversionStatus', e.target.value)}
                        className="w-36"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="NOT_CONVERTED">Not Converted</option>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
