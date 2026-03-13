/**
 * Shared style tokens and CSS constant objects for the LOL vNext web UI.
 * Every page should import from here instead of re-declaring local style objects.
 *
 * Design language: Linear / Ramp / premium admin SaaS
 * — clean, calm, sharp, data-dense but readable
 */

// ── Colour tokens ──────────────────────────────────────────────

export const colors = {
  // Primary
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryBorder: '#bfdbfe',

  // Semantic
  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  warning: '#d97706',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',

  // Accent
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  orangeLight: '#f97316',
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
  teal: '#0d9488',

  // Text hierarchy
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textOnDark: 'rgba(255,255,255,0.88)',
  textOnDarkMuted: 'rgba(255,255,255,0.48)',

  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderSubtle: '#f8fafc',
  rowBorder: '#f1f5f9',

  // Backgrounds
  bgPage: '#f8fafc',
  bgMuted: '#f8fafc',
  bgWhite: '#ffffff',
  bgHover: '#f1f5f9',
  bgSidebar: '#0f172a',
  bgSidebarHover: 'rgba(255,255,255,0.06)',
  bgSidebarActive: 'rgba(255,255,255,0.10)',

  // Legacy aliases
  slate: '#475569',
  flagInactive: '#cbd5e1',
} as const;

// ── Font family ───────────────────────────────────────────────

export const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";

// ── Spacing ────────────────────────────────────────────────────

export const spacing = {
  pageX: '1.5rem',
  pageY: '1.5rem',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  xxl: '1.5rem',
  '3xl': '2rem',
  '4xl': '2.5rem',
} as const;

// ── Typography ─────────────────────────────────────────────────

export const fontSizes = {
  xs: '0.6875rem',     // 11px
  sm: '0.75rem',       // 12px
  base: '0.8125rem',   // 13px
  md: '0.875rem',      // 14px
  lg: '1rem',          // 16px
  xl: '1.125rem',      // 18px
  xxl: '1.25rem',      // 20px
  title: '1.5rem',     // 24px
  display: '1.75rem',  // 28px
} as const;

// ── Line height ───────────────────────────────────────────────

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.65,
} as const;

// ── Radius ─────────────────────────────────────────────────────

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  pill: 9999,
} as const;

// ── Shadows ────────────────────────────────────────────────────

export const shadows = {
  xs: '0 1px 2px rgba(15,23,42,0.04)',
  card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  dropdown: '0 4px 16px rgba(15,23,42,0.10)',
  modal: '0 8px 32px rgba(15,23,42,0.14), 0 2px 6px rgba(15,23,42,0.06)',
  login: '0 4px 24px rgba(15,23,42,0.08)',
  stickyBar: '0 1px 4px rgba(15,23,42,0.04)',
} as const;

// ── Transition ─────────────────────────────────────────────────

export const transition = {
  fast: '0.12s ease',
  normal: '0.18s ease',
} as const;

// ══════════════════════════════════════════════════════════════
// BUTTONS
// ══════════════════════════════════════════════════════════════

const btnBase: React.CSSProperties = {
  borderRadius: radii.md,
  cursor: 'pointer',
  fontWeight: 500,
  fontFamily,
  lineHeight: 1.4,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  transition: `all ${transition.fast}`,
  outline: 'none',
};

/** Standard navigation button (toolbar) */
export const navBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '6px 12px',
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.base,
  color: colors.textSecondary,
};

/** Primary action button */
export const primaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '8px 16px',
  background: colors.primary,
  color: '#fff',
  border: 'none',
  fontSize: fontSizes.md,
  fontWeight: 600,
  boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
};

/** Secondary / cancel button */
export const secondaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '8px 16px',
  background: colors.bgWhite,
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.md,
};

/** Ghost button — borderless, subtle */
export const ghostBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '6px 12px',
  background: 'transparent',
  color: colors.textSecondary,
  border: '1px solid transparent',
  fontSize: fontSizes.base,
};

/** Danger / destructive action button */
export const dangerBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '8px 16px',
  background: colors.danger,
  color: '#fff',
  border: 'none',
  fontSize: fontSizes.md,
  fontWeight: 600,
};

/** Small inline action button (table row) */
export const smallBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '4px 10px',
  background: colors.bgWhite,
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.sm,
  fontWeight: 500,
  color: colors.textSecondary,
};

/** Icon-only remove/delete button */
export const iconBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '2px 8px',
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  fontSize: fontSizes.lg,
  fontWeight: 600,
  color: colors.danger,
};

/** Toolbar action button (banner actions) */
export const actionBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '4px 10px',
  fontSize: fontSizes.sm,
  fontWeight: 600,
};

/** Tab-style toggle button */
export function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    ...btnBase,
    padding: '6px 14px',
    fontSize: fontSizes.base,
    fontWeight: active ? 600 : 400,
    background: active ? colors.primary : 'transparent',
    color: active ? '#fff' : colors.textSecondary,
    border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
    boxShadow: active ? '0 1px 2px rgba(37,99,235,0.15)' : 'none',
  };
}

// ══════════════════════════════════════════════════════════════
// TABLES
// ══════════════════════════════════════════════════════════════

/** Table wrapper — horizontal scroll, border, constrained height for sticky header */
export const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'auto',
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  maxHeight: 'calc(100vh - 280px)',
  background: colors.bgWhite,
};

/** Table element itself */
export const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontFamily,
};

/** Table header cell — compact, uppercase, sticky */
export const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: `1px solid ${colors.border}`,
  fontSize: fontSizes.xs,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: colors.textMuted,
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: colors.bgMuted,
  zIndex: 2,
};

/** Table body cell */
export const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${colors.borderLight}`,
  fontSize: fontSizes.base,
  color: colors.text,
  whiteSpace: 'nowrap',
};

/** Right-aligned numeric cell */
export const tdRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

/** Fixed-width action column header */
export const thAction: React.CSSProperties = {
  ...thStyle,
  width: 120,
  textAlign: 'center',
};

/** Fixed-width action column cell */
export const tdAction: React.CSSProperties = {
  ...tdStyle,
  width: 120,
  textAlign: 'center',
};

/** Totals / summary row */
export const totalRowStyle: React.CSSProperties = {
  background: colors.bgMuted,
  fontWeight: 600,
  borderTop: `2px solid ${colors.border}`,
};

/** Zebra-striped row handlers — returns style + hover handlers for a given row index */
export function zebraRowProps(index: number, hoverBg: string = colors.bgHover) {
  const baseBg = index % 2 === 1 ? colors.bgMuted : '';
  return {
    style: { background: baseBg } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = baseBg;
    },
  };
}

// ══════════════════════════════════════════════════════════════
// FORMS
// ══════════════════════════════════════════════════════════════

/** Form label */
export const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: fontSizes.sm,
  fontWeight: 500,
  color: colors.textSecondary,
  letterSpacing: '0.01em',
};

/** Form input / select base */
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  fontSize: fontSizes.md,
  fontFamily,
  boxSizing: 'border-box',
  background: colors.bgWhite,
  color: colors.text,
  transition: `border-color ${transition.fast}, box-shadow ${transition.fast}`,
  outline: 'none',
};

/** Checkbox label wrapper */
export const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: fontSizes.md,
  cursor: 'pointer',
  color: colors.text,
};

/** Form section card — premium white card with subtle border */
export const sectionStyle: React.CSSProperties = {
  marginBottom: spacing.xxl,
  padding: spacing.xxl,
  background: colors.bgWhite,
  borderRadius: radii.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.xs,
};

/** Form section heading */
export const sectionTitleStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.xl}`,
  fontSize: fontSizes.md,
  fontWeight: 600,
  color: colors.text,
  paddingBottom: spacing.md,
  borderBottom: `1px solid ${colors.borderLight}`,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

/** Validation error container */
export const validationErrorStyle: React.CSSProperties = {
  padding: `${spacing.lg} ${spacing.xl}`,
  marginBottom: spacing.xl,
  background: colors.dangerBg,
  border: `1px solid ${colors.dangerBorder}`,
  borderRadius: radii.md,
  fontSize: fontSizes.md,
  color: colors.danger,
  lineHeight: 1.6,
};

/** Disabled / read-only input override */
export const inputDisabledStyle: React.CSSProperties = {
  ...inputStyle,
  background: colors.bgMuted,
  color: colors.textMuted,
  cursor: 'not-allowed',
};

/** Action bar at the bottom of a form — aligned right */
export const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.lg,
  justifyContent: 'flex-end',
  paddingTop: spacing.xxl,
  borderTop: `1px solid ${colors.borderLight}`,
  marginTop: spacing.xl,
};

/** Premium card container — for KPI, info panels, chart wrappers */
export const cardStyle: React.CSSProperties = {
  background: colors.bgWhite,
  borderRadius: radii.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.card,
  padding: '16px 20px',
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

// ══════════════════════════════════════════════════════════════
// MODALS & OVERLAYS
// ══════════════════════════════════════════════════════════════

/** Modal overlay background */
export const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)',
};

/** Modal card */
export const modalStyle: React.CSSProperties = {
  background: colors.bgWhite,
  borderRadius: radii.xl,
  padding: spacing.xxl,
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: shadows.modal,
  border: `1px solid ${colors.border}`,
};

// ══════════════════════════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════════════════════════

interface BadgeTheme {
  bg: string;
  fg: string;
  border?: string;
}

const BADGE_THEMES = {
  success: { bg: colors.successBg, fg: colors.success, border: colors.successBorder },
  warning: { bg: colors.warningBg, fg: colors.warning, border: colors.warningBorder },
  danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBorder },
  info: { bg: colors.primaryLight, fg: colors.primaryDark, border: colors.primaryBorder },
  muted: { bg: colors.bgMuted, fg: colors.textMuted },
  purple: { bg: colors.purpleBg, fg: colors.purple },
  orange: { bg: colors.orangeBg, fg: colors.orange },
  teal: { bg: '#f0fdfa', fg: colors.teal },
  solidInfo: { bg: colors.primaryDark, fg: '#fff' },
  solidWarning: { bg: colors.orangeLight, fg: '#fff' },
  solidSuccess: { bg: colors.success, fg: '#fff' },
  solidDanger: { bg: colors.danger, fg: '#fff' },
} as const;

export type BadgeVariant = keyof typeof BADGE_THEMES;

/** Pill badge (status indicators) */
export function badgeStyle(variant: BadgeVariant): React.CSSProperties {
  const theme: BadgeTheme = BADGE_THEMES[variant];
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: radii.sm,
    fontSize: fontSizes.xs,
    fontWeight: 600,
    background: theme.bg,
    color: theme.fg,
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };
}

/**
 * Semantic status-to-badge-variant mapping.
 * Used across Loads, Salary, Statements to ensure consistent badge colours.
 */
export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  // General
  pending: 'warning',
  generated: 'success',
  frozen: 'info',
  archived: 'muted',
  open: 'orange',
  // Payment
  paid: 'success',
  unpaid: 'danger',
  quick_pay: 'teal',
  direct: 'purple',
  // Load statuses
  not_picked_up: 'muted',
  in_transit: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  // Rule status
  active: 'success',
  inactive: 'muted',
};

/** Small solid tag (ARCHIVED, READ ONLY, SNAPSHOT) */
export function tagStyle(variant: BadgeVariant): React.CSSProperties {
  const theme: BadgeTheme = BADGE_THEMES[variant];
  return {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: radii.sm,
    fontSize: fontSizes.xs,
    fontWeight: 700,
    background: theme.bg,
    color: theme.fg,
    verticalAlign: 'middle',
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };
}

// ══════════════════════════════════════════════════════════════
// BANNERS
// ══════════════════════════════════════════════════════════════

export function bannerStyle(variant: 'info' | 'warning' | 'success' | 'danger'): React.CSSProperties {
  const map = {
    info: { bg: colors.primaryLight, fg: colors.primaryDark, border: colors.primaryBorder },
    warning: { bg: colors.warningBg, fg: colors.warning, border: colors.warningBorder },
    success: { bg: colors.successBg, fg: colors.success, border: colors.successBorder },
    danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBorder },
  };
  const t = map[variant];
  return {
    padding: '10px 14px',
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: radii.md,
    fontSize: fontSizes.base,
    color: t.fg,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  };
}

// ══════════════════════════════════════════════════════════════
// ACCESS DENIED
// ══════════════════════════════════════════════════════════════

export const accessDeniedStyle: React.CSSProperties = {
  padding: '2rem',
  textAlign: 'center',
  color: colors.danger,
  background: colors.dangerBg,
  borderRadius: radii.lg,
  border: `1px solid ${colors.dangerBorder}`,
};

export const accessDeniedSubtextStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  color: colors.textSecondary,
  fontSize: fontSizes.md,
};

// ══════════════════════════════════════════════════════════════
// TOOLBAR (STICKY ACTION BAR)
// ══════════════════════════════════════════════════════════════

/** Sticky toolbar — sticks below PageShell header on scroll */
export const stickyToolbarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: colors.bgWhite,
  borderBottom: `1px solid ${colors.borderLight}`,
  boxShadow: shadows.stickyBar,
  padding: '10px 0',
  marginBottom: spacing.xl,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: spacing.md,
};

/** Non-sticky toolbar (backwards-compatible alias) */
export const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.xl,
  flexWrap: 'wrap',
  gap: spacing.md,
};

export const toolbarGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  alignItems: 'center',
};

// ══════════════════════════════════════════════════════════════
// PAGE SECTION HIERARCHY
// ══════════════════════════════════════════════════════════════

/** Page title — large, bold heading */
export const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: fontSizes.xl,
  fontWeight: 600,
  color: colors.text,
  lineHeight: lineHeights.tight,
  letterSpacing: '-0.01em',
};

/** Page subtitle / breadcrumb line below the title */
export const pageSubtitleStyle: React.CSSProperties = {
  margin: `${spacing.xs} 0 0`,
  fontSize: fontSizes.base,
  color: colors.textMuted,
  fontWeight: 400,
};

/** Section heading (e.g. "Salary Rules", "Archive") within a page */
export const sectionHeadingStyle: React.CSSProperties = {
  margin: `0 0 ${spacing.lg}`,
  fontSize: fontSizes.lg,
  fontWeight: 600,
  color: colors.text,
  letterSpacing: '-0.005em',
};

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

/** Disabled button override */
export function disabledBtnStyle(
  base: React.CSSProperties,
  isDisabled: boolean,
): React.CSSProperties {
  if (!isDisabled) return base;
  return {
    ...base,
    background: colors.bgMuted,
    color: colors.textMuted,
    cursor: 'not-allowed',
    opacity: 0.6,
    border: `1px solid ${colors.border}`,
    boxShadow: 'none',
  };
}

/** Loading state for primary button */
export function loadingBtnStyle(
  base: React.CSSProperties,
  isLoading: boolean,
): React.CSSProperties {
  if (!isLoading) return base;
  return {
    ...base,
    background: colors.textMuted,
    cursor: 'default',
    boxShadow: 'none',
  };
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOG PANEL
// ══════════════════════════════════════════════════════════════

/** Audit log panel container */
export const auditPanelStyle: React.CSSProperties = {
  marginBottom: spacing.xl,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  background: colors.bgWhite,
  maxHeight: 300,
  overflowY: 'auto',
};

/** Audit log panel header bar */
export const auditPanelHeaderStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${colors.border}`,
  fontWeight: 600,
  fontSize: fontSizes.sm,
  color: colors.textMuted,
  background: colors.bgMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

/** Audit log empty state */
export const auditPanelEmptyStyle: React.CSSProperties = {
  padding: spacing.xl,
  textAlign: 'center',
  color: colors.textMuted,
  fontSize: fontSizes.base,
};

/** Compact audit log table */
export const auditTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: fontSizes.base,
};

/** Audit table header row */
export const auditThStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.lg}`,
  fontWeight: 600,
  background: colors.bgMuted,
  textAlign: 'left',
  fontSize: fontSizes.xs,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

/** Audit table data cell */
export const auditTdStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.lg}`,
  borderBottom: `1px solid ${colors.borderLight}`,
};

// ══════════════════════════════════════════════════════════════
// APP SHELL — SIDEBAR & TOP BAR
// ══════════════════════════════════════════════════════════════

export const SIDEBAR_WIDTH = 232;

/** Fixed sidebar container */
export const sidebarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  width: SIDEBAR_WIDTH,
  background: colors.bgSidebar,
  color: colors.textOnDark,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 30,
  overflow: 'hidden',
  borderRight: '1px solid rgba(255,255,255,0.06)',
};

/** Sidebar brand / logo area */
export const sidebarBrandStyle: React.CSSProperties = {
  padding: '20px 20px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

/** Sidebar nav list container */
export const sidebarNavStyle: React.CSSProperties = {
  flex: 1,
  padding: `${spacing.lg} 0`,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

/** Sidebar nav item */
export function sidebarItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: '8px 20px',
    fontSize: fontSizes.md,
    fontWeight: active ? 500 : 400,
    color: active ? '#fff' : colors.textOnDarkMuted,
    background: active ? colors.bgSidebarActive : 'transparent',
    borderLeft: `2px solid ${active ? colors.primary : 'transparent'}`,
    borderRight: 'none',
    borderTop: 'none',
    borderBottom: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: `all ${transition.fast}`,
    letterSpacing: '0.005em',
  };
}

/** Sidebar user/footer area */
export const sidebarFooterStyle: React.CSSProperties = {
  padding: '12px 20px 16px',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  fontSize: fontSizes.sm,
};

/** Top bar in sidebar layout */
export const topBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: colors.bgWhite,
  borderBottom: `1px solid ${colors.border}`,
  padding: `12px ${spacing.xxl}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: 56,
};

/** Main content area offset from sidebar */
export const mainContentStyle: React.CSSProperties = {
  marginLeft: SIDEBAR_WIDTH,
  minHeight: '100vh',
  background: colors.bgPage,
};

/** Content padding inside main area */
export const contentPaddingStyle: React.CSSProperties = {
  padding: '20px 24px 40px',
};

/** Currency formatter */
export function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Date-time formatter (short) */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Row hover handlers for tables */
export function rowHoverHandlers(hoverBg: string = colors.bgHover) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
      (e.currentTarget as HTMLTableRowElement).style.background = '';
    },
  };
}
