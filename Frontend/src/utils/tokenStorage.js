const TOKEN_STORAGE_KEY = 'brightskill_tokens';
const USER_STORAGE_KEY = 'brightskill_user';

const safeParse = (rawValue) => {
    if (!rawValue || rawValue === 'undefined') return null;

    try {
        return JSON.parse(rawValue);
    } catch {
        return null;
    }
};

export const getStoredTokens = () => {
    const stored = safeParse(localStorage.getItem(TOKEN_STORAGE_KEY));
    if (stored?.access || stored?.refresh) {
        return {
            access: stored.access || null,
            refresh: stored.refresh || null,
        };
    }

    // Backward compatibility with older storage keys.
    const legacyAccess = localStorage.getItem('access') || localStorage.getItem('access_token');
    const legacyRefresh = localStorage.getItem('refresh_token');
    if (legacyAccess || legacyRefresh) {
        return {
            access: legacyAccess || null,
            refresh: legacyRefresh || null,
        };
    }

    return null;
};

export const saveStoredTokens = (tokens) => {
    const normalized = {
        access: tokens?.access || null,
        refresh: tokens?.refresh || null,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(normalized));
};

export const clearStoredTokens = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('access');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const getStoredUser = () => safeParse(localStorage.getItem(USER_STORAGE_KEY));

export const saveStoredUser = (user) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const TOKEN_KEYS = {
    tokenStorageKey: TOKEN_STORAGE_KEY,
    userStorageKey: USER_STORAGE_KEY,
};
