import client from './client.js';

export const registerUserApi = (payload) => client.post('/auth/register/user', payload);
export const registerOrganizerApi = (payload) =>
  client.post('/auth/register/organizer', payload);
export const loginApi = (payload) => client.post('/auth/login', payload);
export const meApi = () => client.get('/auth/me');
