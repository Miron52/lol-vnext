'use client';

import type { LoadDto } from '@lol/shared';
import { LoadStatus } from '@lol/shared';
import { useI18n } from '@/lib/i18n';
import { thStyle, tdStyle, tdRight, smallBtnStyle, tableWrapperStyle, tableStyle, badgeStyle, tagStyle, thAction, tdAction, colors, spacing, zebraRowProps, fmt } from '@/lib/styles';

interface LoadsTableProps {
  loads: LoadDto[];
  onEdit: (loadId: string) => void;
  onArchive?: (loadId: string) => void;
  onUnarchive?: (loadId: string) => void;
}

function getStatusLabel(status: LoadStatus, t: (key: string) => string): string {
  const labels: Record<LoadStatus, string> = {
    [LoadStatus.NotPickedUp]: t('status.not_picked_up'),
    [LoadStatus.InTransit]: t('status.in_transit'),
    [LoadStatus.Delivered]: t('status.delivered'),
    [LoadStatus.Completed]: t('status.completed'),
    [LoadStatus.Cancelled]: t('status.cancelled'),
  };
  return labels[status] || status;
}

const STATUS_BADGE_VARIANT: Record<LoadStatus, 'muted' | 'info' | 'success' | 'danger'> = {
  [LoadStatus.NotPickedUp]: 'muted',
  [LoadStatus.InTransit]: 'info',
  [LoadStatus.Delivered]: 'success',
  [LoadStatus.Completed]: 'success',
  [LoadStatus.Cancelled]: 'danger',
};

function FlagCell({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? colors.success : colors.flagInactive, fontWeight: value ? 600 : 400 }}>
      {value ? 'Y' : '-'}
    </span>
  );
}

export function LoadsTable({ loads, onEdit, onArchive, onUnarchive }: LoadsTableProps) {
  const { t } = useI18n();
  return (
    <div style={tableWrapperStyle}>
      <table style={{ ...tableStyle, minWidth: 1600 }}>
        <thead>
          <tr>
            <th style={thStyle}>{t('table.sylNumber')}</th>
            <th style={thStyle}>{t('table.date')}</th>
            <th style={thStyle}>{t('table.business')}</th>
            <th style={thStyle}>{t('table.from')}</th>
            <th style={thStyle}>{t('table.to')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.gross')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.driverCost')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.profit')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.profitPct')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.otr')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.netProfit')}</th>
            <th style={thStyle}>{t('table.status')}</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>{t('table.qp')}</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>{t('table.dp')}</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>{t('table.fact')}</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>{t('table.paid')}</th>
            <th style={thAction}></th>
          </tr>
        </thead>
        <tbody>
          {loads.map((load, idx) => {
            const isArchived = !!load.archivedAt;
            const zebra = zebraRowProps(idx, isArchived ? colors.warningBg : undefined);
            return (
            <tr
              key={load.id}
              style={{ ...zebra.style, cursor: 'pointer', opacity: isArchived ? 0.6 : 1 }}
              onClick={() => onEdit(load.id)}
              onMouseEnter={zebra.onMouseEnter}
              onMouseLeave={zebra.onMouseLeave}
            >
              <td style={{ ...tdStyle, fontWeight: 600 }}>
                {load.sylNumber}
                {isArchived && (
                  <span style={{ marginLeft: 6, display: 'inline-block', verticalAlign: 'middle', ...tagStyle('solidWarning') }}>
                    {t('table.archived')}
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
              <td style={tdRight}>{fmt(load.grossAmount)}</td>
              <td style={tdRight}>{fmt(load.driverCostAmount)}</td>
              <td style={{ ...tdRight, color: load.profitAmount >= 0 ? colors.success : colors.danger }}>
                {fmt(load.profitAmount)}
              </td>
              <td style={{ ...tdRight, color: load.profitPercent >= 0 ? colors.success : colors.danger }}>
                {Number(load.profitPercent).toFixed(1)}%
              </td>
              <td style={tdRight}>{fmt(load.otrAmount)}</td>
              <td style={{ ...tdRight, color: load.netProfitAmount >= 0 ? colors.success : colors.danger }}>
                {fmt(load.netProfitAmount)}
              </td>
              <td style={tdStyle}>
                <span style={badgeStyle(STATUS_BADGE_VARIANT[load.loadStatus])}>
                  {getStatusLabel(load.loadStatus, t)}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.quickPayFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.directPaymentFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.factoringFlag} /></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}><FlagCell value={load.driverPaidFlag} /></td>
              <td style={tdAction}>
                <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(load.id);
                    }}
                    style={smallBtnStyle}
                  >
                    {isArchived ? t('table.view') : t('table.edit')}
                  </button>
                  {!isArchived && onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(load.id);
                      }}
                      style={{
                        ...smallBtnStyle,
                        background: colors.warningBg,
                        borderColor: colors.warningBorder,
                        color: colors.orange,
                      }}
                    >
                      {t('table.archive')}
                    </button>
                  )}
                  {isArchived && onUnarchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnarchive(load.id);
                      }}
                      style={{
                        ...smallBtnStyle,
                        background: colors.successBg,
                        borderColor: colors.successBorder,
                        color: colors.success,
                      }}
                    >
                      {t('table.unarchive')}
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
