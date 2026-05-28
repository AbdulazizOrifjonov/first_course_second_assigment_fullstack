const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken() {
  return sessionStorage.getItem('tybt_token');
}

export function setToken(token) {
  if (token) sessionStorage.setItem('tybt_token', token);
  else sessionStorage.removeItem('tybt_token');
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Server xatosi (${res.status})`);
  }

  if (res.status === 204) return undefined;
  return res.json();
}
