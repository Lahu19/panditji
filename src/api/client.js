/**
 * Base API client — wraps fetch with auth header injection,
 * JSON parsing, and consistent error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('pj_token');
}

async function request(method, path, body, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = {
    method,
    headers,
    ...options,
  };
  if (body !== undefined) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, config);

  // Parse JSON even for error responses
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path, options)        => request('GET',    path, undefined, options),
  post:   (path, body, options)  => request('POST',   path, body,      options),
  patch:  (path, body, options)  => request('PATCH',  path, body,      options),
  put:    (path, body, options)  => request('PUT',    path, body,      options),
  delete: (path, options)        => request('DELETE', path, undefined, options),
};

export default api;
