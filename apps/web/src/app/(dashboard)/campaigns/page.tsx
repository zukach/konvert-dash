'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { formatNumber, formatPercent } from '@/lib/utils';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkClientId, setBulkClientId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [c, cl] = await Promise.all([
        api.getCampaigns(),
        api.getClients(),
      ]);
      setCampaigns(c);
      setClients(cl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function assignToClient(campaignId: string, clientId: string) {
    try {
      await api.updateCampaign(campaignId, {
        clientId: clientId || null,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function bulkAssign() {
    if (!bulkClientId || selected.length === 0) return;
    try {
      await api.bulkAssignCampaigns({
        campaignIds: selected,
        clientId: bulkClientId,
      });
      setSelected([]);
      setBulkClientId('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = campaigns.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (clientFilter === 'unassigned' && c.clientId) return false;
    if (clientFilter && clientFilter !== 'unassigned' && c.clientId !== clientFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground">
          View and assign campaigns to clients
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
              <option value="DRAFT">Draft</option>
              <option value="STOPPED">Stopped</option>
            </Select>
            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-48"
            >
              <option value="">All Clients</option>
              <option value="unassigned">Unassigned</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-sm font-medium">
              {selected.length} selected
            </span>
            <Select
              value={bulkClientId}
              onChange={(e) => setBulkClientId(e.target.value)}
              className="w-48"
            >
              <option value="">Assign to...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={bulkAssign} disabled={!bulkClientId}>
              Bulk Assign
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected([])}
            >
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? filtered.map((c) => c.id) : [],
                      )
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Opened</TableHead>
                <TableHead className="text-right">Replied</TableHead>
                <TableHead className="text-right">Reply Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className={!c.clientId ? 'bg-yellow-50' : ''}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, c.id]
                            : selected.filter((s) => s !== c.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'ACTIVE'
                          ? 'success'
                          : c.status === 'COMPLETED'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={c.clientId || ''}
                      onChange={(e) => assignToClient(c.id, e.target.value)}
                      className="w-40"
                    >
                      <option value="">Unassigned</option>
                      {clients.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(c.emailsSent)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(c.opened)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(c.replied)}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.emailsSent
                      ? formatPercent((c.replied / c.emailsSent) * 100)
                      : '0%'}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No campaigns found. Sync from EmailBison to import campaigns.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
