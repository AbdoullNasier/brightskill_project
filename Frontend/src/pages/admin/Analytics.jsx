import React from 'react';
import Card from '../../components/Card';
import { MdTrendingUp, MdBarChart, MdPieChart } from 'react-icons/md';

const Analytics = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Platform Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800">User Growth</h2>
                        <MdTrendingUp className="text-green-500 text-2xl" />
                    </div>
                    <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                        [Line Chart Placeholder: Users over time]
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Module Popularity</h2>
                        <MdBarChart className="text-indigo-500 text-2xl" />
                    </div>
                    {/* Mock Bar Chart Items */}
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Communication</span>
                                <span className="font-bold">45%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Leadership</span>
                                <span className="font-bold">30%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Teamwork</span>
                                <span className="font-bold">25%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Engagement Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">Avg. Session Time</p>
                        <p className="text-xl font-bold text-blue-700">24m 30s</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-500">Completion Rate</p>
                        <p className="text-xl font-bold text-purple-700">68%</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-500">Return Rate</p>
                        <p className="text-xl font-bold text-orange-700">42%</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Analytics;
