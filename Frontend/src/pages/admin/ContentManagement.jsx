import React, { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';

const ContentManagement = () => {
    // Mock Data
    const [modules, setModules] = useState([
        { id: 1, title: 'Introduction to Communication', category: 'Communication', level: 'Beginner' },
        { id: 2, title: 'Leadership Essentials', category: 'Leadership', level: 'Intermediate' },
        { id: 3, title: 'Teamwork Dynamics', category: 'Teamwork', level: 'Beginner' },
        { id: 4, title: 'Advanced Negotiation', category: 'Communication', level: 'Advanced' },
    ]);

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this module?')) {
            setModules(modules.filter(m => m.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Content Management</h1>
                <Button className="flex items-center space-x-2">
                    <MdAdd /> <span>Add New Module</span>
                </Button>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {modules.map((module) => (
                                <tr key={module.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{module.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{module.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${module.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                                                module.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {module.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button className="text-indigo-600 hover:text-indigo-900"><MdEdit size={18} /></button>
                                        <button onClick={() => handleDelete(module.id)} className="text-red-600 hover:text-red-900"><MdDelete size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ContentManagement;
