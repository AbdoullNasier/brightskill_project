import React, { useState, useEffect } from 'react';
import { MdTrendingUp, MdAccessTime, MdStar, MdBook } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import Leaderboard from '../components/Leaderboard';
import CareerAssessmentModal from '../components/CareerAssessmentModal'; // Import Modal
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext'; // Fixed import
import { booksData } from '../data/booksData';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth(); // Import user from AuthContext
    const { badges } = useGamification();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [showCareerModal, setShowCareerModal] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Check if user has seen the career assessment modal
        const hasSeen = localStorage.getItem(`hasSeenCareerAssessment_${user.id}`);
        if (!hasSeen) {
            // Show modal after a short delay for better UX
            const timer = setTimeout(() => {
                setShowCareerModal(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleCloseModal = () => {
        setShowCareerModal(false);
        if (user) {
            localStorage.setItem(`hasSeenCareerAssessment_${user.id}`, 'true');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CareerAssessmentModal isOpen={showCareerModal} onClose={handleCloseModal} />
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-900 mb-8"
            >
                {t('dash.welcome')}, {user?.username || user?.name}!
            </motion.h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card delay={0.1} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-100 text-primary rounded-lg">
                        <MdTrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('dash.streak')}</p>
                        <p className="text-xl font-bold">5 Days</p>
                    </div>
                </Card>
                <Card delay={0.2} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-100 text-secondary rounded-lg">
                        <MdAccessTime size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('dash.hours')}</p>
                        <p className="text-xl font-bold">12.5 hrs</p>
                    </div>
                </Card>
                <Card delay={0.3} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                        <MdStar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('dash.total_xp')}</p>
                        <p className="text-xl font-bold">2,450</p>
                    </div>
                </Card>
                <Card delay={0.4} className="p-4 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <MdBook size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('dash.modules_done')}</p>
                        <p className="text-xl font-bold">3/12</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Course */}
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dash.continue_learning')}</h2>
                        <div onClick={() => navigate('/lesson/1')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                            <Card className="flex flex-col sm:flex-row gap-6">
                                <div className="w-full sm:w-1/3 bg-gray-200 rounded-lg h-32 sm:h-auto flex items-center justify-center text-gray-400">
                                    Course Thumbnail
                                </div>
                                <div className="flex-1 py-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">Mastering Negotiation</h3>
                                        <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Intermediate</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        Learn the strategies to create win-win situations in any discussion.
                                        Currently on Chapter 3: The BATNA Strategy.
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Progress</span>
                                            <span>45%</span>
                                        </div>
                                        <ProgressBar progress={45} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dash.recommended')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {booksData.slice(0, 2).map(book => (
                                <Card key={book.id} className="p-4 flex gap-4" hover={false}>
                                    <img src={book.image} alt={book.title} className="w-16 h-24 object-cover rounded shadow-sm" />
                                    <div>
                                        <h4 className="font-bold text-sm mb-1">{book.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{book.author}</p>
                                        <div className="flex items-center text-yellow-500 text-xs font-bold">
                                            <MdStar className="mr-1" /> {book.rating}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar / Leaderboard or Profile */}
                <div className="space-y-6">
                    <Card className="text-center p-6 bg-gradient-to-br from-indigo-50 to-white">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-400 border-4 border-white shadow-md overflow-hidden">
                            {user?.avatar ? (
                                <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                            ) : (
                                user?.name ? user.name.charAt(0).toUpperCase() : '?'
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{user?.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">@{user?.username}</p>
                        <p className="text-sm text-gray-500 mb-4">{t('dash.learner')}</p>
                        <Button onClick={() => navigate('/profile/edit')} variant="outline" className="w-full text-sm">{t('dash.edit_profile')}</Button>
                    </Card>

                    <Leaderboard />

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">{t('dash.your_badges')}</h3>
                            <span onClick={() => navigate('/badges')} className="text-xs font-medium text-primary cursor-pointer hover:underline">{t('dash.view_all')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {badges.slice(0, 4).map(badge => (
                                <Badge key={badge.id} {...badge} className="text-xs" />
                            ))}
                        </div>
                    </Card>

                    <div className="bg-indigo-900 rounded-xl p-6 text-white text-center">
                        <h3 className="font-bold mb-2">{t('dash.pro_membership')}</h3>
                        <p className="text-sm text-indigo-200 mb-4">{t('dash.unlock_msg')}</p>
                        <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50">{t('dash.upgrade_btn')}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
