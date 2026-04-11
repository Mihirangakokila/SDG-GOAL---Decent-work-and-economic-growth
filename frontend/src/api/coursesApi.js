import client from './client.js';

export const getCoursesApi = (params) => client.get('/courses', params ? { params } : undefined);
export const createCourseApi = (payload) => client.post('/courses', payload);
export const getMyCoursesApi = () => client.get('/courses/my');
export const updateCourseApi = (id, payload) => client.put(`/courses/${id}`, payload);
export const deleteCourseApi = (id) => client.delete(`/courses/${id}`);
