'use client';

import { API_PREFIX } from '@lol/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Thin wrapper over fetch for authenticated API calls.
 * Reads the JWT from sessionStorage and attaches it as Bearer token.
 * Throws on non-OK responses with the server error message.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem('lol_token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.message || `API error ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}
