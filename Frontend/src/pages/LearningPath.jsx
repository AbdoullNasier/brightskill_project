import React, { useEffect, useState } from 'react';
import { MdCheckCircle, MdRadioButtonUnchecked, MdLock, MdPlayArrow, MdSchool, MdLightbulb } from 'react-icons/md';
import Button from '../components/Button';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skillsData } from '../data/skillsData';

const LearningPath = () => {
    const navigate = useNavigate();
    const { activeCourseId, userProgress, completedCourses } = useAuth();
    const [pathData, setPathData] = useState(null);

    useEffect(() => {
        // Check for AI Generated Path flag
        const isGenerated = localStorage.getItem('brightskill_learning_path_generated');

        if (isGenerated) {
            // Mock AI Generated Path
            setPathData({
                title: "Your Personalized Career Roadmap",
                subtitle: "Based on Fodiye's Analysis of your Emotional Intelligence & Leadership potential.",
                steps: [
                    {
                        id: 1, // Linking to first skill/lesson
                        title: "Self-Awareness: The Foundation",
                        description: "Understanding your own emotional triggers is the first step.",
                        reason: "Identified Gap: High Stress Response",
                        status: "in-progress",
                        duration: "45m",
                        type: "video"
                    },
                    {
                        id: 2,
                        title: "Empathy in Communication",
                        description: "Learning to read others' non-verbal cues.",
                        reason: "Core Trait for Team Leadership",
                        status: "locked",
                        duration: "1h 20m",
                        type: "exercise"
                    },
                    {
                        id: 3,
                        title: "Conflict Resolution Strategies",
                        description: "The Thomas-Kilmann Conflict Mode Instrument.",
                        reason: "Required for Management Roles",
                        status: "locked",
                        duration: "2h",
                        type: "quiz"
                    },
                    {
                        id: 4,
                        title: "Final Simulation: The Difficult Conversation",
                        description: "AI Roleplay scenario with a difficult stakeholder.",
                        reason: "Practical Application",
                        status: "locked",
                        duration: "30m",
                        type: "simulation"
                    }
                ]
            });
        } else if (activeCourseId) {
            // Fallback to standard single course view
            const course = skillsData.find(s => s.id === activeCourseId);
            if (course) {
                setPathData({
                    title: course.title,
                    subtitle: `Track: ${course.level}`,
                    steps: [
                        {
                            id: course.id,
                            title: `${course.title}: Fundamentals`,
                            description: `Master the basics of ${course.title}.`,
                            reason: "Core Module",
                            status: userProgress[course.id] >= 100 ? "completed" : "in-progress",
                            duration: "2h 30m"
                        },
                        {
                            id: 99,
                            title: "Advanced Concepts",
                            description: "Deep dive into complex scenarios.",
                            reason: "Advanced Module",
                            status: "locked",
                            duration: "1h 45m"
                        }
                    ]
                });
            }
        }
    }, [activeCourseId, completedCourses]);

    if (!pathData) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <div className="inline-block p-6 rounded-full bg-gray-100 mb-6">
                    <MdSchool className="text-6xl text-gray-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">No Active Learning Path</h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    You haven't started a journey yet. Take the AI Diagnostic to get a custom roadmap.
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => navigate('/dashboard')} variant="outline" size="lg" className="px-8">
                        Go to Dashboard
                    </Button>
                    <Button onClick={() => navigate('/skills')} size="lg" className="px-8">
                        Browse Skills
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{pathData.title}</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">{pathData.subtitle}</p>
            </div>

            <div className="relative max-w-3xl mx-auto">
                {/* Vertical Line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>

                <div className="space-y-12">
                    {pathData.steps.map((step, index) => (
                        <div key={index} className="relative pl-24 group">

                            {/* Connector Line (Horizontal) */}
                            <div className="absolute left-8 top-8 w-16 h-0.5 bg-gray-200"></div>

                            {/* Node Marker */}
                            <div className={`
                                absolute left-4 top-4 w-8 h-8 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center
                                ${step.status === 'completed' ? 'bg-emerald-500' :
                                    step.status === 'in-progress' ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-gray-300'}
                            `}>
                                {step.status === 'completed' && <MdCheckCircle className="text-white text-lg" />}
                                {step.status === 'locked' && <MdLock className="text-white text-sm" />}
                            </div>

                            {/* Card */}
                            <Card className={`
                                transition-all duration-300 relative overflow-hidden
                                ${step.status === 'in-progress' ? 'border-2 border-indigo-100 shadow-lg transform scale-[1.02]' : 'hover:shadow-md'}
                                ${step.status === 'locked' ? 'opacity-75 grayscale-[0.5]' : ''}
                            `}>
                                {/* AI Insight Label */}
                                {step.reason && (
                                    <div className="absolute top-0 right-0 bg-indigo-50 px-3 py-1 rounded-bl-xl border-l border-b border-indigo-100 flex items-center gap-1">
                                        <MdLightbulb className="text-yellow-500 text-xs" />
                                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
                                            AI Why: {step.reason}
                                        </span>
                                    </div>
                                )}

                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
                                    <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
                                        <span className="uppercase font-semibold tracking-wider text-xs">{step.type}</span>
                                        <span>•</span>
                                        <span>{step.duration}</span>
                                    </div>
                                    <p className="text-gray-600 mb-6">{step.description}</p>

                                    {step.status !== 'locked' ? (
                                        <Button onClick={() => navigate(`/lesson/${step.id}`)} className="w-full sm:w-auto">
                                            {step.status === 'completed' ? 'Review Module' : 'Start Module'}
                                        </Button>
                                    ) : (
                                        <div className="flex items-center text-gray-400 text-sm italic">
                                            <MdLock className="mr-2" /> Complete previous step to unlock
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearningPath;
