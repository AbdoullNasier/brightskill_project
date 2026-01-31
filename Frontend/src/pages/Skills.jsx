import React from 'react';
import { skillsData } from '../data/skillsData';
import Card from '../components/Card';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import * as Icons from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';

const Skills = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, activeCourseId, userProgress, enrollInCourse, completedCourses } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    const handleStartLearning = (skill, isCompleted, isActive, isLocked) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (isLocked) {
            // Should be disabled but just in case
            alert("Please complete your current active course first.");
            return;
        }

        if (isCompleted) {
            navigate('/certificate', {
                state: {
                    courseName: skill.title,
                    studentName: user?.name || "User",
                    date: new Date().toLocaleDateString()
                }
            });
            return;
        }

        if (!isActive) {
            // New enrollment
            try {
                enrollInCourse(skill.id);
            } catch (error) {
                alert(error.message);
                return;
            }
        }

        // Navigate to lesson for both new enrollment and continuing active course
        navigate(`/lesson/${skill.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('skills.explore')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skillsData.map((skill, index) => {
                    const IconComponent = Icons[skill.icon] || Icons.MdWork;

                    // Determine status based on Context
                    const currentProgress = userProgress[skill.id] || 0;
                    const isCompleted = completedCourses.includes(skill.id) || currentProgress >= 100;
                    const isActive = activeCourseId === skill.id;
                    const isLocked = isAuthenticated && activeCourseId && !isActive && !isCompleted;

                    return (
                        <Card key={skill.id} delay={index * 0.05} className={`flex flex-col h-full hover:shadow-lg transition-shadow duration-300 ${isLocked ? 'opacity-75' : ''}`}>
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-full ${skill.color} mr-4`}>
                                    <IconComponent size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{skill.title}</h3>
                                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                                        {skill.level}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-6 flex-grow">
                                {skill.description}
                            </p>

                            <div className="mt-auto">
                                {isAuthenticated && (
                                    <>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-500">{t('skills.proficiency')}</span>
                                            <span className="font-bold text-primary">{currentProgress}%</span>
                                        </div>
                                        <ProgressBar progress={currentProgress} />
                                    </>
                                )}

                                <div className="mt-4">
                                    <Button
                                        onClick={() => handleStartLearning(skill, isCompleted, isActive, isLocked)}
                                        className="w-full"
                                        variant={isCompleted ? "primary" : (isActive ? "primary" : "outline")}
                                        disabled={isLocked}
                                    >
                                        {!isAuthenticated ? t('skills.start_learning') :
                                            (isCompleted ? "Completed, Get Certificate" :
                                                (isActive ? "Continue Learning" :
                                                    (isLocked ? "Complete Active Course First" : "Start Learning")
                                                )
                                            )
                                        }
                                    </Button>
                                    {isCompleted && (
                                        <p className="text-xs text-center text-green-600 mt-2 font-semibold">
                                            Course Completed!
                                        </p>
                                    )}
                                    {!isAuthenticated && (
                                        <p className="text-xs text-center text-gray-500 mt-2">
                                            {t('skills.login_redirect')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Skills;
