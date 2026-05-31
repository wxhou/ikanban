'use client';

import { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Task } from '@/lib/types';
import { getAssigneeColor } from '@/utils';
import styles from './AssigneeBar.module.css';

interface AssigneeBarProps {
  tasks: Task[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { name: string; count: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{data.payload.name}</span>
      <span className={styles.tooltipValue}>{data.payload.count} 个任务</span>
    </div>
  );
}

const AssigneeBar = memo(function AssigneeBar({ tasks }: AssigneeBarProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((t) => {
      t.assignees.forEach((a) => {
        counts.set(a, (counts.get(a) ?? 0) + 1);
      });
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>人员任务分布</span>
      </div>
      <div className={styles.chartWrap}>
        {data.length === 0 ? (
          <div className={styles.empty}>暂无分配数据</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fontSize: 12, fill: 'var(--fg)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={getAssigneeColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export default AssigneeBar;
