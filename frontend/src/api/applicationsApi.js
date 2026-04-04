import client from './client.js';

export const applyToCourseApi = (courseId) => client.post('/applications', { courseId });
export const myApplicationsApi = () => client.get('/applications/my');
