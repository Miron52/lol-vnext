'use client';

import type { WeekDto } from '@lol/shared';

interface WeekSwitcherProps {
  weeks: WeekDto[];
  selectedWeek: WeekDto | null;
  onSelect: (weekId: string) => void;
}

export function WeekSwitcher({ weeks, selectedWeek, onSelect }: WeekSwitcherProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label
        htmlFor="week-select"
        style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        Week:
      </label>
      <select
        id="week-select"
        value={selectedWeek?.id ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          padding: '0.375rem 0.5rem',
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: '0.875rem',
          background: '#fff',
          minWidth: 220,
        }}
      >
        {weeks.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label} ({w.startDate} — {w.endDate})
            {w.isCurrent ? ' (current)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
