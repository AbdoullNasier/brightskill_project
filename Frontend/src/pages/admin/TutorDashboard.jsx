import React from 'react';
import { MdSchool, MdUploadFile, MdAssignment } from 'react-icons/md';

const TutorDashboard = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center text-gray-800">
                <MdSchool className="mr-3 text-secondary" /> Tutor Content Studio
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <MdUploadFile className="mr-2 text-primary" /> Upload New Lesson
                    </h2>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                            <input type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g. Advanced Leadership Skills" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" rows="4" placeholder="What will students learn?"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg">
                                <option>Video</option>
                                <option>Article / Reading</option>
                                <option>Quiz</option>
                            </select>
                        </div>
                        <div className="pt-4">
                            <button type="button" className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                                Upload Content
                            </button>
                        </div>
                    </form>
                </div>

                {/* Existing Content */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <MdAssignment className="mr-2 text-secondary" /> Manage My Courses
                    </h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <h4 className="font-bold text-gray-800">Introduction to Public Speaking</h4>
                                    <p className="text-sm text-gray-500">Last updated: 2 days ago</p>
                                </div>
                                <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-100">
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorDashboard;
