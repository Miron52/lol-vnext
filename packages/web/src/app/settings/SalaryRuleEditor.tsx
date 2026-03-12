'use client';

import { useState } from 'react';
import type { SalaryRuleDto, SalaryRuleTier } from '@lol/shared';

interface Props {
  initial: SalaryRuleDto | null; // null = create mode
  onSave: (data: { name: string; effectiveFrom: string; tiers: SalaryRuleTier[] }) => void;
  onCancel: () => void;
}

interface TierDraft {
  tierOrder: number;
  minProfit: string;
  maxProfit: string; // '' for null (unbounded)
  percent: string;
}

function toTierDrafts(tiers: SalaryRuleTier[]): TierDraft[] {
  return tiers.map((t) => ({
    tierOrder: t.tierOrder,
    minProfit: String(t.minProfit),
    maxProfit: t.maxProfit === null ? '' : String(t.maxProfit),
    percent: String(t.percent),
  }));
}

const defaultTier = (): TierDraft => ({
  tierOrder: 1,
  minProfit: '0',
  maxProfit: '',
  percent: '',
});

export function SalaryRuleEditor({ initial, onSave, onCancel }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [effectiveFrom, setEffectiveFrom] = useState(initial?.effectiveFrom || '');
  const [tiers, setTiers] = useState<TierDraft[]>(
    initial ? toTierDrafts(initial.tiers) : [defaultTier()],
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Tier row manipulation ──

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const newMin = last.maxProfit || '0';
    setTiers([
      // Set the current last tier to have a maxProfit if it doesn't
      ...tiers.slice(0, -1),
      { ...last, maxProfit: last.maxProfit || newMin },
      { tierOrder: tiers.length + 1, minProfit: last.maxProfit || newMin, maxProfit: '', percent: '' },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    const updated = tiers.filter((_, i) => i !== index);
    // Re-number and fix continuity
    const renumbered = updated.map((t, i) => ({ ...t, tierOrder: i + 1 }));
    // Fix minProfit continuity
    for (let i = 1; i < renumbered.length; i++) {
      renumbered[i].minProfit = renumbered[i - 1].maxProfit;
    }
    setTiers(renumbered);
  };

  const updateTier = (index: number, field: keyof TierDraft, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-chain: when maxProfit changes, update next tier's minProfit
    if (field === 'maxProfit' && index < updated.length - 1) {
      updated[index + 1] = { ...updated[index + 1], minProfit: value };
    }

    setTiers(updated);
  };

  // ── Validate and submit ──

  const handleSave = () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Rule set name is required.');
      return;
    }
    if (!effectiveFrom) {
      setValidationError('Effective from date is required.');
      return;
    }
    if (tiers.length === 0) {
      setValidationError('At least one tier is required.');
      return;
    }

    // Convert drafts to proper tiers
    const parsedTiers: SalaryRuleTier[] = [];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const minProfit = parseFloat(t.minProfit);
      const maxProfit = t.maxProfit === '' ? null : parseFloat(t.maxProfit);
      const percent = parseFloat(t.percent);

      if (isNaN(minProfit)) {
        setValidationError(`Tier ${i + 1}: invalid min profit.`);
        return;
      }
      if (t.maxProfit !== '' && isNaN(maxProfit as number)) {
        setValidationError(`Tier ${i + 1}: invalid max profit.`);
        return;
      }
      if (isNaN(percent) || percent < 0 || percent > 100) {
        setValidationError(`Tier ${i + 1}: percent must be between 0 and 100.`);
        return;
      }

      parsedTiers.push({
        tierOrder: i + 1,
        minProfit,
        maxProfit,
        percent,
      });
    }

    // Validate first tier starts at 0
    if (parsedTiers[0].minProfit !== 0) {
      setValidationError('First tier must start at min profit = $0.');
      return;
    }

    // Validate last tier is unbounded
    if (parsedTiers[parsedTiers.length - 1].maxProfit !== null) {
      setValidationError('Last tier must have empty max profit (unbounded).');
      return;
    }

    // Validate contiguity
    for (let i = 0; i < parsedTiers.length - 1; i++) {
      if (parsedTiers[i].maxProfit === null) {
        setValidationError(`Only the last tier can have unbounded max profit.`);
        return;
      }
      if ((parsedTiers[i].maxProfit as number) <= parsedTiers[i].minProfit) {
        setValidationError(`Tier ${i + 1}: max profit must be greater than min profit.`);
        return;
      }
      if (parsedTiers[i + 1].minProfit !== parsedTiers[i].maxProfit) {
        setValidationError(`Gap between tier ${i + 1} and tier ${i + 2}. Boundaries must be contiguous.`);
        return;
      }
    }

    onSave({ name: name.trim(), effectiveFrom, tiers: parsedTiers });
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.125rem' }}>
        {isEdit ? `Edit Rule Set: ${initial!.name} (v${initial!.version})` : 'Create New Rule Set'}
      </h2>

      {isEdit && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#fff8e1', borderRadius: 4, fontSize: '0.8125rem', color: '#f57f17', border: '1px solid #fff176' }}>
          Editing creates a new version (v{initial!.version + 1}). The previous version is preserved for audit.
        </div>
      )}

      {/* ── Form fields ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Rule Set Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Standard Dispatcher Tiers Q1 2026"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Effective From</label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Read-only fields ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Application Mode</label>
          <input type="text" value="Flat Rate" disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#888' }} />
        </div>
        <div>
          <label style={labelStyle}>Salary Base</label>
          <input type="text" value="Gross Profit (Gross - Driver Cost)" disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#888' }} />
        </div>
      </div>

      {/* ── Tier rows editor ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Tier Brackets</label>
          <button onClick={addTier} style={addBtnStyle}>+ Add Tier</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={tierThStyle}>#</th>
              <th style={tierThStyle}>Min Profit ($)</th>
              <th style={tierThStyle}>Max Profit ($)</th>
              <th style={tierThStyle}>Percent (%)</th>
              <th style={tierThStyle}></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={tierTdStyle}>{i + 1}</td>
                <td style={tierTdStyle}>
                  <input
                    type="number"
                    value={t.minProfit}
                    onChange={(e) => updateTier(i, 'minProfit', e.target.value)}
                    disabled={i > 0} // auto-chained from previous tier
                    style={{ ...tierInputStyle, background: i > 0 ? '#f9f9f9' : '#fff' }}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td style={tierTdStyle}>
                  <input
                    type="number"
                    value={t.maxProfit}
                    onChange={(e) => updateTier(i, 'maxProfit', e.target.value)}
                    placeholder={i === tiers.length - 1 ? '∞ (leave empty)' : ''}
                    style={tierInputStyle}
                    step="0.01"
                    min="0"
                  />
                </td>
                <td style={tierTdStyle}>
                  <input
                    type="number"
                    value={t.percent}
                    onChange={(e) => updateTier(i, 'percent', e.target.value)}
                    placeholder="e.g., 10"
                    style={tierInputStyle}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </td>
                <td style={tierTdStyle}>
                  {tiers.length > 1 && (
                    <button onClick={() => removeTier(i)} style={{ ...smallBtnStyle, color: '#d32f2f' }}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#888' }}>
          Boundaries use [min, max) semantics. Last tier must have empty max profit (unbounded). Min profit of each tier auto-chains from the previous tier.
        </div>
      </div>

      {/* ── Validation error ── */}
      {validationError && (
        <div style={{ padding: '0.75rem', background: '#fff5f5', color: '#d32f2f', borderRadius: 4, border: '1px solid #ffcdd2', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {validationError}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={handleSave} style={saveBtnStyle}>
          {isEdit ? `Save as v${initial!.version + 1}` : 'Create Rule Set'}
        </button>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
      </div>
    </div>
  );
}

// ── Styles ──

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#555',
  marginBottom: '0.25rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const tierThStyle: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
  fontWeight: 600,
  fontSize: '0.8125rem',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
};

const tierTdStyle: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
};

const tierInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.375rem 0.5rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '0.8125rem',
  boxSizing: 'border-box',
};

const addBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  background: '#fff',
  border: '1px solid #1976d2',
  color: '#1976d2',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: 500,
};

const smallBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
};

const saveBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  background: '#fff',
  color: '#333',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.875rem',
};
