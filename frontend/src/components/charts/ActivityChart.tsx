'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const data = [
  { date: 'Mon', ct: 45, us: 32 },
  { date: 'Tue', ct: 52, us: 28 },
  { date: 'Wed', ct: 61, us: 35 },
  { date: 'Thu', ct: 48, us: 40 },
  { date: 'Fri', ct: 55, us: 38 },
  { date: 'Sat', ct: 38, us: 25 },
  { date: 'Sun', ct: 32, us: 22 },
];

export default function ActivityChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorUs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="date"
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--color-text-primary)' }}
        />
        <Area
          type="monotone"
          dataKey="ct"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCt)"
          name="CT Scans"
        />
        <Area
          type="monotone"
          dataKey="us"
          stroke="#06b6d4"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorUs)"
          name="Ultrasound"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
