'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
} from 'lucide-react';

export default function PublicDashboardPage() {
  const params = useParams();
  const token = params.token as string;

  const [clientName, setClientName] = useState('');
  const [funnel, setFunnel] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadData();
  }, [token, period]);

  async function loadData() {
    try {
      const [info, f, c, t] = await Promise.all([
        api.validatePublicToken(token),
        api.getPublicFunnel(token),
        api.getPublicCampaigns(token),
        api.getPublicTimeline(token, period),
      ]);
      setClientName(info.clientName);
      setFunnel(f);
      setCampaigns(c);
      setTimeline(t);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired link');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Link Not Found</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">{clientName} - Performance Dashboard</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {funnel && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard title="Emails Sent" value={funnel.emailsSent} icon={Mail} />
            <KpiCard
              title="Replies"
              value={funnel.replied}
              subtitle={
                funnel.emailsSent
                  ? formatPercent((funnel.replied / funnel.emailsSent) * 100) + ' rate'
                  : '0%'
              }
              icon={MessageSquare}
            />
            <KpiCard title="Meetings" value={funnel.meetings} icon={Calendar} />
            <KpiCard title="Show-ups" value={funnel.showedUp} icon={UserCheck} />
            <KpiCard title="Conversions" value={funnel.conversions} icon={Award} />
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
            <CardTitle className="text-lg">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Opened</TableHead>
                    <TableHead className="text-right">Replied</TableHead>
                    <TableHead className="text-right">Reply Rate</TableHead>
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
                      <TableCell className="text-right">
                        {c.emailsSent
                          ? formatPercent((c.replied / c.emailsSent) * 100)
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        Powered by Konverrt
      </footer>
    </div>
  );
}
