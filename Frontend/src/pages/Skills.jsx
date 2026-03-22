import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import * as Icons from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';

const iconBySkill = {
    communication: 'MdChat',
    leadership: 'MdGroups',
    'emotional intelligence': 'MdPsychology',
    'critical thinking': 'MdLightbulb',
    'time management': 'MdSchedule',
    adaptability: 'MdTransform',
};

const colorByDifficulty = {
    beginner: 'bg-blue-100 text-blue-600',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-rose-100 text-rose-700',
};

const Skills = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, activeCourseId, userProgress, enrollInCourse, completedCourses, apiRequest } = useAuth();
    const { t } = useLanguage();

    const [courses, setCourses] = useState([]);
    const [issuedCertificateCourseIds, setIssuedCertificateCourseIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const displayName = user?.first_name || user?.username || 'User';

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const response = await apiRequest('/courses/');
                if (!response.ok) {
                    setCourses([]);
                    return;
                }
                const data = await response.json();
                setCourses(Array.isArray(data) ? data : []);
            } finally {
                setLoading(false);
            }
        };

        loadCourses();
    }, [apiRequest]);

    useEffect(() => {
        if (!isAuthenticated) {
            setIssuedCertificateCourseIds(new Set());
            return;
        }

        const loadCertificates = async () => {
            try {
                const response = await apiRequest('/certificates/');
                if (!response.ok) {
                    setIssuedCertificateCourseIds(new Set());
                    return;
                }

                const data = await response.json();
                const courseIds = new Set(
                    (Array.isArray(data) ? data : [])
                        .map((certificate) => Number(certificate.course))
                        .filter(Boolean)
                );
                setIssuedCertificateCourseIds(courseIds);
            } catch {
                setIssuedCertificateCourseIds(new Set());
            }
        };

        loadCertificates();
    }, [isAuthenticated, apiRequest]);

    const handleStartLearning = async (course, isCompleted, hasCertificate, isActive, isLocked) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (isLocked) {
            alert('Please complete your current active course first.');
            return;
        }

        if (isCompleted && hasCertificate) {
            navigate(`/certificate/${course.id}`);
            return;
        }

        if (isCompleted && !hasCertificate) {
            navigate(`/lesson/${course.id}`, {
                state: {
                    focusFinalExam: true,
                    courseName: course.title,
                    studentName: displayName,
                },
            });
            return;
        }

        if (!isActive) {
            await enrollInCourse(course.id);
        }

        navigate(`/lesson/${course.id}`);
    };

    if (loading) {
        return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">Loading courses...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('skills.explore')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => {
                    const iconKey = iconBySkill[(course.skill_name || '').toLowerCase()] || 'MdWork';
                    const IconComponent = Icons[iconKey] || Icons.MdWork;
                    const currentProgress = userProgress[course.id] || 0;
                    const isCompleted = completedCourses.includes(course.id) || currentProgress >= 100;
                    const hasCertificate = issuedCertificateCourseIds.has(course.id);
                    const isActive = activeCourseId === course.id;
                    const isLocked = isAuthenticated && activeCourseId && !isActive && !isCompleted;

                    return (
                        <Card key={course.id} delay={index * 0.05} className={`flex flex-col h-full hover:shadow-lg transition-shadow duration-300 ${isLocked ? 'opacity-75' : ''}`}>
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-full ${colorByDifficulty[course.difficulty] || 'bg-indigo-100 text-indigo-600'} mr-4`}>
                                    <IconComponent size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{course.title}</h3>
                                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">
                                        {course.difficulty}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-6 flex-grow">{course.description}</p>

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
                                        onClick={() => handleStartLearning(course, isCompleted, hasCertificate, isActive, isLocked)}
                                        className="w-full"
                                        variant={isCompleted ? 'primary' : isActive ? 'primary' : 'outline'}
                                        disabled={isLocked}
                                    >
                                        {!isAuthenticated
                                            ? t('skills.start_learning')
                                            : isCompleted && hasCertificate
                                                ? 'View Certificate'
                                                : isCompleted
                                                    ? 'Take Final Exam'
                                                : isActive
                                                    ? 'Continue Learning'
                                                    : isLocked
                                                        ? 'Complete Active Course First'
                                                        : 'Start Learning'}
                                    </Button>
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
