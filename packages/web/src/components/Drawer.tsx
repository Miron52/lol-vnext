'use client';

import { useEffect, useRef } from 'react';
import { colors, shadows, fontFamily, transition } from '@/lib/styles';

interface DrawerProps {
  /** Whether the drawer is visible */
  open: boolean;
  /** Called when the user clicks the backdrop or presses Escape */
  onClose: () => void;
  /** Drawer width — defaults to 680px */
  width?: number;
  children: React.ReactNode;
}

/**
 * Right-side slide-over drawer with overlay backdrop.
 * Traps focus and closes on Escape.
 */
export function Drawer({ open, onClose, width = 680, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,23,42,0.35)',
          backdropFilter: 'blur(1px)',
          transition: `opacity ${transition.normal}`,
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'relative',
          width,
          maxWidth: '100vw',
          height: '100vh',
          background: colors.bgWhite,
          boxShadow: shadows.modal,
          borderLeft: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          fontFamily,
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Drawer header — sticky at top */
export function DrawerHeader({
  title,
  subtitle,
  onClose,
  tag,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  tag?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: colors.bgWhite,
        borderBottom: `1px solid ${colors.border}`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: colors.text,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h2>
          {tag}
        </div>
        {subtitle && (
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: colors.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: colors.textMuted,
          fontSize: '1.25rem',
          lineHeight: 1,
          padding: '4px',
          flexShrink: 0,
        }}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}

/** Drawer body — scrollable content area */
export function DrawerBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>
      {children}
    </div>
  );
}
