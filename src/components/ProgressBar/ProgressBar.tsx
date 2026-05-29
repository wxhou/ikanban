import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  label: string;
  percent: number;
  color: string;
  detail: string;
}

export default function ProgressBar({ label, percent, color, detail }: ProgressBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <span className={styles.label}>{label}</span>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${percent}%`, background: color }} />
        </div>
        <span className={styles.pct}>{percent}%</span>
      </div>
      <div className={styles.detail}>{detail}</div>
    </div>
  );
}
