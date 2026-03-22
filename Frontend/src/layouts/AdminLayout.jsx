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
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Images/logo1.png';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
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

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className={`${collapsed ? 'w-20' : 'w-64'} shrink-0 overflow-x-hidden bg-white shadow-lg flex flex-col transition-all duration-300`}>
                <div className={`p-4 border-b flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <div className="flex items-center min-w-0">
                            <img src={logo} alt="BrightSkill" className="h-10" />
                            <span className="ml-2 font-bold text-gray-700 truncate">{user?.role === 'tutor' ? 'Tutor' : 'Admin'}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setCollapsed((prev) => !prev)}
                        className="rounded-md p-1 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <MdMenu size={20} /> : <MdChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                    <ul className="space-y-2 px-2">
                        {sidebarLinks.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center p-3 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''} ${location.pathname === link.path
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                                        }`}
                                >
                                    <span className={`text-xl ${collapsed ? '' : 'mr-3'}`}>{link.icon}</span>
                                    {!collapsed && <span className="font-medium truncate">{link.name}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-100 transition-colors ${collapsed ? 'justify-center' : ''}`}
                    >
                        <MdLogout className={`text-xl ${collapsed ? '' : 'mr-3'}`} />
                        {!collapsed && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
