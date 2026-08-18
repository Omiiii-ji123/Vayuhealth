import client from './client';

// 2. Authentication Controller — /api/auth

/** POST /api/auth/register — Register a new user */
export const registerUser = (payload) =>
  client.post('/api/auth/register', payload).then((r) => r.data);

/** POST /api/auth/login — Authenticate an existing user */
export const loginUser = (payload) =>
  client.post('/api/auth/login', payload).then((r) => r.data);

/** PUT /api/auth/profile/{id} — Update a user's health profile */
export const updateHealthProfile = (id, payload) =>
  client.put(`/api/auth/profile/${encodeURIComponent(id)}`, payload).then((r) => r.data);
