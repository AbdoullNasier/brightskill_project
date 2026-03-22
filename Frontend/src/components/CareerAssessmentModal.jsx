import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdPsychology, MdWork } from 'react-icons/md';
import { postAI } from '../utils/aiClient';

const SKILLS = [
    'communication',
    'leadership',
    'emotional intelligence',
    'critical thinking',
    'time management',
    'adaptability',
];

const CareerAssessmentModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [view, setView] = useState('intro');
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('');
    const [assessmentId, setAssessmentId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [result, setResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setView('intro');
        setStep(0);
        setError('');
        setSelectedSkill('');
        setAssessmentId(null);
        setQuestions([]);
        setResponses({});
        setResult(null);
        setIsSubmitting(false);
    }, [isOpen]);

    const currentQuestion = questions[step];
    const progress = Math.max(8, Math.min(Math.round(((step + 1) / 8) * 100), 100));

    const startInterview = async () => {
        if (!selectedSkill) {
            setError('Select one skill before continuing.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const data = await postAI('/onboarding/select-skill/', { selected_skill: selectedSkill });
            const firstQuestion = data?.question;
            if (!data?.assessment_id || !firstQuestion?.question_key || !firstQuestion?.question_text) {
                throw new Error('Failed to start skill interview.');
            }
            setAssessmentId(data.assessment_id);
            setQuestions([{ key: firstQuestion.question_key, title: firstQuestion.question_text }]);
            setStep(0);
            setView('interview');
        } catch (err) {
            setError(err.message || 'Failed to start interview.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = async () => {
        if (!assessmentId || !currentQuestion) return;
        const responseText = (responses[currentQuestion.key] || '').trim();
        if (!responseText) {
            setError('Please answer before continuing.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            const answerData = await postAI('/onboarding/interview/', {
                assessment_id: assessmentId,
                question_key: currentQuestion.key,
                question_text: currentQuestion.title,
                response_text: responseText,
            });

            if (answerData?.is_complete) {
                setView('analyzing');
                const roadmapData = await postAI('/onboarding/generate-roadmap/', { assessment_id: assessmentId });
                setResult(roadmapData?.roadmap || null);
                setView('complete');
                return;
            }

            const next = answerData?.next_question;
            if (!next?.question_key || !next?.question_text) {
                throw new Error('Invalid follow-up question from server.');
            }
            setQuestions((prev) => [...prev, { key: next.question_key, title: next.question_text }]);
            setStep((prev) => prev + 1);
        } catch (err) {
            setError(err.message || 'Failed to save answer.');
            if (view === 'analyzing') setView('interview');
        } finally {
            setIsSubmitting(false);
        }
    };

    const finishFlow = () => {
        navigate('/learning-path');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden ${view === 'intro' ? 'max-w-xl' : 'max-w-2xl min-h-[560px] flex flex-col'}`}>
                {(view === 'intro' || view === 'interview') && (
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-full"><MdPsychology size={20} /></div>
                            <span className="font-bold">Skill Roadmap Onboarding</span>
                        </div>
                        <button onClick={onClose}><MdClose size={24} /></button>
                    </div>
                )}

                <div className={`${view === 'intro' ? 'p-6' : 'flex-1 bg-gray-50 p-6'}`}>
                    {view === 'intro' && (
                        <div>
                            <p className="text-gray-600 mb-4">Select one soft skill to begin your personalized interview.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                                {SKILLS.map((skill) => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSkill(skill);
                                            setError('');
                                        }}
                                        className={`rounded-xl border px-4 py-3 text-left capitalize transition ${
                                            selectedSkill === skill
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={startInterview}
                                    disabled={isSubmitting || !selectedSkill}
                                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Starting...' : 'Start Interview'}
                                </button>
                                <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'interview' && currentQuestion && (
                        <div className="h-full flex flex-col">
                            <div className="mb-5">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Skill: <span className="capitalize font-semibold">{selectedSkill}</span></span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{currentQuestion.title}</h3>
                                <textarea
                                    rows="5"
                                    value={responses[currentQuestion.key] || ''}
                                    onChange={(e) => setResponses((prev) => ({ ...prev, [currentQuestion.key]: e.target.value }))}
                                    placeholder="Type your answer..."
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
                            </div>

                            <div className="mt-5 flex items-center justify-end">
                                <button onClick={handleNext} disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                                    {isSubmitting ? 'Saving...' : 'Next'}
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'analyzing' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                            <h3 className="text-xl font-bold text-gray-800">Generating your roadmap...</h3>
                            <p className="text-gray-500 mt-2">Please wait while AI builds your staged mastery plan.</p>
                        </div>
                    )}

                    {view === 'complete' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <MdWork size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Roadmap Ready</h3>
                            <p className="text-gray-600 mt-2 mb-8 max-w-sm">{result?.title || 'Your personalized roadmap is ready.'}</p>
                            <button onClick={finishFlow} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">
                                View Learning Path
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareerAssessmentModal;
