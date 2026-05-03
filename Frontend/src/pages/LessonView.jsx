import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { MdArrowBack, MdQuiz, MdCheckCircle, MdCancel } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import QuizModal from '../components/QuizModal';
import { getCourseModules, getQuizzes } from '../services/courseService';

const LESSON_CONTEXT_STORAGE_KEY = 'brightskill_lesson_context';

const LessonView = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const courseId = Number(id);
    const { apiRequest, refreshProgress } = useAuth();

    const [course, setCourse] = useState(null);
    const [moduleItem, setModuleItem] = useState(null);
    const [modules, setModules] = useState([]);
    const [quizzes, setQuizzes] = useState([]);

    // Quiz state
    const [quizModalOpen, setQuizModalOpen] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [resultMsg, setResultMsg] = useState(null);
    const [resultDetail, setResultDetail] = useState(null);
    const [resultStatus, setResultStatus] = useState('success');
    const [certificateReady, setCertificateReady] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!course || !moduleItem) return;

        const lessonContext = {
            course_id: courseId,
            course_title: course?.title || '',
            module_id: moduleItem?.id || null,
            module_title: moduleItem?.title || '',
            module_order: moduleItem?.order_index || null,
            module_description: moduleItem?.description || '',
            module_content: (moduleItem?.content || moduleItem?.description || '').slice(0, 2500),
            has_video: Boolean(moduleItem?.youtube_url),
            video_url: moduleItem?.youtube_url || '',
        };

        sessionStorage.setItem(LESSON_CONTEXT_STORAGE_KEY, JSON.stringify(lessonContext));
        window.dispatchEvent(new CustomEvent('brightskill-lesson-context', { detail: lessonContext }));
    }, [course, moduleItem, courseId]);

    useEffect(() => {
        if (!course || !moduleItem) return;

        if (quizModalOpen && activeQuiz) {
            const quizContext = {
                mode: 'quiz',
                current_path: location.pathname,
                course_id: courseId,
                course_title: course?.title || '',
                module_id: moduleItem?.id || null,
                module_title: moduleItem?.title || '',
                selected_skill: course?.skill_name || '',
                quiz_id: activeQuiz.id,
                quiz_title: activeQuiz.title || '',
                quiz_type: activeQuiz.quiz_type || 'module',
                pass_score: activeQuiz.pass_score || 70,
                question_count: Array.isArray(activeQuiz.questions) ? activeQuiz.questions.length : 0,
                hint_mode: true,
                instruction: 'Give hints and explanations only. Do not provide direct answers.',
            };
            sessionStorage.setItem(LESSON_CONTEXT_STORAGE_KEY, JSON.stringify(quizContext));
            window.dispatchEvent(new CustomEvent('brightskill-lesson-context', { detail: quizContext }));
            return;
        }

        const lessonContext = {
            mode: 'lesson',
            current_path: location.pathname,
            course_id: courseId,
            course_title: course?.title || '',
            module_id: moduleItem?.id || null,
            module_title: moduleItem?.title || '',
            module_order: moduleItem?.order_index || null,
            module_description: moduleItem?.description || '',
            module_content: (moduleItem?.content || moduleItem?.description || '').slice(0, 2500),
            has_video: Boolean(moduleItem?.youtube_url),
            video_url: moduleItem?.youtube_url || '',
        };
        sessionStorage.setItem(LESSON_CONTEXT_STORAGE_KEY, JSON.stringify(lessonContext));
        window.dispatchEvent(new CustomEvent('brightskill-lesson-context', { detail: lessonContext }));
    }, [quizModalOpen, activeQuiz, course, moduleItem, courseId, location.pathname]);

    useEffect(() => {
        const loadLesson = async () => {
            try {
                const [courseRes, moduleRes, quizRes] = await Promise.all([
                    apiRequest(`/courses/${courseId}/`),
                    getCourseModules(courseId),
                    getQuizzes({ course: courseId }),
                ]);

                if (courseRes.ok) {
                    setCourse(await courseRes.json());
                }

                if (Array.isArray(moduleRes) && moduleRes.length > 0) {
                    setModules(moduleRes);
                    const preferredModule = location.state?.focusFinalExam
                        ? moduleRes[moduleRes.length - 1]
                        : moduleRes[0];
                    setModuleItem(preferredModule);
                }

                if (Array.isArray(quizRes)) {
                    setQuizzes(quizRes);
                }
            } catch (e) {
                console.error("Failed to load lesson data", e);
            } finally {
                setLoading(false);
            }
        };

        loadLesson();
    }, [courseId, apiRequest, location.state]);

    const handleTakeQuiz = (type) => {
        // Find relevant quiz based on type (module or exam)
        let relevantQuiz = null;
        if (type === 'module' && moduleItem) {
            relevantQuiz = quizzes.find(q => q.quiz_type === 'module' && q.module === moduleItem.id);
        } else if (type === 'exam') {
            relevantQuiz = quizzes.find(q => q.quiz_type === 'exam');
        }

        if (relevantQuiz) {
            setResultMsg(null);
            setResultDetail(null);
            setResultStatus('success');
            setActiveQuiz(relevantQuiz);
            setQuizModalOpen(true);
        } else {
            setActiveQuiz(null);
            if (type === 'exam') {
                setResultStatus('error');
                setResultMsg('No final exam is configured for this course yet.');
                setResultDetail(null);
                setCertificateReady(false);
                return;
            }
            handleQuizSubmit(100);
        }
    };

    const handleQuizSubmit = async (score) => {
        try {
            let attemptData = null;
            if (activeQuiz) {
                const attemptResponse = await apiRequest('/progress/quiz-attempts/submit/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quiz_id: activeQuiz.id,
                        score: score
                    })
                });
                if (!attemptResponse.ok) {
                    const errorData = await attemptResponse.json().catch(() => ({}));
                    throw new Error(errorData?.detail || 'Failed to submit quiz.');
                }
                attemptData = await attemptResponse.json();
            }

            const failedQuiz = activeQuiz && attemptData && attemptData.passed === false;
            if (failedQuiz) {
                setQuizModalOpen(false);
                setResultStatus('error');
                setResultMsg(activeQuiz?.quiz_type === 'exam' ? 'Final exam not passed yet.' : 'Quiz not passed yet.');
                setResultDetail(`You scored ${attemptData.score}%. Required: ${activeQuiz.pass_score}%. You can retake it now.`);
                setCertificateReady(false);
                return;
            }

            // Mark module complete
            if (activeQuiz?.quiz_type !== 'exam' && moduleItem) {
                const completionResponse = await apiRequest('/progress/complete-module/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ course_id: courseId, module_id: moduleItem.id })
                });
                if (!completionResponse.ok) {
                    throw new Error('Failed to update module completion.');
                }
                await refreshProgress();
            }

            setQuizModalOpen(false);
            if (activeQuiz?.quiz_type === 'exam') {
                const passed = Boolean(attemptData?.passed);
                const scoreText = attemptData?.score != null ? `Score: ${attemptData.score}%` : '';
                await refreshProgress();
                let courseProgress = 0;
                let hasCertificate = Boolean(attemptData?.certificate);
                try {
                    const [progressResponse, certificatesResponse] = await Promise.all([
                        apiRequest('/progress/my-progress/'),
                        apiRequest('/certificates/'),
                    ]);

                    if (progressResponse.ok) {
                        const progressRows = await progressResponse.json();
                        const currentCourseProgress = Array.isArray(progressRows)
                            ? progressRows.find((row) => Number(row.course) === Number(courseId))
                            : null;
                        courseProgress = Number(currentCourseProgress?.completion_percentage || 0);
                    }

                    if (certificatesResponse.ok) {
                        const certificates = await certificatesResponse.json();
                        hasCertificate = hasCertificate || (
                            Array.isArray(certificates)
                            && certificates.some((item) => Number(item.course) === Number(courseId))
                        );
                    }
                } catch {
                    // ignore post-submit lookup errors
                }

                setResultStatus(passed ? 'success' : 'error');
                setCertificateReady(passed && hasCertificate);
                if (passed && hasCertificate) {
                    setResultMsg('Final exam passed. Certificate ready.');
                } else if (passed) {
                    setResultMsg('Final exam passed.');
                } else {
                    setResultMsg('Final exam not passed yet.');
                }
                setResultDetail(
                    [
                        scoreText,
                        passed && !hasCertificate && courseProgress >= 100
                            ? 'Your certificate is not available yet. Refresh and try again in a moment.'
                            : null,
                        passed && !hasCertificate && courseProgress < 100
                            ? 'Your final exam is complete. If your certificate is still missing, refresh once or open the certificate page from the dashboard.'
                            : null,
                        !passed ? 'You can retake the final exam from this page.' : null,
                        attemptData?.book_recommendation
                            ? `AI Suggestion: ${attemptData.book_recommendation.title} by ${attemptData.book_recommendation.author}. ${attemptData.book_recommendation.reason}`
                            : null,
                    ].filter(Boolean).join(' ')
                );
                if (passed) {
                    setTimeout(() => {
                        if (hasCertificate) {
                            navigate(`/certificate/${courseId}`);
                            return;
                        }
                        if (courseProgress >= 100) {
                            navigate('/dashboard');
                        }
                    }, 2000);
                }
            } else {
                setResultStatus('success');
                setResultMsg('Module completed.');
                setResultDetail(attemptData?.score != null ? `Quiz score: ${attemptData.score}%` : null);
                setCertificateReady(false);
                const currentIndex = modules.findIndex((m) => m.id === moduleItem?.id);
                const nextModule = currentIndex >= 0 ? modules[currentIndex + 1] : null;
                if (nextModule) {
                    setTimeout(() => {
                        setModuleItem(nextModule);
                        setResultMsg(null);
                        setResultDetail(null);
                    }, 1400);
                }
            }

        } catch (error) {
            console.error(error);
            alert(error?.message || "Failed to record completion. Please try again.");
            setQuizModalOpen(false);
        }
    };

    if (loading) {
        return <div className="max-w-4xl mx-auto py-8 px-4">Loading lesson...</div>;
    }

    if (!moduleItem) {
        return <div className="max-w-4xl mx-auto py-8 px-4">No modules found for this course yet.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center">
                <MdArrowBack className="mr-2" /> Back to Learning Path
            </Button>

            <Card className="p-0 overflow-hidden mb-6">
                <div className="p-8">
                    <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Course Modules</p>
                        <div className="flex flex-wrap gap-2">
                            {modules.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                        setModuleItem(m);
                                        setResultMsg(null);
                                        setResultDetail(null);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs border ${
                                        moduleItem?.id === m.id
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {m.order_index}. {m.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{moduleItem.title}</h1>
                    <p className="text-gray-600 mb-2">Course: {course?.title}</p>
                    <p className="text-gray-600 mb-6">Module order: {moduleItem.order_index}</p>

                    {moduleItem.youtube_url && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Module Video</p>
                            {moduleItem.embed_url ? (
                                <div className="aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
                                    <iframe
                                        title={`${moduleItem.title} video`}
                                        src={moduleItem.embed_url}
                                        className="h-full w-full"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <a
                                    href={moduleItem.youtube_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 underline"
                                >
                                    Open lesson video
                                </a>
                            )}
                        </div>
                    )}

                    <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
                        {moduleItem.content || moduleItem.description || 'No reading content provided for this module.'}
                    </div>
                </div>
            </Card>

            {resultMsg ? (
                <div className={`flex flex-col items-center justify-center p-8 rounded-xl border ${
                    resultStatus === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                }`}>
                    {resultStatus === 'error' ? (
                        <MdCancel className="text-5xl mb-4 text-red-500" />
                    ) : (
                        <MdCheckCircle className="text-5xl mb-4 text-green-500" />
                    )}
                    <h2 className={`text-2xl font-bold ${resultStatus === 'error' ? 'text-red-800' : 'text-green-800'}`}>{resultMsg}</h2>
                    {resultDetail && (
                        <p className={`text-sm mt-3 text-center ${resultStatus === 'error' ? 'text-red-900' : 'text-green-900'}`}>
                            {resultDetail}
                        </p>
                    )}
                    {resultStatus === 'success' && certificateReady && (
                        <div className="mt-5 flex gap-3">
                            <Button onClick={() => navigate(`/certificate/${courseId}`)}>
                                View Certificate
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                Back to Dashboard
                            </Button>
                        </div>
                    )}
                    {resultStatus === 'error' && activeQuiz && (
                        <div className="mt-5 flex gap-3">
                            <Button onClick={() => handleTakeQuiz(activeQuiz.quiz_type === 'exam' ? 'exam' : 'module')}>
                                {activeQuiz.quiz_type === 'exam' ? 'Retake Final Exam' : 'Retake Quiz'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setResultMsg(null);
                                    setResultDetail(null);
                                    setResultStatus('success');
                                }}
                            >
                                Back to Lesson
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl border">
                    <div>
                        <h3 className="font-semibold text-gray-800">Ready to move on?</h3>
                        <p className="text-sm text-gray-600">Complete the quiz to record your progress.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => handleTakeQuiz('module')} className="flex items-center px-6">
                            <MdQuiz className="mr-2" /> Take Module Quiz
                        </Button>
                        {modules[modules.length - 1]?.id === moduleItem.id && (
                            <Button onClick={() => handleTakeQuiz('exam')} variant="outline" className="flex items-center px-6 border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                                <MdQuiz className="mr-2" /> Take Final Exam
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <QuizModal
                isOpen={quizModalOpen}
                onClose={() => setQuizModalOpen(false)}
                quizTitle={activeQuiz?.title || 'Knowledge Check'}
                quizType={activeQuiz?.quiz_type || 'module'}
                passScore={activeQuiz?.pass_score || 70}
                questions={activeQuiz?.questions || []}
                onSubmit={handleQuizSubmit}
            />
        </div>
    );
};

export default LessonView;
