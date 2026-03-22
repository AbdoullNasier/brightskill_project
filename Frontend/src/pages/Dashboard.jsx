import React, { useEffect, useState } from 'react';
import { MdTrendingUp, MdAccessTime, MdStar, MdBook } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import Leaderboard from '../components/Leaderboard';
import CareerAssessmentModal from '../components/CareerAssessmentModal';
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user, apiRequest } = useAuth();
    const { badges, refreshGamification } = useGamification();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const displayName = user?.first_name || user?.username || 'User';
    const profileInitial = displayName.charAt(0).toUpperCase();

    const [showCareerModal, setShowCareerModal] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [bookRecommendations, setBookRecommendations] = useState([]);
    const [interviewBookRecommendation, setInterviewBookRecommendation] = useState(null);

    useEffect(() => {
        const loadDashboard = async () => {
            refreshGamification();
            const [dashboardRes, booksRes] = await Promise.all([
                apiRequest('/auth/dashboard/'),
                apiRequest('/books/'),
            ]);

            if (dashboardRes.ok) {
                const data = await dashboardRes.json();
                setDashboardData(data);
                if (!data.has_learning_path) {
                    setTimeout(() => setShowCareerModal(true), 600);
                }
            }

            if (booksRes.ok) {
                const books = await booksRes.json();
                const normalizedBooks = Array.isArray(books) ? books : [];
                const interviewBook = normalizedBooks.find((book) => book.source_type === 'conversation') || null;
                setInterviewBookRecommendation(interviewBook);
                setBookRecommendations(
                    normalizedBooks
                        .filter((book) => !interviewBook || book.id !== interviewBook.id)
                        .slice(0, 2)
                );
            }
        };

        loadDashboard();
    }, [user?.id, refreshGamification]);

    const handleCloseModal = () => setShowCareerModal(false);

    const stats = dashboardData?.stats || {
        xp: 0,
        completed_courses: 0,
        lessons_completed: 0,
        certificates: 0,
    };

    const continueCourse = dashboardData?.continue_learning;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CareerAssessmentModal isOpen={showCareerModal} onClose={handleCloseModal} />
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 mb-8">
                {t('dash.welcome')}, {displayName}!
            </motion.h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card delay={0.1} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-100 text-primary rounded-lg">
                        <MdTrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Level</p>
                        <p className="text-xl font-bold">{dashboardData?.stats?.level || 1}</p>
                    </div>
                </Card>
                <Card delay={0.2} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-100 text-secondary rounded-lg">
                        <MdAccessTime size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Lessons Completed</p>
                        <p className="text-xl font-bold">{stats.lessons_completed}</p>
                    </div>
                </Card>
                <Card delay={0.3} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                        <MdStar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('dash.total_xp')}</p>
                        <p className="text-xl font-bold">{stats.xp.toLocaleString()}</p>
                    </div>
                </Card>
                <Card delay={0.4} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <MdBook size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('dash.modules_done')}</p>
                        <p className="text-xl font-bold">{stats.completed_courses}</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dash.continue_learning')}</h2>
                        {continueCourse ? (
                            <div onClick={() => navigate(`/lesson/${continueCourse.course_id}`)} className="cursor-pointer transition-transform hover:scale-[1.01]">
                                <Card className="flex flex-col sm:flex-row gap-6">
                                    <div className="w-full sm:w-1/3 bg-gray-200 rounded-lg h-32 sm:h-auto flex items-center justify-center text-gray-400">
                                        Active Course
                                    </div>
                                    <div className="flex-1 py-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">{continueCourse.course_title}</h3>
                                            <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full capitalize">{continueCourse.difficulty}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">Continue your active learning path from where you stopped.</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Progress</span>
                                                <span>{continueCourse.completion_percentage}%</span>
                                            </div>
                                            <ProgressBar progress={continueCourse.completion_percentage} />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <Card className="p-6">No active course. Start from the skills page.</Card>
                        )}
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">From Your Interview</h2>
                        {interviewBookRecommendation ? (
                            <Card className="p-5 border border-indigo-100 bg-indigo-50/60" hover={false}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Recommended Book</p>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{interviewBookRecommendation.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{interviewBookRecommendation.author}</p>
                                <p className="text-sm text-gray-700 leading-7">{interviewBookRecommendation.reason}</p>
                            </Card>
                        ) : (
                            <Card className="p-4">No interview recommendation yet. Complete your assessment to get a contextual book recommendation.</Card>
                        )}
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dash.recommended')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {bookRecommendations.length === 0 && <Card className="p-4">No recommendations yet. Complete lessons and roleplay sessions.</Card>}
                            {bookRecommendations.map((book) => (
                                <Card key={book.id} className="p-4 flex gap-4" hover={false}>
                                    <div className="w-16 h-24 rounded shadow-sm bg-gray-100 flex items-center justify-center text-xs text-gray-500">Book</div>
                                    <div>
                                        <h4 className="font-bold text-sm mb-1">{book.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{book.author}</p>
                                        <p className="text-xs text-gray-600">{book.reason}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <Card className="text-center p-6 bg-gradient-to-br from-indigo-50 to-white">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-400 border-4 border-white shadow-md overflow-hidden">
                            {user?.avatar ? <img src={user?.avatar} alt={displayName} className="w-full h-full object-cover" /> : profileInitial}
                        </div>
                        <h3 className="font-bold text-lg">{displayName}</h3>
                        <p className="text-sm text-gray-500 mb-1">@{user?.username}</p>
                        <p className="text-sm text-gray-500 mb-4">{t('dash.learner')}</p>
                        <Button onClick={() => navigate('/profile/edit')} variant="outline" className="w-full text-sm">
                            {t('dash.edit_profile')}
                        </Button>
                    </Card>

                    <Leaderboard />

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">{t('dash.your_badges')}</h3>
                            <span onClick={() => navigate('/badges')} className="text-xs font-medium text-primary cursor-pointer hover:underline">
                                {t('dash.view_all')}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {badges.slice(0, 4).map((badge) => (
                                <Badge key={badge.id} {...badge} className="text-xs" />
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
