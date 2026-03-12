'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Action } from '@lol/shared';
import type { SalaryRuleListItem, SalaryRuleDto, SalaryRuleTier } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/permissions';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { primaryBtnStyle, smallBtnStyle, thStyle, tdStyle } from '@/lib/styles';
import { ErrorBanner, LoadingBox, EmptyBox } from '@/components/StateBoxes';
import { PageShell } from '@/components/PageShell';
import { SalaryRuleEditor } from './SalaryRuleEditor';

type View = 'list' | 'create' | 'edit';

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { can: allowed } = usePermissions();
  const router = useRouter();

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

  if (authLoading) return <main style={{ padding: '2rem' }}>Loading...</main>;
  if (!user) return null;

  if (!allowed(Action.SalaryRulesRead)) {
    return (
      <PageShell
        breadcrumb="/ Settings"
        user={user}
        onLogout={logout}
        nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]}
      >
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#d32f2f',
          background: '#fff5f5',
          borderRadius: 6,
          border: '1px solid #ffcdd2',
        }}>
          <strong>Access Denied</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.875rem' }}>
            You do not have permission to view salary rule settings. Contact an administrator if you need access.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumb="/ Settings / Salary Rules"
      user={user}
      onLogout={logout}
      nav={[{label:'Home',href:'/'},{label:'Loads',href:'/loads'}]}
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Views ── */}
      {view === 'list' && (
        <RulesList
          rules={rules}
          loading={loading}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <SalaryRuleEditor
          initial={editingRule}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      )}
    </PageShell>
  );
}

// ── Rules list sub-component ──

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
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Salary Rule Sets</h2>
        <button onClick={onCreate} style={primaryBtnStyle}>+ New Rule Set</button>
      </div>

      {loading ? (
        <LoadingBox />
      ) : rules.length === 0 ? (
        <EmptyBox title="No salary rule sets configured." subtitle="Create a rule set to define dispatcher salary brackets." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Version</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Effective From</th>
                <th style={thStyle}>Tiers</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>v{r.version}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: r.isActive ? '#e8f5e9' : '#f5f5f5',
                      color: r.isActive ? '#2e7d32' : '#888',
                    }}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>{r.effectiveFrom}</td>
                  <td style={tdStyle}>{r.tierCount}</td>
                  <td style={tdStyle}>{r.createdByName}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button onClick={() => onEdit(r.id)} style={smallBtnStyle}>Edit</button>
                      {r.isActive ? (
                        <button onClick={() => onDeactivate(r.id)} style={{ ...smallBtnStyle, color: '#d32f2f' }}>Deactivate</button>
                      ) : (
                        <button onClick={() => onActivate(r.id)} style={{ ...smallBtnStyle, color: '#2e7d32' }}>Activate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
