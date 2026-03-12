'use client';

import type { StatementDto } from '@lol/shared';

interface PreviewProps {
  statement: StatementDto;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const thStyle: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
  textAlign: 'left',
  borderBottom: '2px solid #e0e0e0',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#666',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.375rem 0.5rem',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
};

const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

function FlagCell({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? '#388e3c' : '#bdbdbd', fontWeight: value ? 600 : 400 }}>
      {value ? 'Y' : '-'}
    </span>
  );
}

export function StatementPreview({ statement, onSave, onClose, saving }: PreviewProps) {
  const { snapshot } = statement;
  const isSaved = !!statement.id;

  return (
    <div>
      {/* Read-only indicator for saved statements */}
      {isSaved && (
        <div style={{
          padding: '0.5rem 0.75rem',
          marginBottom: '0.75rem',
          background: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: 4,
          fontSize: '0.8125rem',
          color: '#0d47a1',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{
            display: 'inline-block',
            padding: '1px 8px',
            borderRadius: 3,
            fontSize: '0.625rem',
            fontWeight: 700,
            background: '#0d47a1',
            color: '#fff',
          }}>
            SNAPSHOT
          </span>
          <span>
            This statement is a read-only snapshot generated on {new Date(statement.generatedAt).toLocaleString()}.
          </span>
        </div>
      )}

      {/* Header info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>
            {statement.statementType === 'driver' ? 'Driver' : 'Owner'} Statement
          </span>
          <span style={{ color: '#888', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
            {statement.weekLabel}
          </span>
          {statement.unitId && (
            <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              Unit: {statement.unitId.substring(0, 8)}...
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666' }}>
          By: {statement.generatedByName}
        </div>
      </div>

      {/* Totals bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0.625rem 0.75rem',
          background: '#f5f9ff',
          borderRadius: 4,
          marginBottom: '0.75rem',
          fontSize: '0.8125rem',
        }}
      >
        <span><strong>Loads:</strong> {snapshot.totals.loadCount}</span>
        <span><strong>Gross:</strong> {fmt(snapshot.totals.grossAmount)}</span>
        <span><strong>Driver:</strong> {fmt(snapshot.totals.driverCostAmount)}</span>
        <span style={{ color: snapshot.totals.profitAmount >= 0 ? '#2e7d32' : '#d32f2f' }}>
          <strong>Profit:</strong> {fmt(snapshot.totals.profitAmount)}
        </span>
        <span><strong>OTR:</strong> {fmt(snapshot.totals.otrAmount)}</span>
        <span style={{ color: snapshot.totals.netProfitAmount >= 0 ? '#00897b' : '#d32f2f' }}>
          <strong>Net Profit:</strong> {fmt(snapshot.totals.netProfitAmount)}
        </span>
      </div>

      {/* Loads table */}
      {snapshot.loads.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
          No loads match the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 4, marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={thStyle}>SYL #</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>From</th>
                <th style={thStyle}>To</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Miles</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Driver</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Profit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OTR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>QP</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>DP</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Fact</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.loads.map((l, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{l.sylNumber}</td>
                  <td style={tdStyle}>{l.date}</td>
                  <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.fromAddress}</td>
                  <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.toAddress}</td>
                  <td style={tdRight}>{l.miles}</td>
                  <td style={tdRight}>{fmt(l.grossAmount)}</td>
                  <td style={tdRight}>{fmt(l.driverCostAmount)}</td>
                  <td style={{ ...tdRight, color: l.profitAmount >= 0 ? '#2e7d32' : '#d32f2f' }}>{fmt(l.profitAmount)}</td>
                  <td style={tdRight}>{fmt(l.otrAmount)}</td>
                  <td style={{ ...tdRight, color: l.netProfitAmount >= 0 ? '#00897b' : '#d32f2f' }}>{fmt(l.netProfitAmount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.quickPayFlag} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.directPaymentFlag} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.factoringFlag} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={l.driverPaidFlag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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
          {isSaved ? 'Back to Archive' : 'Back'}
        </button>
        {snapshot.loads.length > 0 && !isSaved && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            style={{
              padding: '0.5rem 1.5rem',
              background: saving ? '#999' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: saving ? 'default' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {saving ? 'Saving...' : 'Save Statement'}
          </button>
        )}
      </div>
    </div>
  );
}
