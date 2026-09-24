import { RangeStats } from '@/lib/glucose';

/** Share of readings that were low, in range and high, as one stacked bar. */
const RangeBar = ({ stats }: { stats: RangeStats }) => {
  const parts = [
    { label: 'Low', n: stats.low, bar: 'bg-low', dot: 'bg-low' },
    { label: 'In range', n: stats.inRange, bar: 'bg-in-range', dot: 'bg-in-range' },
    { label: 'High', n: stats.high, bar: 'bg-high', dot: 'bg-high' },
  ];
  return (
    <div>
      <div
        className="flex h-5 rounded-full overflow-hidden gap-0.5 bg-muted"
        role="img"
        aria-label={parts.map((p) => `${p.label}: ${p.n} of ${stats.count}`).join(', ')}
      >
        {parts.filter((p) => p.n > 0).map((p) => (
          <div key={p.label} className={p.bar} style={{ width: `${(p.n / stats.count) * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
            {p.label} <span className="text-muted-foreground tabular">{p.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RangeBar;
