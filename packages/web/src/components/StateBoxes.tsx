'use client';

import { colors, fontSizes } from '@/lib/styles';

// ── Error banner ───────────────────────────────────────────────

interface ErrorBannerProps {
  message: string;
  /** Show a dismiss button. Calls onDismiss when clicked. */
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      style={{
        padding: '0.75rem',
        background: colors.dangerBg,
        color: colors.danger,
        borderRadius: 4,
        border: `1px solid ${colors.dangerBorder}`,
        marginBottom: '1rem',
        fontSize: fontSizes.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.danger,
            fontWeight: 600,
            fontSize: fontSizes.lg,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Loading spinner placeholder ────────────────────────────────

interface LoadingBoxProps {
  message?: string;
}

export function LoadingBox({ message = 'Loading...' }: LoadingBoxProps) {
  return (
    <div
      style={{
        padding: '3rem',
        textAlign: 'center',
        color: colors.textMuted,
      }}
    >
      {message}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────

interface EmptyBoxProps {
  title: string;
  subtitle?: string;
}

export function EmptyBox({ title, subtitle }: EmptyBoxProps) {
  return (
    <div
      style={{
        padding: '3rem',
        textAlign: 'center',
        color: colors.textMuted,
        background: colors.bgMuted,
        borderRadius: 6,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <p style={{ margin: '0 0 0.5rem', fontSize: fontSizes.xl }}>{title}</p>
      {subtitle && (
        <p style={{ margin: 0, fontSize: fontSizes.md }}>{subtitle}</p>
      )}
    </div>
  );
}
