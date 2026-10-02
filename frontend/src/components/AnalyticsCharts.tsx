import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function AnalyticsCharts() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.analytics.get().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="text-[var(--text-muted)] p-4 text-center">Loading analytics...</div>;

  const COLORS = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--purple)'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Tasks Completed (Timeline)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.tasksCompleted}>
              <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString()} stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
                labelFormatter={(val) => new Date(val).toLocaleDateString()}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Application Status</h3>
        <div className="h-64 flex items-center justify-center">
          {data.appStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.appStatuses}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {data.appStatuses.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-[var(--text-muted)]">No application data</div>
          )}
        </div>
      </div>
      
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Total Study Time</h3>
          <span className="text-2xl font-mono text-[var(--info)]">{data.studyHours} hours</span>
        </div>
      </div>
    </div>
  );
}
