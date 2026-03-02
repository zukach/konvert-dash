'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { RefreshCw, CheckCircle, XCircle, Clock, Webhook } from 'lucide-react';

export default function SyncSettingsPage() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [calendlyConfig, setCalendlyConfig] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [status, history, config] = await Promise.all([
        api.getSyncStatus().catch(() => null),
        api.getSyncHistory().catch(() => []),
        api.getCalendlyConfig().catch(() => null),
      ]);
      setSyncStatus(status);
      setSyncHistory(history);
      setCalendlyConfig(config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await api.syncEmailBison();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }

  async function setupWebhook() {
    if (!webhookUrl) return;
    setSettingUp(true);
    try {
      await api.setupCalendlyWebhook(webhookUrl);
      await loadData();
      setWebhookUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setSettingUp(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sync Settings</h1>
        <p className="text-muted-foreground">
          Manage integrations with EmailBison and Calendly
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              EmailBison Sync
            </CardTitle>
            <CardDescription>
              Import campaign data from EmailBison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncStatus && (
              <div className="flex items-center gap-2 text-sm">
                {syncStatus.status === 'COMPLETED' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : syncStatus.status === 'FAILED' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
                <span>
                  Last sync: {formatDate(syncStatus.startedAt)} -{' '}
                  <Badge
                    variant={
                      syncStatus.status === 'COMPLETED'
                        ? 'success'
                        : syncStatus.status === 'FAILED'
                          ? 'destructive'
                          : 'warning'
                    }
                  >
                    {syncStatus.status}
                  </Badge>
                </span>
                {syncStatus.campaignsSynced > 0 && (
                  <span className="text-muted-foreground">
                    ({syncStatus.campaignsSynced} campaigns)
                  </span>
                )}
              </div>
            )}
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Calendly Webhook
            </CardTitle>
            <CardDescription>
              Receive meeting bookings from Calendly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {calendlyConfig ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Webhook active</span>
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  Callback: {calendlyConfig.callbackUrl}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No webhook configured. Enter your API callback URL to set up.
                </p>
                <div className="space-y-2">
                  <Label>Webhook Callback URL</Label>
                  <Input
                    placeholder="https://your-api.railway.app/api/sync/calendly/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                <Button onClick={setupWebhook} disabled={settingUp || !webhookUrl}>
                  {settingUp ? 'Setting up...' : 'Setup Webhook'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync history yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Campaigns Synced</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncHistory.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.source}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'COMPLETED'
                            ? 'success'
                            : s.status === 'FAILED'
                              ? 'destructive'
                              : 'warning'
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.campaignsSynced}</TableCell>
                    <TableCell>{formatDate(s.startedAt)}</TableCell>
                    <TableCell>
                      {s.completedAt ? formatDate(s.completedAt) : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate">
                      {s.errorMessage || '-'}
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
