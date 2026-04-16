import { clearStoredTokens, getStoredTokens, saveStoredTokens } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const refreshAccessToken = async () => {
    const tokens = getStoredTokens();
    const refresh = tokens?.refresh;
    if (!refresh) return null;

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
        clearStoredTokens();
        return null;
    }

    const data = await response.json();
    if (!data?.access) {
        clearStoredTokens();
        return null;
    }

    const nextTokens = { ...tokens, access: data.access };
    saveStoredTokens(nextTokens);
    return nextTokens.access;
};

const requestAI = async (method, path, payload) => {
    let access = getStoredTokens()?.access;

    const run = async (token) => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
        });

        let data = {};
        let fallbackText = '';
        try {
            data = await response.json();
        } catch {
            try {
                fallbackText = await response.text();
            } catch {
                fallbackText = '';
            }
            data = {};
        }

        return { response, data, fallbackText };
    };

    let { response, data, fallbackText } = await run(access);

    if (response.status === 401) {
        const refreshedAccess = await refreshAccessToken();
        if (refreshedAccess) {
            ({ response, data, fallbackText } = await run(refreshedAccess));
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.detail
            || data?.error
            || data?.message
            || fallbackText
            || `${method} ${path} failed`
        );
    }

    return data;
};

export const postAI = async (path, payload) => requestAI('POST', path, payload);

export const getAI = async (path) => requestAI('GET', path);

export const patchAI = async (path, payload) => requestAI('PATCH', path, payload);

export const deleteAI = async (path) => requestAI('DELETE', path);
