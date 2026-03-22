import React, { useEffect, useState } from 'react';
import { MdSchool, MdUploadFile, MdAssignment } from 'react-icons/md';
import { apiGet, apiPost } from '../../utils/apiClient';

const TutorDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        course: '',
        title: '',
        order: 1,
        content: '',
        video_url: '',
    });

    const loadCourses = async () => {
        try {
            const data = await apiGet('/courses/');
            const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            setCourses(rows);
            if (!form.course && rows.length > 0) {
                setForm((prev) => ({ ...prev, course: String(rows[0].id) }));
            }
        } catch (err) {
            setError(err.message || 'Failed to load courses');
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const submitLesson = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!form.course || !form.title.trim() || !form.content.trim()) {
            setError('Course, title and content are required');
            return;
        }
        try {
            await apiPost(`/courses/${Number(form.course)}/modules/`, {
                title: form.title.trim(),
                order_index: Number(form.order) || 1,
                content: form.content.trim(),
                youtube_url: form.video_url.trim() || null,
            });
            setSuccess('Module created successfully.');
            setForm((prev) => ({
                ...prev,
                title: '',
                content: '',
                order: 1,
                video_url: '',
            }));
            await loadCourses();
        } catch (err) {
            setError(err.message || 'Failed to create module');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center text-gray-800">
                <MdSchool className="mr-3 text-secondary" /> Tutor Content Studio
            </h1>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <MdUploadFile className="mr-2 text-primary" /> Create New Module
                    </h2>
                    <form className="space-y-4" onSubmit={submitLesson}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={form.course}
                                onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))}
                            >
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g. Difficult Conversations"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reading Content</label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                rows="6"
                                value={form.content}
                                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                                placeholder="Module reading content"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL (optional)</label>
                            <input
                                type="url"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={form.video_url}
                                onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={form.order}
                                onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
                            />
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                                Save Module
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <MdAssignment className="mr-2 text-secondary" /> Available Courses
                    </h2>
                    <div className="space-y-4">
                        {courses.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <h4 className="font-bold text-gray-800">{item.title}</h4>
                                    <p className="text-sm text-gray-500">{item.modules?.length || 0} modules</p>
                                </div>
                            </div>
                        ))}
                        {courses.length === 0 && (
                            <p className="text-sm text-gray-500">No courses available yet. Create one in Content Management.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorDashboard;
