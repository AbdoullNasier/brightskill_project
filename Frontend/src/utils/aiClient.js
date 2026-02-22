const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getStoredTokens = () => {
    try {
        const raw = localStorage.getItem('brightskill_tokens');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access || parsed?.refresh) return parsed;
        }

        // Backward compatibility with older token storage keys.
        const legacyAccess = localStorage.getItem('access_token');
        const legacyRefresh = localStorage.getItem('refresh_token');
        if (legacyAccess || legacyRefresh) {
            return { access: legacyAccess, refresh: legacyRefresh };
        }

        return null;
    } catch {
        return null;
    }
};

const saveStoredTokens = (tokens) => {
    localStorage.setItem('brightskill_tokens', JSON.stringify(tokens));
};

const refreshAccessToken = async () => {
    const tokens = getStoredTokens();
    const refresh = tokens?.refresh;
    if (!refresh) return null;

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.access) return null;

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
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        return { response, data };
    };

    let { response, data } = await run(access);

    if (response.status === 401) {
        const refreshedAccess = await refreshAccessToken();
        if (refreshedAccess) {
            ({ response, data } = await run(refreshedAccess));
        }
    }

    if (!response.ok) {
        throw new Error(data?.detail || data?.error || 'AI request failed');
    }

    return data;
};

export const postAI = async (path, payload) => requestAI('POST', path, payload);

export const getAI = async (path) => requestAI('GET', path);

export const patchAI = async (path, payload) => requestAI('PATCH', path, payload);

export const deleteAI = async (path) => requestAI('DELETE', path);
