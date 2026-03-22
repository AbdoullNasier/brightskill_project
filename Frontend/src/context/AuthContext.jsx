import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);
    const [tokens, setTokens] = useState({ access: null, refresh: null });

    const [activeCourseId, setActiveCourseId] = useState(null);
    const [userProgress, setUserProgress] = useState({});
    const [completedCourses, setCompletedCourses] = useState([]);

    const authHeaders = useMemo(() => {
        if (!tokens.access) return { 'Content-Type': 'application/json' };
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.access}`,
        };
    }, [tokens.access]);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedTokens = localStorage.getItem('brightskill_tokens');
                const storedUser = localStorage.getItem('brightskill_user');

                if (storedTokens && storedUser && storedTokens !== 'undefined' && storedUser !== 'undefined') {
                    const parsedTokens = JSON.parse(storedTokens);
                    const parsedUser = JSON.parse(storedUser);
                    setTokens(parsedTokens);
                    setUser(parsedUser);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                localStorage.removeItem('brightskill_tokens');
                localStorage.removeItem('brightskill_user');
            } finally {
                setInitializing(false);
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const refreshAccessToken = async () => {
        try {
            const refresh = tokens.refresh;
            if (!refresh) {
                logout();
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });

            if (!response.ok) {
                logout();
                return null;
            }

            const data = await response.json();
            const nextTokens = { ...tokens, access: data.access };
            setTokens(nextTokens);
            localStorage.setItem('brightskill_tokens', JSON.stringify(nextTokens));
            return data.access;
        } catch (error) {
            logout();
            return null;
        }
    };

    const apiRequest = async (url, options = {}) => {
        const exec = async (accessToken) => {
            const headers = {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(options.headers || {}),
            };
            return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        };

        let response = await exec(tokens.access);

        if (response.status === 401 && tokens.refresh) {
            const refreshedAccess = await refreshAccessToken();
            if (refreshedAccess) {
                response = await exec(refreshedAccess);
            }
        }

        return response;
    };

    const refreshCurrentUser = async () => {
        if (!tokens.access) return null;

        const response = await apiRequest('/auth/profile/');
        if (!response.ok) {
            return null;
        }

        const latestUser = await response.json();
        setUser(latestUser);
        localStorage.setItem('brightskill_user', JSON.stringify(latestUser));
        return latestUser;
    };

    const fetchProgressSnapshot = async () => {
        if (!isAuthenticated) return;

        const response = await apiRequest('/progress/my-progress/');
        if (!response.ok) {
            return;
        }

        const rows = await response.json();
        const progressMap = {};
        const completed = [];
        let active = null;

        rows.forEach((row) => {
            const courseId = row.course;
            const percent = Number(row.completion_percentage || 0);
            progressMap[courseId] = percent;
            if (percent >= 100) {
                completed.push(courseId);
            }
        });

        const firstActive = rows.find((row) => Number(row.completion_percentage || 0) < 100);
        if (firstActive) {
            active = firstActive.course;
        }

        setUserProgress(progressMap);
        setCompletedCourses(completed);
        setActiveCourseId(active);
        window.dispatchEvent(new Event('brightskill-progress-updated'));
    };

    useEffect(() => {
        fetchProgressSnapshot();
    }, [isAuthenticated, tokens.access]);

    useEffect(() => {
        if (!isAuthenticated || !tokens.access) return;

        const intervalId = setInterval(() => {
            refreshCurrentUser();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, tokens.access]);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const firstFieldError = Object.entries(data).find(
                    ([key, value]) => key !== 'detail' && Array.isArray(value) && value.length > 0
                );
                const message =
                    data.detail ||
                    (firstFieldError ? firstFieldError[1][0] : null) ||
                    'Invalid username or password';
                throw new Error(message);
            }

            const nextTokens = { access: data.access, refresh: data.refresh };

            setTokens(nextTokens);
            setUser(data.user);
            setIsAuthenticated(true);

            localStorage.setItem('brightskill_tokens', JSON.stringify(nextTokens));
            localStorage.setItem('brightskill_user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('brightskill-auth-changed'));

            fetchProgressSnapshot();

            return {
                success: true,
                message: 'Login successful. Redirecting...',
                user: data.user,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, username, email, password, confirmPassword) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: name,
                    username,
                    email,
                    password,
                    password2: confirmPassword,
                }),
            });

            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            const data = isJson ? await response.json().catch(() => ({})) : null;

            if (!response.ok) {
                let fallbackMessage = `Registration failed (HTTP ${response.status})`;
                if (!isJson) {
                    const htmlText = await response.text().catch(() => '');
                    if (htmlText) {
                        fallbackMessage = `Registration failed (server returned HTML, HTTP ${response.status}).`;
                    }
                }

                const errorMessage =
                    data?.detail ||
                    Object.values(data || {})[0]?.[0] ||
                    fallbackMessage;
                throw new Error(errorMessage);
            }

            const nextTokens = { access: data.access, refresh: data.refresh };
            setTokens(nextTokens);
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('brightskill_tokens', JSON.stringify(nextTokens));
            localStorage.setItem('brightskill_user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('brightskill-auth-changed'));
            fetchProgressSnapshot();
            return data.user;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('brightskill_tokens');
        localStorage.removeItem('brightskill_user');
        setTokens({ access: null, refresh: null });
        setUser(null);
        setIsAuthenticated(false);
        setActiveCourseId(null);
        setUserProgress({});
        setCompletedCourses([]);
        window.dispatchEvent(new Event('brightskill-auth-changed'));
    };

    const updateUser = async (updatedData) => {
        const response = await apiRequest('/auth/profile/', {
            method: 'PATCH',
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('brightskill_user', JSON.stringify(updatedUser));
        return updatedUser;
    };

    const enrollInCourse = async (courseId) => {
        const response = await apiRequest('/progress/enroll/', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Enrollment failed');
        }

        await fetchProgressSnapshot();
        return response.json();
    };

    const updateCourseProgress = async (courseId, moduleId) => {
        if (!moduleId) {
            throw new Error('moduleId is required to update progress');
        }

        const response = await apiRequest('/progress/complete-module/', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId, module_id: moduleId }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Failed to update module progress');
        }

        await fetchProgressSnapshot();
        return response.json();
    };

    const completeCourse = async () => {
        await fetchProgressSnapshot();
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        authHeaders,
        apiRequest,
        activeCourseId,
        userProgress,
        completedCourses,
        enrollInCourse,
        updateCourseProgress,
        completeCourse,
        refreshProgress: fetchProgressSnapshot,
        refreshCurrentUser,
    };

    return <AuthContext.Provider value={value}>{!initializing && children}</AuthContext.Provider>;
};
