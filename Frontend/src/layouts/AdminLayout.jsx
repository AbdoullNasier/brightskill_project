import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdLibraryBooks, MdAnalytics, MdLogout, MdSettings } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Images/logo1.png';

const AdminLayout = () => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <MdDashboard /> },
        { name: 'Content Management', path: '/admin/content', icon: <MdLibraryBooks /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <MdAnalytics /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-4 border-b flex items-center justify-center">
                    <img src={logo} alt="BrightSkill" className="h-10" />
                    <span className="ml-2 font-bold text-gray-700">Admin</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-2 px-2">
                        {sidebarLinks.map((link) => (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center p-3 rounded-lg transition-colors ${location.pathname === link.path
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-xl mr-3">{link.icon}</span>
                                    <span className="font-medium">{link.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <MdLogout className="text-xl mr-3" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
