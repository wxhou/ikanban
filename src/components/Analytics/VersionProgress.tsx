'use client';

import { memo, useMemo } from 'react';
import type { Task } from '@/lib/types';
import styles from './VersionProgress.module.css';

interface VersionProgressProps {
  tasks: Task[];
}

interface VersionStat {
  id: number;
  label: string;
  total: number;
  done: number;
  pct: number;
}

const VersionProgress = memo(function VersionProgress({ tasks }: VersionProgressProps) {
  const versions = useMemo<VersionStat[]>(() => {
    const grouped = new Map<number, { total: number; done: number }>();
    tasks.forEach((t) => {
      if (t.versionId == null) return;
      const prev = grouped.get(t.versionId) ?? { total: 0, done: 0 };
      prev.total++;
      if (t.status === 'done') prev.done++;
      grouped.set(t.versionId, prev);
    });
    return [...grouped.entries()]
      .map(([id, stat]) => ({
        id,
        label: `V${id}`,
        total: stat.total,
        done: stat.done,
        pct: stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0,
      }))
      .sort((a, b) => a.id - b.id);
  }, [tasks]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>版本进度</span>
      </div>
      <div className={styles.body}>
        {versions.length === 0 ? (
          <div className={styles.empty}>暂无版本数据</div>
        ) : (
          versions.map((v) => {
            const barColor =
              v.pct >= 80 ? 'var(--success)' : v.pct >= 50 ? 'var(--warn)' : 'var(--danger)';
            return (
              <div key={v.id} className={styles.row}>
                <div className={styles.rowHeader}>
                  <span className={styles.versionName}>{v.label}</span>
                  <span className={styles.versionStat}>
                    {v.done}/{v.total} 已完成
                  </span>
                  <span className={styles.versionPct} style={{ color: barColor }}>
                    {v.pct}%
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${v.pct}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default VersionProgress;
