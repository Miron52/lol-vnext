'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { LoadStatus, calcFinanceBreakdown } from '@lol/shared';
import type { WeekDto } from '@lol/shared';
import { getErrorMessage } from '@/lib/errors';
import { labelStyle, inputStyle, sectionStyle, sectionTitleStyle, gridTwo, gridThree, fmt as fmtCurrency } from '@/lib/styles';

// ── Form data shape ─────────────────────────────────────────
export interface LoadFormData {
  sylNumber: string;
  weekId: string;
  date: string;
  dispatcherId: string;
  businessName: string;
  fromAddress: string;
  fromState: string;
  fromDate: string;
  toAddress: string;
  toState: string;
  toDate: string;
  miles: string;        // string for input; parsed to number on submit
  grossAmount: string;
  driverCostAmount: string;
  // optional
  unitId: string;
  driverId: string;
  brokerageId: string;
  netsuiteRef: string;
  comment: string;
  quickPayFlag: boolean;
  directPaymentFlag: boolean;
  factoringFlag: boolean;
  driverPaidFlag: boolean;
  loadStatus: string;
}

export function emptyFormData(defaults?: Partial<LoadFormData>): LoadFormData {
  return {
    sylNumber: '',
    weekId: '',
    date: '',
    dispatcherId: '',
    businessName: '',
    fromAddress: '',
    fromState: '',
    fromDate: '',
    toAddress: '',
    toState: '',
    toDate: '',
    miles: '0',
    grossAmount: '0',
    driverCostAmount: '0',
    unitId: '',
    driverId: '',
    brokerageId: '',
    netsuiteRef: '',
    comment: '',
    quickPayFlag: false,
    directPaymentFlag: false,
    factoringFlag: false,
    driverPaidFlag: false,
    loadStatus: LoadStatus.NotPickedUp,
    ...defaults,
  };
}

// ── Validation ──────────────────────────────────────────────
const REQUIRED_FIELDS: { key: keyof LoadFormData; label: string }[] = [
  { key: 'sylNumber', label: 'SYL Number' },
  { key: 'weekId', label: 'Week' },
  { key: 'date', label: 'Load Date' },
  { key: 'dispatcherId', label: 'Dispatcher ID' },
  { key: 'businessName', label: 'Business Name' },
  { key: 'fromAddress', label: 'From Address' },
  { key: 'fromState', label: 'From State' },
  { key: 'fromDate', label: 'From Date' },
  { key: 'toAddress', label: 'To Address' },
  { key: 'toState', label: 'To State' },
  { key: 'toDate', label: 'To Date' },
];

function validate(data: LoadFormData): string[] {
  const errors: string[] = [];
  for (const { key, label } of REQUIRED_FIELDS) {
    const v = data[key];
    if (typeof v === 'string' && v.trim() === '') {
      errors.push(`${label} is required`);
    }
  }
  const gross = parseFloat(data.grossAmount);
  if (isNaN(gross) || gross < 0) errors.push('Gross Amount must be a non-negative number');
  const driverCost = parseFloat(data.driverCostAmount);
  if (isNaN(driverCost) || driverCost < 0) errors.push('Driver Cost must be a non-negative number');
  const miles = parseFloat(data.miles);
  if (isNaN(miles) || miles < 0) errors.push('Miles must be a non-negative number');
  return errors;
}

// ── Status labels ───────────────────────────────────────────
const STATUS_OPTIONS: { value: LoadStatus; label: string }[] = [
  { value: LoadStatus.NotPickedUp, label: 'Not Picked Up' },
  { value: LoadStatus.InTransit, label: 'In Transit' },
  { value: LoadStatus.Delivered, label: 'Delivered' },
  { value: LoadStatus.Completed, label: 'Completed' },
  { value: LoadStatus.Cancelled, label: 'Cancelled' },
];

// ── Props ───────────────────────────────────────────────────
interface LoadFormProps {
  initialData: LoadFormData;
  weeks: WeekDto[];
  onSubmit: (data: LoadFormData) => Promise<void>;
  submitLabel: string;
  title: string;
  /** Disable weekId + sylNumber on edit */
  isEdit?: boolean;
  /** When true, all fields are disabled and submit button is hidden (archived loads). */
  readOnly?: boolean;
}

// ── Finance preview (read-only derived values) ──────────────
function FinancePreview({ grossAmount, driverCostAmount }: { grossAmount: string; driverCostAmount: string }) {
  const breakdown = useMemo(() => {
    const gross = parseFloat(grossAmount) || 0;
    const driver = parseFloat(driverCostAmount) || 0;
    return calcFinanceBreakdown(gross, driver);
  }, [grossAmount, driverCostAmount]);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.25rem 0',
    fontSize: '0.8125rem',
  };

  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        background: '#f0f7ff',
        borderRadius: 4,
        border: '1px solid #c8ddf5',
      }}
    >
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: '0.375rem' }}>
        Finance Breakdown (preview)
      </div>
      <div style={rowStyle}>
        <span>Profit</span>
        <span style={{ fontWeight: 600, color: breakdown.profitAmount >= 0 ? '#2e7d32' : '#d32f2f' }}>
          {fmtCurrency(breakdown.profitAmount)}
        </span>
      </div>
      <div style={rowStyle}>
        <span>Profit %</span>
        <span style={{ fontWeight: 600, color: breakdown.profitPercent >= 0 ? '#2e7d32' : '#d32f2f' }}>
          {breakdown.profitPercent.toFixed(2)}%
        </span>
      </div>
      <div style={rowStyle}>
        <span>OTR (1.25%)</span>
        <span style={{ fontWeight: 600 }}>{fmtCurrency(breakdown.otrAmount)}</span>
      </div>
      <div style={{ ...rowStyle, borderTop: '1px solid #c8ddf5', paddingTop: '0.375rem', marginTop: '0.125rem' }}>
        <span style={{ fontWeight: 600 }}>Net Profit</span>
        <span style={{ fontWeight: 600, color: breakdown.netProfitAmount >= 0 ? '#2e7d32' : '#d32f2f' }}>
          {fmtCurrency(breakdown.netProfitAmount)}
        </span>
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────
export function LoadForm({
  initialData,
  weeks,
  onSubmit,
  submitLabel,
  title,
  isEdit = false,
  readOnly = false,
}: LoadFormProps) {
  const [form, setForm] = useState<LoadFormData>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof LoadFormData>(key: K, value: LoadFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setErrors([]);
    setApiError(null);

    const validationErrors = validate(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = readOnly;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem' }}>{title}</h2>
      <fieldset disabled={disabled} style={{ border: 'none', padding: 0, margin: 0, opacity: disabled ? 0.75 : 1 }}>

      {/* ── Validation errors ── */}
      {errors.length > 0 && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: '#fff5f5',
            border: '1px solid #ffcdd2',
            borderRadius: 4,
            fontSize: '0.8125rem',
            color: '#d32f2f',
          }}
        >
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      {/* ── API error ── */}
      {apiError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: '#fff5f5',
            border: '1px solid #ffcdd2',
            borderRadius: 4,
            fontSize: '0.8125rem',
            color: '#d32f2f',
          }}
        >
          {apiError}
        </div>
      )}

      {/* ── Identity section ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Load Identity</h3>
        <div style={gridTwo}>
          <div>
            <label style={labelStyle}>SYL Number *</label>
            <input
              style={inputStyle}
              value={form.sylNumber}
              onChange={(e) => set('sylNumber', e.target.value)}
              disabled={isEdit || disabled}
              placeholder="TLS26-11-01"
            />
          </div>
          <div>
            <label style={labelStyle}>Week *</label>
            <select
              style={inputStyle}
              value={form.weekId}
              onChange={(e) => set('weekId', e.target.value)}
              disabled={isEdit || disabled}
            >
              <option value="">-- select week --</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.startDate} — {w.endDate})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ ...gridTwo, marginTop: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Load Date *</label>
            <input
              type="date"
              style={inputStyle}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={form.loadStatus}
              onChange={(e) => set('loadStatus', e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Business section ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Business</h3>
        <div style={gridTwo}>
          <div>
            <label style={labelStyle}>Business Name *</label>
            <input
              style={inputStyle}
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Dispatcher ID *</label>
            <input
              style={inputStyle}
              value={form.dispatcherId}
              onChange={(e) => set('dispatcherId', e.target.value)}
              placeholder="UUID"
            />
          </div>
        </div>
        <div style={{ ...gridThree, marginTop: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Unit ID</label>
            <input
              style={inputStyle}
              value={form.unitId}
              onChange={(e) => set('unitId', e.target.value)}
              placeholder="UUID (optional)"
            />
          </div>
          <div>
            <label style={labelStyle}>Driver ID</label>
            <input
              style={inputStyle}
              value={form.driverId}
              onChange={(e) => set('driverId', e.target.value)}
              placeholder="UUID (optional)"
            />
          </div>
          <div>
            <label style={labelStyle}>Brokerage ID</label>
            <input
              style={inputStyle}
              value={form.brokerageId}
              onChange={(e) => set('brokerageId', e.target.value)}
              placeholder="UUID (optional)"
            />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>Netsuite Ref</label>
          <input
            style={inputStyle}
            value={form.netsuiteRef}
            onChange={(e) => set('netsuiteRef', e.target.value)}
          />
        </div>
      </div>

      {/* ── Route section ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Route</h3>
        <div style={gridThree}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>From Address *</label>
            <input
              style={inputStyle}
              value={form.fromAddress}
              onChange={(e) => set('fromAddress', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>From State *</label>
            <input
              style={inputStyle}
              value={form.fromState}
              onChange={(e) => set('fromState', e.target.value)}
              maxLength={10}
              placeholder="TX"
            />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>From Date *</label>
          <input
            type="date"
            style={{ ...inputStyle, maxWidth: 200 }}
            value={form.fromDate}
            onChange={(e) => set('fromDate', e.target.value)}
          />
        </div>
        <div style={{ ...gridThree, marginTop: '0.75rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>To Address *</label>
            <input
              style={inputStyle}
              value={form.toAddress}
              onChange={(e) => set('toAddress', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>To State *</label>
            <input
              style={inputStyle}
              value={form.toState}
              onChange={(e) => set('toState', e.target.value)}
              maxLength={10}
              placeholder="MS"
            />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>To Date *</label>
          <input
            type="date"
            style={{ ...inputStyle, maxWidth: 200 }}
            value={form.toDate}
            onChange={(e) => set('toDate', e.target.value)}
          />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>Miles</label>
          <input
            type="number"
            min="0"
            step="0.01"
            style={{ ...inputStyle, maxWidth: 150 }}
            value={form.miles}
            onChange={(e) => set('miles', e.target.value)}
          />
        </div>
      </div>

      {/* ── Financials section ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Financials</h3>
        <div style={gridTwo}>
          <div>
            <label style={labelStyle}>Gross Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              style={inputStyle}
              value={form.grossAmount}
              onChange={(e) => set('grossAmount', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Driver Cost *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              style={inputStyle}
              value={form.driverCostAmount}
              onChange={(e) => set('driverCostAmount', e.target.value)}
            />
          </div>
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#888' }}>
          All derived values below are computed by the server. This is a preview only.
        </p>

        {/* ── Read-only finance breakdown (live preview) ── */}
        <FinancePreview grossAmount={form.grossAmount} driverCostAmount={form.driverCostAmount} />
      </div>

      {/* ── Flags section ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Flags</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          {(
            [
              ['quickPayFlag', 'Quick Pay'],
              ['directPaymentFlag', 'Direct Payment'],
              ['factoringFlag', 'Factoring'],
              ['driverPaidFlag', 'Driver Paid'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Comment ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Notes</h3>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={form.comment}
          onChange={(e) => set('comment', e.target.value)}
          placeholder="Optional comment..."
        />
      </div>

      </fieldset>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {readOnly ? 'Back' : 'Cancel'}
        </button>
        {!readOnly && (
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.5rem 1.5rem',
              background: submitting ? '#999' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: submitting ? 'default' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
