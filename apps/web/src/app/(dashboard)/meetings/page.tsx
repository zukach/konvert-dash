'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import { AlertTriangle } from 'lucide-react';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conversionFilter, setConversionFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [m, c, u] = await Promise.all([
        api.getMeetings(),
        api.getClients(),
        api.getUnassignedMeetings(),
      ]);
      setMeetings(m);
      setClients(c);
      setUnassignedCount(u.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateMeeting(meetingId: string, data: any) {
    try {
      await api.updateMeeting(meetingId, data);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = meetings.filter((m) => {
    if (clientFilter === 'unassigned' && m.clientId) return false;
    if (clientFilter && clientFilter !== 'unassigned' && m.clientId !== clientFilter) return false;
    if (statusFilter && m.meetingStatus !== statusFilter) return false;
    if (conversionFilter && m.conversionStatus !== conversionFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading meetings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meetings</h1>
        <p className="text-muted-foreground">
          Track meeting outcomes and conversions
        </p>
      </div>

      {unassignedCount > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {unassignedCount} unassigned meeting{unassignedCount !== 1 ? 's' : ''} need
              to be assigned to a client.
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
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
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SHOWED_UP">Showed Up</option>
              <option value="NO_SHOW">No Show</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            <Select
              value={conversionFilter}
              onChange={(e) => setConversionFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Conversions</option>
              <option value="PENDING">Pending</option>
              <option value="CONVERTED">Converted</option>
              <option value="NOT_CONVERTED">Not Converted</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invitee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow
                  key={m.id}
                  className={!m.clientId ? 'bg-yellow-50' : ''}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{m.inviteeName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.inviteeEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(m.startTime)}</TableCell>
                  <TableCell>{m.eventTypeName || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={m.clientId || ''}
                      onChange={(e) =>
                        updateMeeting(m.id, {
                          clientId: e.target.value || null,
                        })
                      }
                      className="w-40"
                    >
                      <option value="">Unassigned</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={m.meetingStatus}
                      onChange={(e) =>
                        updateMeeting(m.id, { meetingStatus: e.target.value })
                      }
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
                      onChange={(e) =>
                        updateMeeting(m.id, {
                          conversionStatus: e.target.value,
                        })
                      }
                      className="w-36"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="NOT_CONVERTED">Not Converted</option>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No meetings found. Set up Calendly webhooks to receive meetings.
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
