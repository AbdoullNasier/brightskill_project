import React, { createContext, useState, useContext, useEffect } from 'react';

const GamificationContext = createContext();

export const GamificationProvider = ({ children }) => {
    const [xp, setXp] = useState(2450);
    const [level, setLevel] = useState(5);
    const [badges, setBadges] = useState([
        { id: 1, name: 'Early Bird', icon: 'MdWbSunny', description: 'Completed a lesson before 8 AM' },
        { id: 2, name: 'Fast Learner', icon: 'MdSpeed', description: 'Finished a module in record time' },
    ]);

    // Calculate XP needed for next level (simple formula: level * 1000)
    const nextLevelXp = level * 1000;
    const progressToNextLevel = (xp / nextLevelXp) * 100;

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
        <GamificationContext.Provider value={{ xp, level, badges, addXp, nextLevelXp, progressToNextLevel, awardBadge }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => useContext(GamificationContext);
