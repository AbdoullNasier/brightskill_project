import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const GamificationContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAccessToken = () => {
    try {
        const raw = localStorage.getItem('brightskill_tokens');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.access || null;
    } catch {
        return null;
    }
};

export const GamificationProvider = ({ children }) => {
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [badges, setBadges] = useState([]);

    const refreshGamification = useCallback(async () => {
        const access = getAccessToken();
        if (!access) {
            setXp(0);
            setLevel(1);
            setBadges([]);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/dashboard/`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
            });
            if (!response.ok) return;
            const data = await response.json();
            setXp(Number(data?.stats?.xp || 0));
            setLevel(Number(data?.stats?.level || 1));
            setBadges(Array.isArray(data?.badges) ? data.badges : []);
        } catch {
            // Keep existing values when request fails.
        }
    }, []);

    useEffect(() => {
        refreshGamification();
        const onAuthChange = () => {
            refreshGamification();
        };
        const onProgressChange = () => {
            refreshGamification();
        };
        window.addEventListener('brightskill-auth-changed', onAuthChange);
        window.addEventListener('brightskill-progress-updated', onProgressChange);
        return () => {
            window.removeEventListener('brightskill-auth-changed', onAuthChange);
            window.removeEventListener('brightskill-progress-updated', onProgressChange);
        };
    }, [refreshGamification]);

    // Calculate XP needed for next level (same formula used by backend level policy)
    const nextLevelXp = level * 1000;
    const progressToNextLevel = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0;

    const addXp = (amount) => {
        setXp((prev) => {
            const newXp = prev + amount;
            // Check for level up
            if (newXp >= nextLevelXp) {
                setLevel((l) => l + 1);
                // Could trigger a modal or toast here in a real app
                console.log("Level Up!");
            }
            return newXp;
        });
    };

    const awardBadge = (badge) => {
        if (!badges.find(b => b.id === badge.id)) {
            setBadges(prev => [...prev, badge]);
        }
    };

    return (
        <GamificationContext.Provider value={{ xp, level, badges, addXp, nextLevelXp, progressToNextLevel, awardBadge, refreshGamification }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => useContext(GamificationContext);
