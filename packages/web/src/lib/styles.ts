/**
 * Shared style tokens and CSS constant objects for the LOL vNext web UI.
 * Every page should import from here instead of re-declaring local style objects.
 */

// ── Colour tokens ──────────────────────────────────────────────

export const colors = {
  primary: '#1976d2',
  primaryDark: '#0d47a1',
  success: '#2e7d32',
  successBg: '#e8f5e9',
  warning: '#f57f17',
  warningBg: '#fff8e1',
  danger: '#d32f2f',
  dangerBg: '#fff5f5',
  dangerBorder: '#ffcdd2',
  purple: '#7b1fa2',
  purpleBg: '#f3e5f5',
  teal: '#00897b',
  text: '#222',
  textMuted: '#888',
  textSecondary: '#666',
  border: '#ccc',
  borderLight: '#e0e0e0',
  rowBorder: '#e0e0e0',
  bgPage: '#f5f5f5',
  bgMuted: '#fafafa',
  bgWhite: '#fff',
  bgHover: '#f5f9ff',
} as const;

// ── Spacing ────────────────────────────────────────────────────

export const spacing = {
  pageX: '2rem',
  pageY: '1.5rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  xxl: '1.5rem',
} as const;

// ── Typography ─────────────────────────────────────────────────

export const fontSizes = {
  xs: '0.6875rem',
  sm: '0.75rem',
  base: '0.8125rem',
  md: '0.875rem',
  lg: '1rem',
  xl: '1.125rem',
  xxl: '1.25rem',
  title: '1.5rem',
} as const;

// ── Reusable CSS-in-JS objects ─────────────────────────────────

/** Standard navigation button (header) */
export const navBtnStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.lg}`,
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: fontSizes.base,
};

/** Primary action button */
export const primaryBtnStyle: React.CSSProperties = {
  padding: `${spacing.md} ${spacing.xl}`,
  background: colors.primary,
  color: colors.bgWhite,
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: fontSizes.md,
  fontWeight: 500,
};

/** Small inline action button (table row) */
export const smallBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: fontSizes.sm,
};

/** Table header cell */
export const thStyle: React.CSSProperties = {
  padding: `${spacing.md} ${spacing.lg}`,
  fontWeight: 600,
  fontSize: fontSizes.base,
  borderBottom: `2px solid #ddd`,
};

/** Table body cell */
export const tdStyle: React.CSSProperties = {
  padding: `${spacing.md} ${spacing.lg}`,
};

/** Form label */
export const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: fontSizes.sm,
  fontWeight: 600,
  color: '#555',
};

/** Form input / select base */
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: `${spacing.sm} ${spacing.md}`,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  fontSize: fontSizes.base,
  boxSizing: 'border-box',
  background: colors.bgWhite,
};

/** Checkbox label wrapper */
export const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: fontSizes.base,
  cursor: 'pointer',
};

/** Form section card */
export const sectionStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
  padding: spacing.xl,
  background: colors.bgMuted,
  borderRadius: 6,
  border: '1px solid #eee',
};

/** Form section heading */
export const sectionTitleStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.lg}`,
  fontSize: fontSizes.md,
  fontWeight: 600,
  color: '#333',
};

// ── Grid helpers ───────────────────────────────────────────────

export const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing.lg,
};

export const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: spacing.lg,
};

// ── Helpers for disabled buttons ───────────────────────────────

export function disabledBtnStyle(
  base: React.CSSProperties,
  isDisabled: boolean,
): React.CSSProperties {
  if (!isDisabled) return base;
  return {
    ...base,
    background: '#e0e0e0',
    color: '#999',
    cursor: 'not-allowed',
  };
}

/** Currency formatter */
export function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Date-time formatter (short) */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
