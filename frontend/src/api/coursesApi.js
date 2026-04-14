import api from '../services/api.js';

export const getCoursesApi    = (params)       => api.get('/courses',         params ? { params } : undefined);
export const createCourseApi  = (payload)      => api.post('/courses',        payload);
export const getMyCoursesApi  = ()             => api.get('/courses/my');
export const updateCourseApi  = (id, payload)  => api.put(`/courses/${id}`,   payload);
export const deleteCourseApi  = (id)           => api.delete(`/courses/${id}`);
