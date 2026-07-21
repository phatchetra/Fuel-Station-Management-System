/**
 * Browser API helpers for Fuel Ledger Laravel backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getCsrfHeaders() {
  const token = getCookie('XSRF-TOKEN');
  return token ? { 'X-XSRF-TOKEN': token } : {};
}

async function ensureCsrfCookie() {
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
}

async function handleResponse(response) {
  let body;

  try {
    body = await response.json();
  } catch {
    throw new Error('មានបញ្ហាក្នុងម៉ាស៊ីនមេ');
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('សូម Login មុន');
  }

  if (!response.ok || body.success === false) {
    throw new Error(body.error || 'មានបញ្ហាក្នុងម៉ាស៊ីនមេ');
  }

  return body.data;
}

async function handleLoginResponse(response) {
  let body;

  try {
    body = await response.json();
  } catch {
    throw new Error('មានបញ្ហាក្នុងម៉ាស៊ីនមេ');
  }

  if (!response.ok) {
    throw new Error(body.error || 'មានបញ្ហាក្នុងការ Login');
  }

  return body.user;
}

function withFreshQuery(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}

export async function apiGet(url) {
  const response = await fetch(withFreshQuery(`${API_BASE}${url}`), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return handleResponse(response);
}

export async function apiPost(url, data) {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getCsrfHeaders(),
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  return handleResponse(response);
}

export async function apiPatch(url, data) {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE}${url}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getCsrfHeaders(),
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  return handleResponse(response);
}

export async function apiDelete(url, data) {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE}${url}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: data
      ? { 'Content-Type': 'application/json', Accept: 'application/json', ...getCsrfHeaders() }
      : { Accept: 'application/json', ...getCsrfHeaders() },
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
  });

  return handleResponse(response);
}

export async function login(email, password) {
  await ensureCsrfCookie();

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getCsrfHeaders(),
    },
    body: JSON.stringify({ email, password }),
  });

  return handleLoginResponse(response);
}

export async function logout() {
  await apiPost('/api/auth/logout', {});
}

export async function getMe() {
  return apiGet('/api/auth/me');
}
