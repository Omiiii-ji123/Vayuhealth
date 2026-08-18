import client from './client';

// 6. User Controller — /api/users

/** GET /api/users/{email} — Retrieve a user by email */
export const getUserByEmail = (email) =>
  client.get(`/api/users/${encodeURIComponent(email)}`).then((r) => r.data);

/** POST /api/users — Create a new user */
export const createUser = (payload) => client.post('/api/users', payload).then((r) => r.data);

/** PUT /api/users/{email} — Update an existing user by email */
export const updateUser = (email, payload) =>
  client.put(`/api/users/${encodeURIComponent(email)}`, payload).then((r) => r.data);
