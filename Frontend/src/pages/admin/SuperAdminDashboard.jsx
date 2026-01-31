import React, { useState } from 'react';
import { MdSecurity, MdPersonAdd, MdDelete, MdEdit } from 'react-icons/md';

const SuperAdminDashboard = () => {
    // Mock user list
    const [users, setUsers] = useState([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'learner' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'tutor' },
        { id: 3, name: 'Admin User', email: 'admin@brightskill.com', role: 'admin' },
    ]);

    const handleRoleChange = (id, newRole) => {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center text-gray-800">
                <MdSecurity className="mr-3 text-red-600" /> Super Admin Control Panel
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <p className="text-3xl font-bold text-gray-800">1,234</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Tutors</h3>
                    <p className="text-3xl font-bold text-secondary">45</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">System Health</h3>
                    <p className="text-3xl font-bold text-green-500">98%</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                    <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                        <MdPersonAdd className="mr-2" />
                        Create New Admin
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
                                        >
                                            <option value="learner">Learner</option>
                                            <option value="tutor">Tutor</option>
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 flex space-x-3">
                                        <button className="text-blue-600 hover:text-blue-800" title="Edit Permissions">
                                            <MdEdit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700" title="Delete User">
                                            <MdDelete size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
