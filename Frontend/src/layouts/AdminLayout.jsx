import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    MdDashboard,
    MdLibraryBooks,
    MdAnalytics,
    MdLogout,
    MdPeople,
    MdSchool,
    MdChevronLeft,
    MdSettings,
    MdMenu,
    MdClose,
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Images/logo1.png';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMobileSidebarOpen(false);
        navigate('/login');
    };

    const adminSidebarLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <MdDashboard /> },
        { name: 'Users', path: '/admin/users', icon: <MdPeople /> },
        { name: 'Tutor Applications', path: '/admin/tutor-applications', icon: <MdSchool /> },
        { name: 'Content Management', path: '/admin/content', icon: <MdLibraryBooks /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <MdAnalytics /> },
        { name: 'Profile Settings', path: '/admin/profile', icon: <MdSettings /> },
    ];

    const tutorSidebarLinks = [
        { name: 'Tutor Dashboard', path: '/admin/tutor-dashboard', icon: <MdSchool /> },
        { name: 'Content Management', path: '/admin/content', icon: <MdLibraryBooks /> },
        { name: 'Profile Settings', path: '/admin/profile', icon: <MdSettings /> },
    ];

    const sidebarLinks = user?.role === 'tutor' ? tutorSidebarLinks : adminSidebarLinks;

    const renderSidebarContent = (isMobile = false) => (
        <>
            <div className={`p-4 border-b flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
                {(!collapsed || isMobile) && (
                    <div className="flex items-center min-w-0">
                        <img src={logo} alt="BrightSkill" className="h-10" />
                        <span className="ml-2 font-bold text-gray-700 truncate">{user?.role === 'tutor' ? 'Tutor' : 'Admin'}</span>
                    </div>
                )}
                {isMobile ? (
                    <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(false)}
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                        aria-label="Close dashboard menu"
                    >
                        <MdClose size={22} />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setCollapsed((prev) => !prev)}
                        className="rounded-md p-1 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <MdMenu size={20} /> : <MdChevronLeft size={20} />}
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                <ul className="space-y-2 px-2">
                    {sidebarLinks.map((link) => (
                        <li key={link.path}>
                            <Link
                                to={link.path}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={`flex items-center p-3 rounded-lg transition-colors ${collapsed && !isMobile ? 'justify-center' : ''} ${location.pathname === link.path
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                                    }`}
                            >
                                <span className={`text-xl ${collapsed && !isMobile ? '' : 'mr-3'}`}>{link.icon}</span>
                                {(!collapsed || isMobile) && <span className="font-medium truncate">{link.name}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t">
                <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-100 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
                >
                    <MdLogout className={`text-xl ${collapsed && !isMobile ? '' : 'mr-3'}`} />
                    {(!collapsed || isMobile) && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className={`${collapsed ? 'w-20' : 'w-64'} hidden md:flex shrink-0 overflow-x-hidden bg-white shadow-lg flex-col transition-all duration-300`}>
                {renderSidebarContent()}
            </div>

            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-gray-900/40"
                        onClick={() => setMobileSidebarOpen(false)}
                        aria-label="Close dashboard menu overlay"
                    />
                    <aside className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-x-hidden bg-white shadow-2xl">
                        {renderSidebarContent(true)}
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:hidden">
                    <div className="flex min-w-0 items-center">
                        <img src={logo} alt="BrightSkill" className="h-9" />
                        <span className="ml-2 truncate font-bold text-gray-700">{user?.role === 'tutor' ? 'Tutor' : 'Admin'}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        aria-label="Open dashboard menu"
                    >
                        <MdMenu size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-auto">
                    <main className="p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
