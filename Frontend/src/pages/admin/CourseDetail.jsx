import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import {
    createModule,
    deleteCourse,
    deleteModule,
    getCourse,
    getCourseModules,
    updateCourse,
    updateModule,
    getQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
} from '../../services/courseService';

const emptyModule = {
    title: '',
    description: '',
    content: '',
    youtube_url: '',
    order_index: 1,
    is_preview: false,
};

const createEmptyQuestion = (orderIndex = 1) => ({
    prompt: '',
    order_index: orderIndex,
    options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
    ],
});

const emptyQuiz = {
    title: '',
    pass_score: 70,
    module: '',
    quiz_type: 'module',
    questions: [createEmptyQuestion(1)],
};

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({ title: '', description: '', is_published: false });
    const [modules, setModules] = useState([]);
    const [moduleForm, setModuleForm] = useState(emptyModule);
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingCourse, setSavingCourse] = useState(false);
    const [savingModule, setSavingModule] = useState(false);

    const [quizzes, setQuizzes] = useState([]);
    const [quizForm, setQuizForm] = useState(emptyQuiz);
    const [editingQuizId, setEditingQuizId] = useState(null);
    const [savingQuiz, setSavingQuiz] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const sortedModules = useMemo(() => [...modules].sort((a, b) => a.order_index - b.order_index), [modules]);

    const loadCourseData = async () => {
        setLoading(true);
        setError('');
        try {
            const [courseData, moduleData, quizData] = await Promise.all([
                getCourse(id),
                getCourseModules(id),
                getQuizzes({ course: id }),
            ]);
            setCourse(courseData);
            setCourseForm({
                title: courseData.title || '',
                description: courseData.description || '',
                is_published: Boolean(courseData.is_published),
            });
            setModules(Array.isArray(moduleData) ? moduleData : []);
            setQuizzes(Array.isArray(quizData) ? quizData : []);
        } catch (err) {
            setError(err.message || 'Failed to load course details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourseData();
    }, [id]);

    const saveCourse = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!courseForm.title.trim() || !courseForm.description.trim()) {
            setError('Course title and description are required.');
            return;
        }
        setSavingCourse(true);
        try {
            const updated = await updateCourse(id, {
                ...course,
                title: courseForm.title.trim(),
                description: courseForm.description.trim(),
                is_published: courseForm.is_published,
            });
            setCourse(updated);
            setSuccess('Course updated successfully.');
        } catch (err) {
            setError(err.message || 'Failed to update course.');
        } finally {
            setSavingCourse(false);
        }
    };

    const submitModule = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!moduleForm.title.trim()) {
            setError('Module title is required.');
            return;
        }
        if (!moduleForm.content.trim() && !moduleForm.youtube_url.trim()) {
            setError('Provide module content text, video URL, or both.');
            return;
        }

        const payload = {
            title: moduleForm.title.trim(),
            description: moduleForm.description.trim(),
            content: moduleForm.content.trim(),
            youtube_url: moduleForm.youtube_url.trim(),
            order_index: Number(moduleForm.order_index),
            is_preview: Boolean(moduleForm.is_preview),
        };

        setSavingModule(true);
        try {
            if (editingModuleId) {
                await updateModule(editingModuleId, payload);
                setSuccess('Module updated successfully.');
            } else {
                await createModule(id, payload);
                setSuccess('Module added successfully.');
            }
            setModuleForm(emptyModule);
            setEditingModuleId(null);
            const latestModules = await getCourseModules(id);
            setModules(Array.isArray(latestModules) ? latestModules : []);
        } catch (err) {
            setError(err.message || 'Failed to save module.');
        } finally {
            setSavingModule(false);
        }
    };

    const onEditModule = (module) => {
        setEditingModuleId(module.id);
        setModuleForm({
            title: module.title || '',
            description: module.description || '',
            content: module.content || '',
            youtube_url: module.youtube_url || '',
            order_index: module.order_index || 1,
            is_preview: Boolean(module.is_preview),
        });
    };

    const validateQuizForm = () => {
        if (!quizForm.title.trim()) {
            return 'Quiz title is required.';
        }
        if (quizForm.quiz_type === 'module' && !quizForm.module) {
            return 'Select a module for a module quiz.';
        }
        if (!quizForm.questions.length) {
            return 'Add at least one question.';
        }

        for (let index = 0; index < quizForm.questions.length; index += 1) {
            const question = quizForm.questions[index];
            if (!question.prompt.trim()) {
                return `Question ${index + 1} prompt is required.`;
            }
            const filledOptions = question.options.filter((option) => option.option_text.trim());
            if (filledOptions.length < 2) {
                return `Question ${index + 1} must have at least two options.`;
            }
            if (!filledOptions.some((option) => option.is_correct)) {
                return `Question ${index + 1} must have one correct option.`;
            }
        }

        return null;
    };

    const submitQuiz = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateQuizForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = {
            course: Number(id),
            title: quizForm.title.trim(),
            pass_score: Number(quizForm.pass_score),
            quiz_type: quizForm.quiz_type,
            module: quizForm.quiz_type === 'module' ? Number(quizForm.module) : null,
            questions: quizForm.questions.map((question, questionIndex) => ({
                prompt: question.prompt.trim(),
                order_index: questionIndex + 1,
                options: question.options
                    .filter((option) => option.option_text.trim())
                    .map((option) => ({
                        option_text: option.option_text.trim(),
                        is_correct: Boolean(option.is_correct),
                    })),
            })),
        };

        setSavingQuiz(true);
        try {
            if (editingQuizId) {
                await updateQuiz(editingQuizId, payload);
                setSuccess('Quiz updated successfully.');
            } else {
                await createQuiz(payload);
                setSuccess('Quiz created successfully.');
            }
            setQuizForm(emptyQuiz);
            setEditingQuizId(null);
            const latestQuizzes = await getQuizzes({ course: id });
            setQuizzes(Array.isArray(latestQuizzes) ? latestQuizzes : []);
        } catch (err) {
            setError(err.message || 'Failed to save quiz.');
        } finally {
            setSavingQuiz(false);
        }
    };

    const onEditQuiz = (quiz) => {
        setEditingQuizId(quiz.id);
        setQuizForm({
            title: quiz.title || '',
            pass_score: quiz.pass_score || 70,
            module: quiz.module || '',
            quiz_type: quiz.quiz_type || 'module',
            questions: Array.isArray(quiz.questions) && quiz.questions.length > 0
                ? quiz.questions.map((question, questionIndex) => ({
                    prompt: question.prompt || '',
                    order_index: question.order_index || questionIndex + 1,
                    options: Array.isArray(question.options) && question.options.length > 0
                        ? question.options.map((option) => ({
                            option_text: option.option_text || '',
                            is_correct: Boolean(option.is_correct),
                        }))
                        : createEmptyQuestion(questionIndex + 1).options,
                }))
                : [createEmptyQuestion(1)],
        });
    };

    const addQuestion = () => {
        setQuizForm((prev) => ({
            ...prev,
            questions: [...prev.questions, createEmptyQuestion(prev.questions.length + 1)],
        }));
    };

    const removeQuestion = (questionIndex) => {
        setQuizForm((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, index) => index !== questionIndex).map((question, index) => ({
                ...question,
                order_index: index + 1,
            })),
        }));
    };

    const updateQuestionPrompt = (questionIndex, value) => {
        setQuizForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question, index) => (
                index === questionIndex ? { ...question, prompt: value } : question
            )),
        }));
    };

    const updateOptionText = (questionIndex, optionIndex, value) => {
        setQuizForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question, index) => {
                if (index !== questionIndex) return question;
                return {
                    ...question,
                    options: question.options.map((option, idx) => (
                        idx === optionIndex ? { ...option, option_text: value } : option
                    )),
                };
            }),
        }));
    };

    const setCorrectOption = (questionIndex, optionIndex) => {
        setQuizForm((prev) => ({
            ...prev,
            questions: prev.questions.map((question, index) => {
                if (index !== questionIndex) return question;
                return {
                    ...question,
                    options: question.options.map((option, idx) => ({
                        ...option,
                        is_correct: idx === optionIndex,
                    })),
                };
            }),
        }));
    };

    const onDeleteQuiz = async (quizId) => {
        if (!window.confirm('Delete this quiz?')) return;
        setError('');
        setSuccess('');
        try {
            await deleteQuiz(quizId);
            setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
            setSuccess('Quiz deleted successfully.');
        } catch (err) {
            setError(err.message || 'Failed to delete quiz.');
        }
    };

    const onDeleteModule = async (moduleId) => {
        if (!window.confirm('Delete this module?')) return;
        setError('');
        setSuccess('');
        try {
            await deleteModule(moduleId);
            setModules((prev) => prev.filter((m) => m.id !== moduleId));
            setSuccess('Module deleted successfully.');
        } catch (err) {
            setError(err.message || 'Failed to delete module.');
        }
    };

    const onDeleteCourse = async () => {
        if (!window.confirm('Delete this course? This performs a soft delete.')) return;
        setError('');
        setSuccess('');
        try {
            await deleteCourse(id);
            navigate('/admin/content');
        } catch (err) {
            setError(err.message || 'Failed to delete course.');
        }
    };

    if (loading) {
        return <p className="text-sm text-gray-500">Loading course...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{course?.title || 'Course Detail'}</h1>
                    <p className="text-sm text-gray-500">Status: {courseForm.is_published ? 'Published' : 'Draft'}</p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => navigate('/admin/content')}>
                        Back
                    </Button>
                    <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={onDeleteCourse}>
                        Delete Course
                    </Button>
                </div>
            </div>

            {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">{success}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Course Information</h2>
                <form onSubmit={saveCourse} className="space-y-3">
                    <input value={courseForm.title} onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Course title" />
                    <textarea value={courseForm.description} onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" rows={4} placeholder="Course description" />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={courseForm.is_published} onChange={(e) => setCourseForm((prev) => ({ ...prev, is_published: e.target.checked }))} />
                        Published
                    </label>
                    <Button type="submit" disabled={savingCourse}>{savingCourse ? 'Saving...' : 'Save Course'}</Button>
                </form>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{editingModuleId ? 'Edit Module' : 'Add Module'}</h2>
                <form onSubmit={submitModule} className="space-y-3">
                    <input value={moduleForm.title} onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Module title" />
                    <textarea value={moduleForm.description} onChange={(e) => setModuleForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" rows={3} placeholder="Module description (optional)" />
                    <textarea value={moduleForm.content} onChange={(e) => setModuleForm((prev) => ({ ...prev, content: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" rows={5} placeholder="Reading content for this module (optional if video is provided)" />
                    <input type="url" value={moduleForm.youtube_url} onChange={(e) => setModuleForm((prev) => ({ ...prev, youtube_url: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Video URL (optional)" />
                    <input type="number" min="1" value={moduleForm.order_index} onChange={(e) => setModuleForm((prev) => ({ ...prev, order_index: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Order index" />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={moduleForm.is_preview} onChange={(e) => setModuleForm((prev) => ({ ...prev, is_preview: e.target.checked }))} />
                        Preview module
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={savingModule}>{savingModule ? 'Saving...' : editingModuleId ? 'Update Module' : 'Add Module'}</Button>
                        {editingModuleId && <Button type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => { setEditingModuleId(null); setModuleForm(emptyModule); }}>Cancel Edit</Button>}
                    </div>
                </form>
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{editingQuizId ? 'Edit Quiz/Exam' : 'Add Quiz/Exam'}</h2>
                <form onSubmit={submitQuiz} className="space-y-4">
                    <input value={quizForm.title} onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Quiz/Exam Title" />
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" value="module" checked={quizForm.quiz_type === 'module'} onChange={(e) => setQuizForm((prev) => ({ ...prev, quiz_type: e.target.value, module: prev.module }))} />Module Quiz</label>
                        <label className="flex items-center gap-2"><input type="radio" value="exam" checked={quizForm.quiz_type === 'exam'} onChange={(e) => setQuizForm((prev) => ({ ...prev, quiz_type: e.target.value, module: '' }))} />Course Final Exam</label>
                    </div>
                    {quizForm.quiz_type === 'module' && (
                        <select value={quizForm.module} onChange={(e) => setQuizForm((prev) => ({ ...prev, module: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" required>
                            <option value="">Select Module</option>
                            {sortedModules.map((m) => <option key={m.id} value={m.id}>{m.order_index}. {m.title}</option>)}
                        </select>
                    )}
                    <input type="number" min="0" max="100" value={quizForm.pass_score} onChange={(e) => setQuizForm((prev) => ({ ...prev, pass_score: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Passing Score (%)" />

                    <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800">Questions and Options</h3>
                            <Button type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={addQuestion}>Add Question</Button>
                        </div>
                        {quizForm.questions.map((question, questionIndex) => (
                            <div key={`question-${questionIndex}`} className="rounded-lg border bg-white p-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="font-semibold text-gray-800">Question {questionIndex + 1}</h4>
                                    {quizForm.questions.length > 1 && (
                                        <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeQuestion(questionIndex)}>Remove</button>
                                    )}
                                </div>
                                <textarea value={question.prompt} onChange={(e) => updateQuestionPrompt(questionIndex, e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5" rows={2} placeholder="Write the question" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {question.options.map((option, optionIndex) => (
                                        <div key={`option-${questionIndex}-${optionIndex}`} className="rounded-lg border border-gray-200 p-3 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Option {optionIndex + 1}</span>
                                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                                    <input type="radio" name={`correct-${questionIndex}`} checked={option.is_correct} onChange={() => setCorrectOption(questionIndex, optionIndex)} />
                                                    Correct
                                                </label>
                                            </div>
                                            <input value={option.option_text} onChange={(e) => updateOptionText(questionIndex, optionIndex, e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder={`Option ${optionIndex + 1} text`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={savingQuiz}>{savingQuiz ? 'Saving...' : editingQuizId ? 'Update Quiz' : 'Add Quiz'}</Button>
                        {editingQuizId && <Button type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => { setEditingQuizId(null); setQuizForm(emptyQuiz); }}>Cancel Edit</Button>}
                    </div>
                </form>
            </Card>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800">Modules</h2>
                {sortedModules.length === 0 && <Card className="p-4 text-sm text-gray-500">No modules yet.</Card>}
                {sortedModules.map((module) => (
                    <Card key={module.id} className="p-4 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{module.order_index}. {module.title}</h3>
                                <p className="text-xs text-gray-500">{module.is_preview ? 'Preview enabled' : 'Preview disabled'}</p>
                                {module.description && <p className="text-sm text-gray-600 mt-1">{module.description}</p>}
                                {module.content && <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{module.content}</div>}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => onEditModule(module)}>Edit</Button>
                                <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => onDeleteModule(module.id)}>Delete</Button>
                            </div>
                        </div>
                        {module.youtube_url && (
                            <div className="aspect-video w-full overflow-hidden rounded-lg border">
                                {module.embed_url ? <iframe className="w-full h-full" src={module.embed_url} title={module.title} allowFullScreen /> : <a href={module.youtube_url} target="_blank" rel="noreferrer" className="block p-4 text-indigo-600 underline">Open video link</a>}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Quizzes for this module</h4>
                            {quizzes.filter((q) => q.module === module.id).map((quiz) => (
                                <div key={quiz.id} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-2">
                                    <span className="text-sm">{quiz.title} ({quiz.questions?.length || 0} questions, Pass: {quiz.pass_score}%)</span>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => onEditQuiz(quiz)} className="text-indigo-600 text-xs hover:underline">Edit</button>
                                        <button type="button" onClick={() => onDeleteQuiz(quiz.id)} className="text-red-600 text-xs hover:underline">Delete</button>
                                    </div>
                                </div>
                            ))}
                            {quizzes.filter((q) => q.module === module.id).length === 0 && <p className="text-xs text-gray-500">No quizzes mapped to this module.</p>}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800">Final Exams</h2>
                {quizzes.filter((q) => q.quiz_type === 'exam').length === 0 && <Card className="p-4 text-sm text-gray-500">No final exams created yet.</Card>}
                {quizzes.filter((q) => q.quiz_type === 'exam').map((quiz) => (
                    <Card key={quiz.id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                            <p className="text-sm text-gray-600">Passing score: {quiz.pass_score}%</p>
                            <p className="text-xs text-gray-500">Questions: {quiz.questions?.length || 0}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => onEditQuiz(quiz)}>Edit</Button>
                            <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => onDeleteQuiz(quiz.id)}>Delete</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CourseDetail;
