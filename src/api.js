/**
 * API istemcisi — tüm backend iletişimi bu modülden geçer.
 * Yönetici belirteci (token) localStorage'da tutulur ve
 * her istekte Authorization başlığına eklenir.
 */

const TOKEN_KEY = 'pastmyblog-admin-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(url, { method = 'GET', body, silentAuth } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !silentAuth) clearToken();
    throw new ApiError(data.error || `İstek başarısız oldu (${res.status})`, res.status, data);
  }
  return data;
}

const qs = (params) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const api = {
  // ---- Genel ----
  getSite: () => request('/api/site'),
  getMeta: () => request('/api/meta'),
  getPosts: (params) => request(`/api/posts${qs(params)}`),
  getPost: (slug) => request(`/api/posts/${encodeURIComponent(slug)}`),
  getRelated: (slug) => request(`/api/posts/${encodeURIComponent(slug)}/related`),
  likePost: (slug) => request(`/api/posts/${encodeURIComponent(slug)}/like`, { method: 'POST' }),
  getComments: (slug) => request(`/api/posts/${encodeURIComponent(slug)}/comments`),
  addComment: (slug, body) =>
    request(`/api/posts/${encodeURIComponent(slug)}/comments`, { method: 'POST', body }),
  contact: (body) => request('/api/contact', { method: 'POST', body }),
  subscribe: (email) => request('/api/subscribe', { method: 'POST', body: { email } }),

  // ---- Yönetici ----
  login: (username, password) =>
    request('/api/admin/login', { method: 'POST', body: { username, password }, silentAuth: true }),
  logout: () => request('/api/admin/logout', { method: 'POST' }),
  me: () => request('/api/admin/me', { silentAuth: true }),
  stats: () => request('/api/admin/stats'),

  adminPosts: () => request('/api/admin/posts'),
  adminPost: (id) => request(`/api/admin/posts/${id}`),
  createPost: (body) => request('/api/admin/posts', { method: 'POST', body }),
  updatePost: (id, body) => request(`/api/admin/posts/${id}`, { method: 'PATCH', body }),
  deletePost: (id) => request(`/api/admin/posts/${id}`, { method: 'DELETE' }),

  adminComments: (status) => request(`/api/admin/comments${qs({ status })}`),
  moderateComment: (id, approved) =>
    request(`/api/admin/comments/${id}`, { method: 'PATCH', body: { approved } }),
  deleteComment: (id) => request(`/api/admin/comments/${id}`, { method: 'DELETE' }),

  adminMessages: () => request('/api/admin/messages'),
  markMessage: (id, read) => request(`/api/admin/messages/${id}`, { method: 'PATCH', body: { read } }),
  deleteMessage: (id) => request(`/api/admin/messages/${id}`, { method: 'DELETE' }),

  adminSubscribers: () => request('/api/admin/subscribers'),
  deleteSubscriber: (id) => request(`/api/admin/subscribers/${id}`, { method: 'DELETE' }),
};
