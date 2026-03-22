import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import { MdClose } from 'react-icons/md';

const QuizModal = ({ isOpen, onClose, quizTitle, quizType, passScore, questions = [], onSubmit }) => {
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnswers({});
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validQuestions = Array.isArray(questions) ? questions : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const totalQuestions = validQuestions.length;
        let correctAnswers = 0;

        validQuestions.forEach((question) => {
            const selectedIndex = answers[question.id ?? question.order_index];
            const selectedOption = question.options?.[selectedIndex];
            if (selectedOption?.is_correct) {
                correctAnswers += 1;
            }
        });

        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        await onSubmit(score);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <Card className="w-full max-w-3xl bg-white shadow-2xl overflow-hidden relative" noPadding>
                <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-50">
                    <h2 className="text-xl font-bold border-indigo-200">
                        {quizType === 'exam' ? 'Final Exam: ' : 'Module Quiz: '}{quizTitle}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <p className="mb-4 text-sm text-gray-600">
                        Instructions: Answer all questions. You must score at least {passScore}% to pass.
                    </p>

                    {validQuestions.length === 0 ? (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                            This quiz has no questions yet.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {validQuestions.map((question, questionIndex) => {
                                const answerKey = question.id ?? question.order_index;
                                return (
                                    <div key={answerKey} className="space-y-2">
                                        <h3 className="font-semibold text-gray-800">
                                            {questionIndex + 1}. {question.prompt}
                                        </h3>
                                        <div className="space-y-2">
                                            {(question.options || []).map((option, optionIndex) => (
                                                <label key={`${answerKey}-${optionIndex}`} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name={`question-${answerKey}`}
                                                        value={optionIndex}
                                                        checked={answers[answerKey] === optionIndex}
                                                        onChange={() => setAnswers((prev) => ({ ...prev, [answerKey]: optionIndex }))}
                                                        required
                                                    />
                                                    <span className="text-sm">{option.option_text}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex justify-end pt-4 border-t">
                                <Button type="button" variant="outline" onClick={onClose} className="mr-3">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Answers'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default QuizModal;
