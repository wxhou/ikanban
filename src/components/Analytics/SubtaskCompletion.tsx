'use client';

import { memo, useMemo } from 'react';
import type { Task } from '@/lib/types';
import styles from './SubtaskCompletion.module.css';

interface SubtaskCompletionProps {
  tasks: Task[];
}

const SubtaskCompletion = memo(function SubtaskCompletion({ tasks }: SubtaskCompletionProps) {
  const { total, done, pct } = useMemo(() => {
    let total = 0;
    let done = 0;
    tasks.forEach((t) => {
      t.subtasks.forEach((s) => {
        total++;
        if (s.done) done++;
      });
    });
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const barColor =
    pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--danger)';

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>子任务完成率</span>
      </div>
      <div className={styles.body}>
        {total === 0 ? (
          <div className={styles.empty}>暂无子任务</div>
        ) : (
          <div className={styles.content}>
            <div className={styles.ringWrap}>
              <svg width="96" height="96" viewBox="0 0 96 96" className={styles.ring}>
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke="var(--bg)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={barColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 48 48)"
                  className={styles.ringFill}
                />
              </svg>
              <span className={styles.ringLabel}>{pct}%</span>
            </div>
            <div className={styles.info}>
              <span className={styles.countText}>
                {done}/{total} 子任务已完成
              </span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SubtaskCompletion;
