'use client';

import type { UserProfile } from '@lol/shared';
import { AppShell } from './AppShell';

interface PageShellProps {
  /** @deprecated Breadcrumb is now derived from sidebar. Kept for API compat. */
  breadcrumb?: string;
  /** Currently logged-in user (for name display) */
  user: UserProfile;
  /** Callback to log out */
  onLogout: () => void;
  /** @deprecated Navigation is now handled by AppShell sidebar. Kept for API compat. */
  nav?: { label: string; href: string }[];
  /** @deprecated Max width is managed by AppShell content area. */
  maxWidth?: number;
  /** Optional page title for section hierarchy */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * PageShell — thin wrapper around AppShell that preserves the existing
 * call-site API. Every page that currently uses `<PageShell>` will now
 * automatically get the sidebar layout without code changes.
 */
export function PageShell({
  user,
  onLogout,
  title,
  subtitle,
  children,
}: PageShellProps) {
  return (
    <AppShell user={user} onLogout={onLogout} title={title} subtitle={subtitle}>
      {children}
    </AppShell>
  );
}
