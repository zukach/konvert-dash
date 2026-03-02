'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimelineChartProps {
  data: Array<{
    date: string;
    emailsSent: number;
    replied: number;
    opened: number;
  }>;
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No timeline data available. Run a sync to populate.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          }
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="emailsSent"
          stroke="#3b82f6"
          name="Emails Sent"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="opened"
          stroke="#8b5cf6"
          name="Opened"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="replied"
          stroke="#10b981"
          name="Replied"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
