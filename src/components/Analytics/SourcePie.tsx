'use client';

import { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Task, TaskSource } from '@/lib/types';
import styles from './SourcePie.module.css';

const COLORS: Record<TaskSource, string> = {
  jiafang: '#2f6feb',
  internal: '#71717a',
};

const LABELS: Record<TaskSource, string> = {
  jiafang: '甲方',
  internal: '内部',
};

interface SourcePieProps {
  tasks: Task[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { name: string; value: number; percent: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{data.name}</span>
      <span className={styles.tooltipValue}>
        {data.value} 项 ({(data.payload.percent * 100).toFixed(0)}%)
      </span>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className={styles.legend}>
      {payload.map((entry) => (
        <div key={entry.value} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: entry.color }} />
          <span className={styles.legendLabel}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const SourcePie = memo(function SourcePie({ tasks }: SourcePieProps) {
  const data = useMemo(() => {
    const counts: Record<TaskSource, number> = { jiafang: 0, internal: 0 };
    tasks.forEach((t) => { counts[t.source]++; });
    return (Object.keys(counts) as TaskSource[])
      .map((key) => ({ name: LABELS[key], value: counts[key], fill: COLORS[key] }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>来源分布</span>
      </div>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              strokeWidth={2}
              stroke="var(--surface)"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default SourcePie;
