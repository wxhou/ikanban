'use client';

import { memo, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { COLUMNS } from '@/lib/types';
import { overdueDays } from '@/utils';
import styles from './OverdueList.module.css';

interface OverdueListProps {
  tasks: Task[];
}

const OverdueList = memo(function OverdueList({ tasks }: OverdueListProps) {
  const overdue = useMemo(() => {
    return tasks
      .filter((t) => t.due && t.status !== 'done' && t.due < new Date().toISOString().split('T')[0])
      .sort((a, b) => overdueDays(b.due) - overdueDays(a.due));
  }, [tasks]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>逾期任务</span>
        {overdue.length > 0 && (
          <span className={styles.count}>{overdue.length} 项</span>
        )}
      </div>
      <div className={styles.body}>
        {overdue.length === 0 ? (
          <div className={styles.empty}>暂无逾期任务</div>
        ) : (
          <div className={styles.list}>
            {overdue.map((t) => {
              const col = COLUMNS.find((c) => c.id === t.status);
              const days = overdueDays(t.due);
              return (
                <div key={t.id} className={styles.item}>
                  <div className={styles.itemTitle}>
                    <span className={styles.itemName}>{t.title}</span>
                    <span className={styles.daysBadge}>逾期 {days} 天</span>
                  </div>
                  <div className={styles.itemMeta}>
                    {col?.label} · {t.assignees.join(', ') || '未分配'} · 截止 {t.due}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default OverdueList;
