import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Initialize language from localStorage or default to 'EN'
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('brightskill_language') || 'EN';
    });

    useEffect(() => {
        localStorage.setItem('brightskill_language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'EN' ? 'HA' : 'EN'));
    };

    const t = (key) => {
        const translation = translations[key];
        if (!translation) return key; // Fallback to key if not found
        return translation[language] || translation['EN'] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
