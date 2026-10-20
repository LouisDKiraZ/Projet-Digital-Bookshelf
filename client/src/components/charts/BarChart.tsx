import styles from './BarChart.module.css';

export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  ariaLabel: string;
  valueFormatter?: (value: number) => string;
}

// A single-series "compare magnitude" bar chart: one flat brand color,
// value always shown at the bar's end (so nothing is only reachable on
// hover), horizontal so long category labels (author names, display
// names...) don't need to be rotated.
export function BarChart({ data, ariaLabel, valueFormatter }: BarChartProps) {
  if (data.length === 0) {
    return <p className={styles.empty}>No data yet for this criterion.</p>;
  }

  const maxValue = Math.max(...data.map((datum) => datum.value), 1);
  const format = valueFormatter ?? ((value: number) => value.toLocaleString());

  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel}>
      {data.map((datum) => (
        <div
          key={datum.label}
          className={styles.row}
          title={`${datum.label}: ${format(datum.value)}`}
        >
          <span className={styles.label}>{datum.label}</span>
          <div className={styles.track}>
            <div
              className={styles.bar}
              style={{ width: `${Math.max((datum.value / maxValue) * 100, 2)}%` }}
            />
          </div>
          <span className={styles.value}>{format(datum.value)}</span>
        </div>
      ))}
    </div>
  );
}
