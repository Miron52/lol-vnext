'use client';

import { useRouter } from 'next/navigation';
import { APP_NAME } from '@lol/shared';
import type { UserProfile } from '@lol/shared';
import { navBtnStyle, fontSizes, colors } from '@/lib/styles';

interface NavItem {
  label: string;
  href: string;
}

interface PageShellProps {
  /** Breadcrumb text shown after the app name, e.g. "/ Loads" */
  breadcrumb: string;
  /** Currently logged-in user (for name display) */
  user: UserProfile;
  /** Callback to log out */
  onLogout: () => void;
  /** Navigation links to show in the header (besides Logout) */
  nav?: NavItem[];
  /** Max width of the content area (default: 1400) */
  maxWidth?: number;
  children: React.ReactNode;
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Loads', href: '/loads' },
  { label: 'Salary', href: '/salary' },
  { label: 'Settings', href: '/settings' },
];

export function PageShell({
  breadcrumb,
  user,
  onLogout,
  nav = DEFAULT_NAV,
  maxWidth = 1400,
  children,
}: PageShellProps) {
  const router = useRouter();

  return (
    <main style={{ padding: '1.5rem 2rem', maxWidth, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: fontSizes.title }}>{APP_NAME}</h1>
          <span style={{ color: colors.textMuted, fontSize: fontSizes.md }}>
            {breadcrumb}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: fontSizes.base, color: colors.textSecondary }}>
            {user.firstName} {user.lastName}
          </span>
          {nav.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={navBtnStyle}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={onLogout}
            style={{ ...navBtnStyle, background: '#eee' }}
          >
            Logout
          </button>
        </div>
      </div>

      {children}
    </main>
  );
}
