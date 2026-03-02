'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { FunnelChart } from '@/components/charts/funnel-chart';
import { TimelineChart } from '@/components/charts/timeline-chart';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Calendar,
  UserCheck,
  Award,
  Activity,
} from 'lucide-react';

export default function OverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    try {
      const [o, f, t, c] = await Promise.all([
        api.getOverview(),
        api.getFunnel(),
        api.getTimeline(period),
        api.getClientsComparison(),
      ]);
      setOverview(o);
      setFunnel(f);
      setTimeline(t);
      setClients(c);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;
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
      <div>
        <h1 className="text-3xl font-bold">Agency Overview</h1>
        <p className="text-muted-foreground">
          Cross-client performance at a glance
        </p>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Emails Sent"
            value={overview.emailsSent}
            icon={Mail}
          />
          <KpiCard
            title="Replies"
            value={overview.replied}
            subtitle={formatPercent(overview.replyRate) + ' rate'}
            icon={MessageSquare}
          />
          <KpiCard
            title="Meetings"
            value={overview.meetings}
            icon={Calendar}
          />
          <KpiCard
            title="Show-ups"
            value={overview.showedUp}
            icon={UserCheck}
          />
          <KpiCard
            title="Conversions"
            value={overview.conversions}
            icon={Award}
          />
          <KpiCard
            title="Active Campaigns"
            value={overview.activeCampaigns}
            icon={Activity}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Funnel</CardTitle>
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
          <CardTitle className="text-lg">Client Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No clients yet. Add clients and assign campaigns to see performance data.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-right">Emails Sent</TableHead>
                  <TableHead className="text-right">Replies</TableHead>
                  <TableHead className="text-right">Reply Rate</TableHead>
                  <TableHead className="text-right">Meetings</TableHead>
                  <TableHead className="text-right">Show-ups</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">{c.campaignCount}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.emailsSent)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.replied)}</TableCell>
                    <TableCell className="text-right">{formatPercent(c.replyRate)}</TableCell>
                    <TableCell className="text-right">{c.meetings}</TableCell>
                    <TableCell className="text-right">{c.showedUp}</TableCell>
                    <TableCell className="text-right">{c.conversions}</TableCell>
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
