'use client';

import { useRouter, usePathname } from 'next/navigation';
import { APP_NAME, Action } from '@lol/shared';
import type { UserProfile } from '@lol/shared';
import { usePermissions } from '@/lib/permissions';
import {
  sidebarStyle,
  sidebarBrandStyle,
  sidebarNavStyle,
  sidebarItemStyle,
  sidebarFooterStyle,
  topBarStyle,
  mainContentStyle,
  contentPaddingStyle,
  pageTitleStyle,
  pageSubtitleStyle,
  colors,
  fontSizes,
  spacing,
} from '@/lib/styles';

interface AppShellProps {
  /** Currently logged-in user */
  user: UserProfile;
  /** Callback to log out */
  onLogout: () => void;
  /** Optional page title for section hierarchy */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  children: React.ReactNode;
}

/** Sidebar navigation items with permission gating */
interface NavEntry {
  label: string;
  href: string;
  /** If set, this Action must be allowed for the item to show */
  gate?: Action;
  /** Match these path prefixes for active state */
  match?: string[];
}

const NAV_ITEMS: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', match: ['/dashboard'] },
  { label: 'Loads', href: '/loads', match: ['/loads'] },
  { label: 'Statements', href: '/statements', gate: Action.StatementsRead, match: ['/statements'] },
  { label: 'Salary', href: '/salary', gate: Action.SalaryPreview, match: ['/salary'] },
  { label: 'Settings', href: '/settings', gate: Action.SalaryRulesRead, match: ['/settings'] },
];

/** SVG icons for sidebar nav items — minimal, 18x18 stroke icons */
function NavIcon({ label }: { label: string }) {
  const size = 18;
  const stroke = 'currentColor';
  const sw = 1.5;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (label) {
    case 'Dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="4" rx="1" />
          <rect x="14" y="11" width="7" height="10" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'Loads':
      return (
        <svg {...common}>
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case 'Statements':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'Salary':
      return (
        <svg {...common}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'Settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AppShell({
  user,
  onLogout,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { can: allowed } = usePermissions();

  const isActive = (item: NavEntry) =>
    item.match?.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/')) ?? false;

  return (
    <div>
      {/* ── Sidebar ── */}
      <aside style={sidebarStyle}>
        {/* Brand */}
        <div style={sidebarBrandStyle}>
          <div style={{ fontSize: fontSizes.xl, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {APP_NAME}
          </div>
          <div style={{ fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.4)', marginTop: spacing.xs }}>
            Transportation Management
          </div>
        </div>

        {/* Nav items */}
        <nav style={sidebarNavStyle}>
          {NAV_ITEMS.map((item) => {
            // Permission gate
            if (item.gate && !allowed(item.gate)) return null;
            const active = isActive(item);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={sidebarItemStyle(active)}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <NavIcon label={item.label} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={sidebarFooterStyle}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.base, fontWeight: 500, marginBottom: spacing.xs }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.4)', marginBottom: spacing.md, textTransform: 'capitalize' }}>
            {user.role}
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: fontSizes.sm,
              padding: `${spacing.xs} ${spacing.lg}`,
              borderRadius: 4,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={mainContentStyle}>
        {/* Top bar */}
        <div style={topBarStyle}>
          <div>
            {title && <h1 style={{ ...pageTitleStyle, fontSize: fontSizes.xl }}>{title}</h1>}
            {subtitle && <p style={{ ...pageSubtitleStyle, margin: `${spacing.xs} 0 0` }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <span style={{ fontSize: fontSizes.sm, color: colors.textMuted }}>
              {user.firstName} {user.lastName}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={contentPaddingStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}
