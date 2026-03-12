'use client';

import { useState } from 'react';
import type { SalaryAdjustment } from '@lol/shared';

/** Input row — no audit fields, those are stamped by the backend. */
interface AdjustmentInput {
  type: 'other' | 'bonus';
  amount: number;
  note: string;
}

interface Props {
  dispatcherName: string;
  existingAdjustments: SalaryAdjustment[];
  onSave: (adjustments: AdjustmentInput[]) => void;
  onClose: () => void;
}

export function AdjustmentModal({ dispatcherName, existingAdjustments, onSave, onClose }: Props) {
  const [adjustments, setAdjustments] = useState<AdjustmentInput[]>(
    existingAdjustments.length > 0
      ? existingAdjustments.map((a) => ({ type: a.type, amount: a.amount, note: a.note }))
      : [],
  );
  const [error, setError] = useState<string | null>(null);

  const addRow = (type: 'other' | 'bonus') => {
    setAdjustments([...adjustments, { type, amount: 0, note: '' }]);
  };

  const updateRow = (index: number, field: keyof AdjustmentInput, value: string | number) => {
    const updated = [...adjustments];
    updated[index] = { ...updated[index], [field]: value };
    setAdjustments(updated);
  };

  const removeRow = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setError(null);
    for (let i = 0; i < adjustments.length; i++) {
      const a = adjustments[i];
      if (!a.note.trim()) {
        setError(`Row ${i + 1}: a note is required.`);
        return;
      }
      if (a.type === 'bonus' && a.amount < 0) {
        setError(`Row ${i + 1}: bonus must be >= 0.`);
        return;
      }
    }
    onSave(adjustments);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
          Adjustments for {dispatcherName}
        </h3>

        {adjustments.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.875rem', margin: '0.5rem 0 1rem' }}>
            No adjustments yet. Add Other or Bonus entries below.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Amount ($)</th>
                <th style={thStyle}>Note</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: a.type === 'bonus' ? '#e8f5e9' : '#f3e5f5',
                      color: a.type === 'bonus' ? '#2e7d32' : '#7b1fa2',
                    }}>
                      {a.type === 'bonus' ? 'Bonus' : 'Other'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={a.amount}
                      onChange={(e) => updateRow(i, 'amount', parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                      step="0.01"
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={a.note}
                      onChange={(e) => updateRow(i, 'note', e.target.value)}
                      placeholder="Required note..."
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => removeRow(i)} style={removeBtnStyle}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button onClick={() => addRow('other')} style={addBtnStyle}>+ Other</button>
          <button onClick={() => addRow('bonus')} style={{ ...addBtnStyle, borderColor: '#2e7d32', color: '#2e7d32' }}>+ Bonus</button>
        </div>

        {error && (
          <div style={{ padding: '0.5rem', background: '#fff5f5', color: '#d32f2f', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} style={saveBtnStyle}>Save Adjustments</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: '1.5rem', width: '90%', maxWidth: 600,
  maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
};
const thStyle: React.CSSProperties = { padding: '0.375rem 0.5rem', fontWeight: 600, fontSize: '0.8125rem', borderBottom: '2px solid #ddd' };
const tdStyle: React.CSSProperties = { padding: '0.375rem 0.5rem' };
const inputStyle: React.CSSProperties = { padding: '0.375rem 0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.8125rem' };
const addBtnStyle: React.CSSProperties = { padding: '0.25rem 0.75rem', background: '#fff', border: '1px solid #7b1fa2', color: '#7b1fa2', borderRadius: 4, cursor: 'pointer', fontSize: '0.8125rem' };
const removeBtnStyle: React.CSSProperties = { padding: '0.125rem 0.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: '1rem', color: '#d32f2f', fontWeight: 600 };
const cancelBtnStyle: React.CSSProperties = { padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem' };
const saveBtnStyle: React.CSSProperties = { padding: '0.5rem 1rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 };
