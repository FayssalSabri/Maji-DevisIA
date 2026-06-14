import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useAppContext } from '../../context/AppContext';

export const AnalyticsChart = () => {
  const { state } = useAppContext();

  // Create mock data or aggregate from history
  const data = [
    { name: 'Jan', devis: 12, CA: 45000 },
    { name: 'Fév', devis: 19, CA: 68000 },
    { name: 'Mar', devis: 15, CA: 52000 },
    { name: 'Avr', devis: 22, CA: 81000 },
    { name: 'Mai', devis: 28, CA: 95000 },
    { name: 'Juin', devis: 35, CA: 125000 }
  ];

  return (
    <div className="card fade-in" style={{ animationDelay: '300ms', marginBottom: '24px' }}>
      <div className="card-header">
        <div className="card-title">Évolution du Chiffre d'Affaires & Devis</div>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val / 1000}k€`}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Area
              type="monotone"
              dataKey="CA"
              stroke="var(--accent)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCA)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
