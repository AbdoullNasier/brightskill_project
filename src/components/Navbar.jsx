import React, { useState } from 'react';
import logo from '../assets/Images/logo1.png';
import { Link, useLocation } from 'react-router-dom';
import { MdMenu, MdClose, MdLanguage, MdStar, MdFlashOn } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { language, toggleLanguage, t } = useLanguage();
    const { xp, level, progressToNextLevel } = useGamification();
    const { user, isAuthenticated, logout } = useAuth(); // Use real auth context
    const location = useLocation();

    // Link sets
    const publicLinks = [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.about'), path: '/about' },
        { name: t('nav.skills'), path: '/skills' },
        { name: t('nav.contact'), path: '/contact' },
        { name: t('nav.howItWorks'), path: '/how-it-works' },
    ];

    // Links for Learners
    const learnerLinks = [
        { name: t('nav.dashboard'), path: '/dashboard' },
        { name: t('nav.learning'), path: '/learning-path' },
        { name: t('nav.roleplay'), path: '/ai-roleplay' },
        { name: t('nav.skills'), path: '/skills' }, // Shared link
    ];

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Content', path: '/admin/content' },
        { name: 'Analytics', path: '/admin/analytics' },
    ];

    let navLinks = [];
    if (!isAuthenticated) {
        navLinks = publicLinks;
    } else if (user?.role === 'admin') {
        navLinks = adminLinks;
    } else {
        navLinks = learnerLinks;
    }

    const isActive = (path) => location.pathname === path;

    const AuthButtons = () => {
        if (!isAuthenticated) {
            return (
                <div className="flex items-center space-x-4">
                    <Link to="/login">
                        <Button variant="ghost" className="!px-4">{t('nav.login')}</Button>
                    </Link>
                    <Link to="/register">
                        <Button className="!px-4 text-sm">{t('nav.signup')}</Button>
                    </Link>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-sm font-bold text-gray-700">{user?.name} <span className="text-gray-500 font-normal">({user?.username})</span></span>
                    {user?.role === 'learner' && <span className="text-xs text-primary">Lvl {level}</span>}
                </div>
                <img
                    src={user?.avatar || 'https://via.placeholder.com/40'}
                    alt="Profile"
                    className="h-10 w-10 rounded-full border border-gray-200"
                />
                <Button onClick={logout} variant="outline" className="!px-3 text-sm">{t('nav.logout')}</Button>
            </div>
        );
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <img src={logo} alt="BrightSkill Logo" className="h-12 w-auto mr-2" />
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-14">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors duration-200 ${isActive(link.path)
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-gray-600 hover:text-primary'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">

                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="hidden md:flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors"
                        >
                            <MdLanguage size={20} />
                            <span className="font-bold">{language}</span>
                        </button>

                        <AuthButtons />

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={toggleLanguage}
                                className="mr-4 flex items-center space-x-1 text-gray-600"
                            >
                                <span className="font-bold">{language}</span>
                            </button>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-600 hover:text-primary focus:outline-none"
                            >
                                {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-fade-in-down">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {isAuthenticated && (
                                <div className="flex items-center p-3 mb-2 bg-gray-50 rounded-lg">
                                    <img
                                        src={user?.avatar}
                                        alt="Profile"
                                        className="h-10 w-10 rounded-full border border-gray-200 mr-3"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-800">{user?.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                    </div>
                                </div>
                            )}

                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                                        ? 'bg-indigo-50 text-primary'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {!isAuthenticated ? (
                                <div className="pt-4 space-y-2 border-t border-gray-100 mt-4">
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full">
                                        <Button variant="ghost" className="w-full text-left">{t('nav.login')}</Button>
                                    </Link>
                                    <Link to="/register" onClick={() => setIsOpen(false)} className="block w-full">
                                        <Button className="w-full">{t('nav.signup')}</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-gray-100 mt-4">
                                    <Button onClick={() => { logout(); setIsOpen(false); }} variant="outline" className="w-full text-left">{t('nav.logout')}</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
