import React from 'react';
import Card from '../../components/Card';
import { MdPeople, MdLibraryBooks, MdSchool, MdTrendingUp } from 'react-icons/md';

const AdminDashboard = () => {
    const stats = [
        { title: 'Total Users', value: '1,234', icon: <MdPeople />, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Active Learners', value: '856', icon: <MdSchool />, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Total Modules', value: '24', icon: <MdLibraryBooks />, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { title: 'Completion Rate', value: '78%', icon: <MdTrendingUp />, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    const recentSignups = [
        { name: 'Sarah Wilson', email: 'sarah@example.com', time: '2 mins ago' },
        { name: 'Mike Brown', email: 'mike@example.com', time: '1 hour ago' },
        { name: 'Emma Davis', email: 'emma@example.com', time: '3 hours ago' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="p-6 flex items-center space-x-4">
                        <div className={`p-4 rounded-lg ${stat.bg} ${stat.color} text-2xl`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Signups</h2>
                    <div className="space-y-4">
                        {recentSignups.map((user, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-semibold text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <span className="text-xs text-gray-400">{user.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">System Status</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Server Uptime</span>
                            <span className="font-semibold text-green-600">99.9%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Database Connection</span>
                            <span className="font-semibold text-green-600">Healthy</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">AI API Status</span>
                            <span className="font-semibold text-green-600">Operational</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
