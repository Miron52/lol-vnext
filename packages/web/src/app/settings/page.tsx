'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Action, Role } from '@lol/shared';
import type { SalaryRuleListItem, SalaryRuleDto, SalaryRuleTier } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import {
  primaryBtnStyle,
  smallBtnStyle,
  thStyle,
  tdStyle,
  tableWrapperStyle,
  tableStyle,
  badgeStyle,
  accessDeniedStyle,
  accessDeniedSubtextStyle,
  stickyToolbarStyle,
  sectionHeadingStyle,
  thAction,
  tdAction,
  zebraRowProps,
  tabBtnStyle,
  cardStyle,
  colors,
  fontSizes,
  fontFamily,
  spacing,
  radii,
  transition,
} from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { PageShell } from '@/components/PageShell';
import { SalaryRuleEditor } from './SalaryRuleEditor';

type SettingsTab = 'rules' | 'users';
type View = 'list' | 'create' | 'edit';

/* ═══════════════════════════════════════════════════════
   User management types
   ═══════════════════════════════════════════════════════ */

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════
   Main Settings Page
   ═══════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();
  const { t } = useI18n();

  const [tab, setTab] = useState<SettingsTab>('rules');
  const [view, setView] = useState<View>('list');
  const [rules, setRules] = useState<SalaryRuleListItem[]>([]);
  const [editingRule, setEditingRule] = useState<SalaryRuleDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // ── Fetch rules ──
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SalaryRuleListItem[]>('/salary-rules');
      setRules(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRules();
  }, [user, fetchRules]);

  // ── Handlers ──
  const handleCreate = () => {
    setEditingRule(null);
    setView('create');
  };

  const handleEdit = async (id: string) => {
    setLoading(true);
    try {
      const rule = await apiFetch<SalaryRuleDto>(`/salary-rules/${id}`);
      setEditingRule(rule);
      setView('edit');
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await apiFetch<SalaryRuleDto>(`/salary-rules/${id}/activate`, { method: 'POST' });
      await fetchRules();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await apiFetch<SalaryRuleDto>(`/salary-rules/${id}/deactivate`, { method: 'POST' });
      await fetchRules();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  const handleSave = async (data: { name: string; effectiveFrom: string; tiers: SalaryRuleTier[] }) => {
    setError(null);
    try {
      if (view === 'create') {
        await apiFetch<SalaryRuleDto>('/salary-rules', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } else if (editingRule) {
        await apiFetch<SalaryRuleDto>(`/salary-rules/${editingRule.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
      setView('list');
      await fetchRules();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  if (authLoading) return <main style={{ padding: '2rem' }}><LoadingBox message={t('common.authenticating')} /></main>;
  if (!user) return null;

  if (!allowed(Action.SalaryRulesRead)) {
    return (
      <PageShell
        breadcrumb={`/ ${t('nav.settings')}`}
        user={user}
        onLogout={logout}
        nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]}
      >
        <div style={accessDeniedStyle}>
          <strong>{t('settings.accessDenied')}</strong>
          <p style={accessDeniedSubtextStyle}>
            {t('settings.accessDeniedHint')}
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumb={`/ ${t('nav.settings')}`}
      user={user}
      onLogout={logout}
      nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]}
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
    >
      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: spacing.sm, marginBottom: spacing.xl,
        borderBottom: `1px solid ${colors.borderSubtle}`, paddingBottom: spacing.sm,
      }}>
        <button onClick={() => { setTab('rules'); setView('list'); }} style={tabBtnStyle(tab === 'rules')}>
          {t('settings.tabRules')}
        </button>
        <button onClick={() => setTab('users')} style={tabBtnStyle(tab === 'users')}>
          {t('settings.tabUsers')}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Salary Rules tab ── */}
      {tab === 'rules' && view === 'list' && (
        <RulesList
          rules={rules}
          loading={loading}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
        />
      )}

      {tab === 'rules' && (view === 'create' || view === 'edit') && (
        <SalaryRuleEditor
          initial={editingRule}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && <UsersSection />}
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════════
   Rules list sub-component
   ═══════════════════════════════════════════════════════ */

function RulesList({
  rules,
  loading,
  onCreate,
  onEdit,
  onActivate,
  onDeactivate,
}: {
  rules: SalaryRuleListItem[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <div style={stickyToolbarStyle}>
        <h2 style={sectionHeadingStyle}>{t('settings.salaryRules')}</h2>
        <button onClick={onCreate} style={primaryBtnStyle}>{t('settings.newRuleSet')}</button>
      </div>

      {loading ? (
        <LoadingBox message={t('settings.loading')} subtitle={t('settings.loadingHint')} />
      ) : rules.length === 0 ? (
        <EmptyBox
          title={t('settings.noRules')}
          subtitle={t('settings.noRulesHint')}
          actionLabel={t('settings.newRuleSet')}
          onAction={onCreate}
        />
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t('settings.name')}</th>
                <th style={thStyle}>{t('settings.version')}</th>
                <th style={thStyle}>{t('settings.status')}</th>
                <th style={thStyle}>{t('settings.effectiveFrom')}</th>
                <th style={thStyle}>{t('settings.tiers')}</th>
                <th style={thStyle}>{t('settings.createdBy')}</th>
                <th style={thAction}>{t('settings.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => {
                const zebra = zebraRowProps(idx);
                return (
                <tr key={r.id} style={zebra.style} onMouseEnter={zebra.onMouseEnter} onMouseLeave={zebra.onMouseLeave}>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>v{r.version}</td>
                  <td style={tdStyle}>
                    <span style={r.isActive ? badgeStyle('success') : badgeStyle('muted')}>
                      {r.isActive ? t('settings.active') : t('settings.inactive')}
                    </span>
                  </td>
                  <td style={tdStyle}>{r.effectiveFrom}</td>
                  <td style={tdStyle}>{r.tierCount}</td>
                  <td style={tdStyle}>{r.createdByName}</td>
                  <td style={tdAction}>
                    <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
                      <button onClick={() => onEdit(r.id)} style={smallBtnStyle}>{t('settings.edit')}</button>
                      {r.isActive ? (
                        <button onClick={() => onDeactivate(r.id)} style={{ ...smallBtnStyle, color: colors.danger }}>{t('settings.deactivate')}</button>
                      ) : (
                        <button onClick={() => onActivate(r.id)} style={{ ...smallBtnStyle, color: colors.success }}>{t('settings.activate')}</button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Users management sub-component
   ═══════════════════════════════════════════════════════ */

const ROLE_OPTIONS: { value: Role; i18nKey: string }[] = [
  { value: Role.Admin, i18nKey: 'users.roleAdmin' },
  { value: Role.Dispatcher, i18nKey: 'users.roleDispatcher' },
  { value: Role.Accountant, i18nKey: 'users.roleAccountant' },
  { value: Role.Assistant, i18nKey: 'users.roleAssistant' },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: colors.primary,
  dispatcher: '#3b82f6',
  accountant: colors.teal || '#0d9488',
  assistant: colors.orangeLight || '#f59e0b',
};

function UsersSection() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<UserListItem[]>('/users');
      setUsers(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreated = () => {
    setShowCreate(false);
    fetchUsers();
  };

  const getRoleBadge = (role: string) => {
    const color = ROLE_BADGE_COLORS[role] || colors.textMuted;
    const roleKey = `users.role${role.charAt(0).toUpperCase() + role.slice(1)}` as string;
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: fontSizes.xs,
        fontWeight: 600,
        color: '#fff',
        background: color,
        textTransform: 'capitalize',
      }}>
        {t(roleKey)}
      </span>
    );
  };

  return (
    <>
      <div style={stickyToolbarStyle}>
        <h2 style={sectionHeadingStyle}>{t('users.title')}</h2>
        <button onClick={() => setShowCreate(true)} style={primaryBtnStyle}>{t('users.addUser')}</button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Create user form ── */}
      {showCreate && (
        <CreateUserForm
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* ── Users table ── */}
      {loading ? (
        <LoadingBox message={t('users.loading')} />
      ) : users.length === 0 ? (
        <EmptyBox
          title={t('users.noUsers')}
          subtitle={t('users.noUsersHint')}
          actionLabel={t('users.addUser')}
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t('users.name')}</th>
                <th style={thStyle}>{t('users.email')}</th>
                <th style={thStyle}>{t('users.role')}</th>
                <th style={thStyle}>{t('users.joined')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const zebra = zebraRowProps(idx);
                return (
                  <tr key={u.id} style={zebra.style} onMouseEnter={zebra.onMouseEnter} onMouseLeave={zebra.onMouseLeave}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                    <td style={{ ...tdStyle, color: colors.textSecondary }}>{u.email}</td>
                    <td style={tdStyle}>{getRoleBadge(u.role)}</td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Create User form
   ═══════════════════════════════════════════════════════ */

function CreateUserForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Dispatcher);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: radii.md,
    fontSize: fontSizes.base,
    fontFamily,
    outline: 'none',
    transition: `border-color ${transition.normal}`,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: fontSizes.sm,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: 4,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });
      onCreated();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div style={{
      ...cardStyle,
      marginBottom: spacing.xl,
      borderLeft: `4px solid ${colors.primary}`,
    }}>
      <h3 style={{ fontSize: fontSizes.lg, fontWeight: 600, color: colors.text, marginBottom: spacing.lg }}>
        {t('users.createTitle')}
      </h3>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
          <div>
            <label style={labelStyle}>{t('users.firstName')}</label>
            <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>{t('users.lastName')}</label>
            <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
          <div>
            <label style={labelStyle}>{t('users.email')}</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>{t('users.password')}</label>
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
        </div>

        <div style={{ marginBottom: spacing.lg }}>
          <label style={labelStyle}>{t('users.role')}</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.i18nKey)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={smallBtnStyle}>
            {t('users.cancel')}
          </button>
          <button type="submit" disabled={saving} style={primaryBtnStyle}>
            {saving ? t('users.creating') : t('users.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
