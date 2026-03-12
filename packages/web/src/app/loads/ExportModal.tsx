'use client';

import { useState } from 'react';
import { API_PREFIX } from '@lol/shared';
import type { WeekDto } from '@lol/shared';
import { getErrorMessage } from '@/lib/errors';
import { labelStyle, inputStyle, checkboxLabelStyle } from '@/lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ExportModalProps {
  weeks: WeekDto[];
  selectedWeekId: string;
  onClose: () => void;
}

type PaymentFilter = 'all' | 'quick_pay' | 'direct';

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'All Loads' },
  { value: 'quick_pay', label: 'Quick Pay Only' },
  { value: 'direct', label: 'Direct Payment Only' },
];

export function ExportModal({ weeks, selectedWeekId, onClose }: ExportModalProps) {
  const [weekId, setWeekId] = useState(selectedWeekId);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [excludeBrokers, setExcludeBrokers] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setExporting(true);

    try {
      const token =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem('lol_token')
          : null;

      const params = new URLSearchParams({
        weekId,
        paymentFilter,
        onlyUnpaid: String(onlyUnpaid),
        excludeBrokers: String(excludeBrokers),
      });

      const res = await fetch(
        `${API_URL}${API_PREFIX}/loads/export?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Export failed (${res.status})`);
      }

      const rowCount = res.headers.get('X-Export-Row-Count') || '0';

      // Download the CSV
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition or generate one
      const cd = res.headers.get('Content-Disposition');
      const filenameMatch = cd?.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch?.[1] || `loads-export-${Date.now()}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success briefly, then close
      setError(null);
      alert(`Export complete: ${rowCount} row(s) exported.`);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '1.5rem',
          width: 420,
          maxWidth: '90vw',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.125rem' }}>Export Loads</h2>

        {error && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              marginBottom: '1rem',
              background: '#fff5f5',
              border: '1px solid #ffcdd2',
              borderRadius: 4,
              fontSize: '0.8125rem',
              color: '#d32f2f',
            }}
          >
            {error}
          </div>
        )}

        {/* Week selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Week</label>
          <select
            style={inputStyle}
            value={weekId}
            onChange={(e) => setWeekId(e.target.value)}
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} ({w.startDate} — {w.endDate})
                {w.isCurrent ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Payment filter */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Payment Filter</label>
          <select
            style={inputStyle}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={onlyUnpaid}
              onChange={(e) => setOnlyUnpaid(e.target.checked)}
            />
            Only Unpaid (driver not paid)
          </label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={excludeBrokers}
              onChange={(e) => setExcludeBrokers(e.target.checked)}
            />
            Exclude Brokers
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: '0.5rem 1.25rem',
              background: exporting ? '#999' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: exporting ? 'default' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {exporting ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
