import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCheckCircle, MdSchool } from 'react-icons/md';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const LESSON_CONTEXT_STORAGE_KEY = 'brightskill_lesson_context';

const LearningPath = () => {
    const navigate = useNavigate();
    const { apiRequest, userProgress } = useAuth();
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRoadmap = async () => {
            try {
                const roadmapRes = await apiRequest('/roadmap/');
                if (roadmapRes.ok) {
                    const roadmapData = await roadmapRes.json();
                    setRoadmap(roadmapData);
                    return;
                }

                // Backward-compatible fallback for older learning path payload.
                const fallbackRes = await apiRequest('/interview/path/');
                if (fallbackRes.ok) {
                    const fallback = await fallbackRes.json();
                    setRoadmap(fallback);
                }
            } finally {
                setLoading(false);
            }
        };

        loadRoadmap();
    }, [apiRequest]);

    const stages = useMemo(() => {
        if (!roadmap) return [];
        if (Array.isArray(roadmap.stages)) {
            return [...roadmap.stages].sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0));
        }
        return [];
    }, [roadmap]);

    const selectedSkill = roadmap?.selected_skill || (Array.isArray(roadmap?.focus_areas) ? roadmap.focus_areas[0] : '');

    if (loading) {
        return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">Loading learning path...</div>;
    }

    if (!roadmap || stages.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <div className="inline-block p-6 rounded-full bg-gray-100 mb-6">
                    <MdSchool className="text-6xl text-gray-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">No Learning Path Yet</h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Complete onboarding to generate your personalized roadmap.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="mb-8 sm:mb-10 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{roadmap.title || 'Learning Path'}</h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-7">{roadmap.summary || 'Roadmap generated from your onboarding interview.'}</p>
                {selectedSkill && (
                    <p className="mt-3 inline-block rounded-full bg-indigo-50 text-indigo-700 px-4 py-1 text-sm font-semibold capitalize">
                        Selected Skill: {selectedSkill}
                    </p>
                )}
            </div>

            <div className="max-w-5xl mx-auto space-y-5">
                {stages.map((stage, index) => {
                    const stageStatus = stage.is_completed ? 'completed' : 'in-progress';
                    const courseId = stage.course;
                    const courseProgress = courseId ? Number(userProgress?.[courseId] || 0) : 0;

                    return (
                        <Card key={stage.id || index} className="border border-gray-200">
                            <div className="p-5 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Stage {stage.order_index || index + 1}</p>
                                        <h2 className="text-xl font-bold text-gray-900">{stage.stage_title}</h2>
                                    </div>
                                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${stageStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                        {stageStatus === 'completed' ? <><MdCheckCircle className="mr-1" /> Completed</> : 'In Progress'}
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm text-gray-700">
                                    <p><span className="font-semibold text-gray-900">Objective:</span> {stage.stage_objective}</p>
                                    <p><span className="font-semibold text-gray-900">What To Do:</span> {stage.learner_actions}</p>
                                    <p><span className="font-semibold text-gray-900">Practical Exercise:</span> {stage.practical_exercise}</p>
                                    <p><span className="font-semibold text-gray-900">Habit / Action:</span> {stage.habit_action}</p>
                                    <p><span className="font-semibold text-gray-900">AI Support:</span> {stage.ai_support_note}</p>
                                    {courseId ? (
                                        <p>
                                            <span className="font-semibold text-gray-900">Course:</span> {stage.course_title || `Course #${courseId}`}
                                            <span className="ml-2 text-xs text-gray-500">({courseProgress.toFixed(0)}% complete)</span>
                                        </p>
                                    ) : (
                                        <p><span className="font-semibold text-gray-900">Course:</span> Recommended module will be suggested by FAB.</p>
                                    )}
                                </div>

                                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => {
                                            if (courseId) {
                                                navigate(`/lesson/${courseId}`);
                                            } else {
                                                navigate('/skills');
                                            }
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        {courseId ? 'Open Course/Module' : 'Find Matching Course'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const context = {
                                                from: 'learning-path',
                                                selected_skill: selectedSkill,
                                                stage_id: stage.id,
                                                stage_title: stage.stage_title,
                                                stage_objective: stage.stage_objective,
                                                stage_tasks: stage.learner_actions,
                                            };
                                            sessionStorage.setItem(LESSON_CONTEXT_STORAGE_KEY, JSON.stringify(context));
                                            navigate('/ai-roleplay');
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        Practice with AI
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

export default LearningPath;
