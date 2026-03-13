'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@lol/shared';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getErrorMessage } from '@/lib/errors';
import { colors, fontSizes, fontFamily, radii, shadows, spacing, inputStyle, labelStyle, primaryBtnStyle, loadingBtnStyle, validationErrorStyle } from '@/lib/styles';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bgPage,
        fontFamily,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.bgWhite,
          padding: '40px 36px 36px',
          borderRadius: radii.xl,
          boxShadow: shadows.login,
          width: 380,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: fontSizes.xxl, fontWeight: 700, color: colors.text, letterSpacing: '-0.02em' }}>{APP_NAME}</h1>
          <p style={{ margin: `6px 0 0`, fontSize: fontSizes.md, color: colors.textMuted, fontWeight: 400 }}>
            {t('login.title')}
          </p>
        </div>

        {error && (
          <div style={validationErrorStyle}>{error}</div>
        )}

        <div style={{ marginBottom: spacing.xl }}>
          <label style={labelStyle}>{t('login.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('login.emailPlaceholder')}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: spacing.xxl }}>
          <label style={labelStyle}>{t('login.password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={t('login.passwordPlaceholder')}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...loadingBtnStyle(primaryBtnStyle, loading), width: '100%', padding: `10px ${spacing.xl}`, fontSize: fontSizes.md }}
        >
          {loading ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
    </main>
  );
}
