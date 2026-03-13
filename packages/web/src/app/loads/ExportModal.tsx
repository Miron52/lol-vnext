'use client';

import { useState } from 'react';
import { API_PREFIX } from '@lol/shared';
import type { WeekDto } from '@lol/shared';
import { useI18n } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/errors';
import { labelStyle, inputStyle, checkboxLabelStyle, overlayStyle, modalStyle, primaryBtnStyle, secondaryBtnStyle, loadingBtnStyle, validationErrorStyle, formActionsStyle, sectionHeadingStyle, spacing } from '@/lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ExportModalProps {
  weeks: WeekDto[];
  selectedWeekId: string;
  onClose: () => void;
}

type PaymentFilter = 'all' | 'quick_pay' | 'direct';

function getPaymentOptions(t: (key: string) => string): { value: PaymentFilter; label: string }[] {
  return [
    { value: 'all', label: t('export.allLoads') },
    { value: 'quick_pay', label: t('export.quickPayOnly') },
    { value: 'direct', label: t('export.directPaymentOnly') },
  ];
}

export function ExportModal({ weeks, selectedWeekId, onClose }: ExportModalProps) {
  const { t } = useI18n();
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
      alert(t('export.complete', { count: parseInt(rowCount, 10) }));
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ ...modalStyle, width: 420, maxWidth: '90vw' }}
      >
        <h2 style={{ ...sectionHeadingStyle, marginBottom: spacing.xxl }}>{t('export.title')}</h2>

        {error && (
          <div style={validationErrorStyle}>
            {error}
          </div>
        )}

        {/* Week selector */}
        <div style={{ marginBottom: spacing.xl }}>
          <label style={labelStyle}>{t('export.week')}</label>
          <select
            style={inputStyle}
            value={weekId}
            onChange={(e) => setWeekId(e.target.value)}
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} ({w.startDate} — {w.endDate})
                {w.isCurrent ? ` (${t('common.current')})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Payment filter */}
        <div style={{ marginBottom: spacing.xl }}>
          <label style={labelStyle}>{t('export.paymentFilter')}</label>
          <select
            style={inputStyle}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
          >
            {getPaymentOptions(t).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: spacing.xl, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={onlyUnpaid}
              onChange={(e) => setOnlyUnpaid(e.target.checked)}
            />
            {t('export.onlyUnpaid')}
          </label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={excludeBrokers}
              onChange={(e) => setExcludeBrokers(e.target.checked)}
            />
            {t('export.excludeBrokers')}
          </label>
        </div>

        {/* Actions */}
        <div style={formActionsStyle}>
          <button
            type="button"
            onClick={onClose}
            style={secondaryBtnStyle}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={loadingBtnStyle(primaryBtnStyle, exporting)}
          >
            {exporting ? t('export.exporting') : t('export.downloadCsv')}
          </button>
        </div>
      </div>
    </div>
  );
}
