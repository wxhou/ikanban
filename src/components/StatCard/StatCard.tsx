import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  change: string;
  changeType: "up" | "neutral" | "warn";
  colorIndex: number;
}

export default function StatCard({ label, value, change, changeType, colorIndex }: StatCardProps) {
  return (
    <div className={styles.card} style={{ ["--bar-color" as string]: ["var(--muted)", "var(--accent)", "var(--warn)", "var(--success)"][colorIndex] }}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={`${styles.change} ${styles[changeType]}`}>{change}</div>
    </div>
  );
}
