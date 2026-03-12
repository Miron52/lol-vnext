'use client';

import type { LoadDto } from '@lol/shared';
import { LoadStatus } from '@lol/shared';

interface LoadsTableProps {
  loads: LoadDto[];
  onEdit: (loadId: string) => void;
  onArchive?: (loadId: string) => void;
  onUnarchive?: (loadId: string) => void;
}

const STATUS_LABEL: Record<LoadStatus, string> = {
  [LoadStatus.NotPickedUp]: 'Not Picked Up',
  [LoadStatus.InTransit]: 'In Transit',
  [LoadStatus.Delivered]: 'Delivered',
  [LoadStatus.Completed]: 'Completed',
  [LoadStatus.Cancelled]: 'Cancelled',
};

const STATUS_COLOR: Record<LoadStatus, string> = {
  [LoadStatus.NotPickedUp]: '#9e9e9e',
  [LoadStatus.InTransit]: '#1976d2',
  [LoadStatus.Delivered]: '#388e3c',
  [LoadStatus.Completed]: '#2e7d32',
  [LoadStatus.Cancelled]: '#d32f2f',
};

function formatCurrency(value: number): string {
  return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FlagCell({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? '#388e3c' : '#bdbdbd', fontWeight: value ? 600 : 400 }}>
      {value ? 'Y' : '-'}
    </span>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'left',
  borderBottom: '2px solid #e0e0e0',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#666',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: '#fafafa',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '0.8125rem',
  whiteSpace: 'nowrap',
};

const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

export function LoadsTable({ loads, onEdit, onArchive, onUnarchive }: LoadsTableProps) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 6 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1300 }}>
        <thead>
          <tr>
            <th style={thStyle}>SYL #</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Business</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Driver Cost</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Profit</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Profit %</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>OTR</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Net Profit</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>QP</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>DP</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Fact</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Paid</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {loads.map((load) => {
            const isArchived = !!load.archivedAt;
            return (
            <tr
              key={load.id}
              style={{ cursor: 'pointer', opacity: isArchived ? 0.6 : 1 }}
              onClick={() => onEdit(load.id)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = isArchived ? '#fff8e1' : '#f5f9ff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = '';
              }}
            >
              <td style={{ ...tdStyle, fontWeight: 600 }}>
                {load.sylNumber}
                {isArchived && (
                  <span style={{
                    marginLeft: 6,
                    display: 'inline-block',
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    background: '#ff9800',
                    color: '#fff',
                    verticalAlign: 'middle',
                  }}>
                    ARCHIVED
                  </span>
                )}
              </td>
              <td style={tdStyle}>{load.date}</td>
              <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {load.businessName}
              </td>
              <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {load.fromAddress}
              </td>
              <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {load.toAddress}
              </td>
              <td style={tdRight}>{formatCurrency(load.grossAmount)}</td>
              <td style={tdRight}>{formatCurrency(load.driverCostAmount)}</td>
              <td style={{ ...tdRight, color: load.profitAmount >= 0 ? '#2e7d32' : '#d32f2f' }}>
                {formatCurrency(load.profitAmount)}
              </td>
              <td style={{ ...tdRight, color: load.profitPercent >= 0 ? '#2e7d32' : '#d32f2f' }}>
                {Number(load.profitPercent).toFixed(1)}%
              </td>
              <td style={tdRight}>{formatCurrency(load.otrAmount)}</td>
              <td style={{ ...tdRight, color: load.netProfitAmount >= 0 ? '#2e7d32' : '#d32f2f' }}>
                {formatCurrency(load.netProfitAmount)}
              </td>
              <td style={tdStyle}>
                <span
                  style={{
                    color: STATUS_COLOR[load.loadStatus] || '#666',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                >
                  {STATUS_LABEL[load.loadStatus] || load.loadStatus}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.quickPayFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.directPaymentFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.factoringFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.driverPaidFlag} /></td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(load.id);
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                  >
                    {isArchived ? 'View' : 'Edit'}
                  </button>
                  {!isArchived && onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(load.id);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: '#fff8e1',
                        border: '1px solid #ffb74d',
                        borderRadius: 3,
                        cursor: 'pointer',
                        color: '#e65100',
                      }}
                    >
                      Archive
                    </button>
                  )}
                  {isArchived && onUnarchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnarchive(load.id);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: '#e8f5e9',
                        border: '1px solid #81c784',
                        borderRadius: 3,
                        cursor: 'pointer',
                        color: '#2e7d32',
                      }}
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
