import axios from 'axios';
import { clearStoredTokens, getStoredTokens, saveStoredTokens } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightskillapp.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const access = getStoredTokens()?.access;
    if (access) {
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};
        if (error?.response?.status !== 401 || originalRequest._retry) {
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.error ||
                error?.response?.data?.title?.[0] ||
                error?.response?.data?.description?.[0] ||
                error.message ||
                'Request failed';
            return Promise.reject(new Error(message));
        }

        originalRequest._retry = true;
        const tokens = getStoredTokens();
        if (!tokens?.refresh) {
            return Promise.reject(new Error('Unauthorized'));
        }

        try {
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                refresh: tokens.refresh,
            });

            const nextTokens = { ...tokens, access: refreshResponse.data.access };
            saveStoredTokens(nextTokens);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return api(originalRequest);
        } catch {
            clearStoredTokens();
            return Promise.reject(new Error('Session expired. Please login again.'));
        }
    }
);

export const getCourses = async (params = {}) => {
    const response = await api.get('/courses/', { params });
    return response.data;
};

export const getCourse = async (courseId) => {
    const response = await api.get(`/courses/${courseId}/`);
    return response.data;
};

export const createCourse = async (payload) => {
    const response = await api.post('/courses/', payload);
    return response.data;
};

export const updateCourse = async (courseId, payload) => {
    const response = await api.put(`/courses/${courseId}/`, payload);
    return response.data;
};

export const deleteCourse = async (courseId) => {
    await api.delete(`/courses/${courseId}/`);
};

export const getCourseModules = async (courseId) => {
    const response = await api.get(`/courses/${courseId}/modules/`);
    return response.data;
};

export const createModule = async (courseId, payload) => {
    const response = await api.post(`/courses/${courseId}/modules/`, payload);
    return response.data;
};

export const updateModule = async (moduleId, payload) => {
    const response = await api.put(`/modules/${moduleId}/`, payload);
    return response.data;
};

export const deleteModule = async (moduleId) => {
    await api.delete(`/modules/${moduleId}/`);
};

export const getQuizzes = async (params = {}) => {
    const response = await api.get('/progress/quiz/', { params });
    return response.data;
};

export const createQuiz = async (payload) => {
    const response = await api.post('/progress/quiz/', payload);
    return response.data;
};

export const updateQuiz = async (quizId, payload) => {
    const response = await api.put(`/progress/quiz/${quizId}/`, payload);
    return response.data;
};

export const deleteQuiz = async (quizId) => {
    await api.delete(`/progress/quiz/${quizId}/`);
};
