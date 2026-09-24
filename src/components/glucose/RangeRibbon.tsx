import { useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  GlucoseZone, LOW, ReadingKind, SCALE_MAX, SCALE_MIN, Targets, VERY_HIGH, VERY_LOW, toPct, upperFor, zoneClass, zoneMeta, zoneOf,
} from '@/lib/glucose';

interface Props {
  value: number | null;
  kind: ReadingKind;
  targets: Targets;
  /** Makes the ribbon a draggable slider */
  onChange?: (v: number) => void;
  className?: string;
}

/**
 * The glucose scale from 40 to 300 mg/dL with each zone painted in, and a pin
 * where the reading sits. Doubles as a slider in the log sheet.
 */
const RangeRibbon = ({ value, kind, targets, onChange, className }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const upper = upperFor(kind, targets);
  const zone = value != null ? zoneOf(value, kind, targets) : null;

  const segments: { from: number; to: number; zone: GlucoseZone }[] = [
    { from: SCALE_MIN, to: VERY_LOW, zone: 'very-low' },
    { from: VERY_LOW, to: LOW, zone: 'low' },
    { from: LOW, to: upper, zone: 'in-range' },
    { from: upper, to: VERY_HIGH, zone: 'high' },
    { from: VERY_HIGH, to: SCALE_MAX, zone: 'very-high' },
  ];

  const valueFromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(SCALE_MIN + ratio * (SCALE_MAX - SCALE_MIN));
  };

  const interactive = !!onChange;

  return (
    <div className={cn('select-none', className)}>
      <div
        ref={trackRef}
        className={cn('relative h-14 touch-none', interactive && 'cursor-pointer')}
        role={interactive ? 'slider' : 'img'}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? 'Blood sugar' : `Blood sugar scale${value != null ? `, ${value} mg/dL, ${zoneMeta[zone!].label}` : ''}`}
        aria-valuemin={interactive ? SCALE_MIN : undefined}
        aria-valuemax={interactive ? SCALE_MAX : undefined}
        aria-valuenow={interactive ? value ?? undefined : undefined}
        aria-valuetext={interactive && value != null ? `${value} mg/dL, ${zoneMeta[zone!].label}` : undefined}
        onPointerDown={interactive ? (e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onChange!(valueFromPointer(e.clientX));
        } : undefined}
        onPointerMove={interactive ? (e) => {
          if (e.buttons) onChange!(valueFromPointer(e.clientX));
        } : undefined}
        onKeyDown={interactive ? (e) => {
          const step = e.shiftKey ? 10 : 1;
          const v = value ?? 100;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange!(Math.min(SCALE_MAX, v + step)); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange!(Math.max(SCALE_MIN, v - step)); }
        } : undefined}
      >
        {/* Zones */}
        <div className="absolute inset-x-0 top-6 h-4 flex rounded-full overflow-hidden">
          {segments.map((s) => (
            <div
              key={s.zone}
              className={cn(zoneClass[s.zone].bg, zone && s.zone !== zone ? 'opacity-30' : 'opacity-90', 'transition-opacity')}
              style={{ width: `${toPct(s.to) - toPct(s.from)}%` }}
            />
          ))}
        </div>

        {/* Pin */}
        {value != null && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-[left] duration-150 ease-out"
            style={{ left: `${toPct(value)}%` }}
          >
            <div className={cn(
              'w-7 h-7 mt-[18px] rounded-full border-4 border-card shadow-md',
              zoneClass[zone!].bg,
              interactive && 'w-9 h-9 mt-3 ring-2 ring-foreground/10',
            )} />
          </div>
        )}
      </div>

      {/* Scale labels */}
      <div className="relative h-5 text-xs text-muted-foreground tabular">
        {[LOW, upper, VERY_HIGH].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${toPct(t)}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RangeRibbon;
