import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';

const QuizAssessment = () => {
    const navigate = useNavigate();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);

    const questions = [
        {
            questionText: 'What is the most important part of active listening?',
            answerOptions: [
                { answerText: 'Giving advice immediately', isCorrect: false },
                { answerText: 'Listening to understand, not to reply', isCorrect: true },
                { answerText: 'Nodding your head constantly', isCorrect: false },
                { answerText: 'Taking detailed notes', isCorrect: false },
            ],
        },
        {
            questionText: 'Which of the following is an example of non-verbal communication?',
            answerOptions: [
                { answerText: 'Email', isCorrect: false },
                { answerText: 'Phone call', isCorrect: false },
                { answerText: 'Eye contact', isCorrect: true },
                { answerText: 'Speech', isCorrect: false },
            ],
        },
        {
            questionText: 'How should you handle constructive criticism?',
            answerOptions: [
                { answerText: 'Get defensive', isCorrect: false },
                { answerText: 'Ignore it', isCorrect: false },
                { answerText: 'Listen and ask for specific examples', isCorrect: true },
                { answerText: 'Blame others', isCorrect: false },
            ],
        },
    ];

    const handleAnswerOptionClick = (isCorrect) => {
        if (isCorrect) {
            setScore(score + 1);
        }

        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < questions.length) {
            setCurrentQuestion(nextQuestion);
        } else {
            setShowScore(true);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <Card className="p-8">
                {showScore ? (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">Quiz Completed!</h2>
                        <div className="text-5xl font-extrabold text-primary mb-6">
                            {score} / {questions.length}
                        </div>
                        <p className="text-gray-600 mb-8">
                            {score === questions.length ? 'Perfect Score! You are a master.' : 'Good job! Keep learning.'}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Button onClick={() => navigate('/learning-path')}>Return to Learning Path</Button>
                            <Button variant="outline" onClick={() => {
                                setCurrentQuestion(0);
                                setScore(0);
                                setShowScore(false);
                            }}>Retake Quiz</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-bold">Question {currentQuestion + 1}/{questions.length}</h2>
                                <span className="text-sm text-gray-500 font-medium">Difficulty: Easy</span>
                            </div>
                            <ProgressBar progress={((currentQuestion) / questions.length) * 100} />
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-gray-800">{questions[currentQuestion].questionText}</h3>
                        </div>

                        <div className="space-y-3">
                            {questions[currentQuestion].answerOptions.map((answerOption, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerOptionClick(answerOption.isCorrect)}
                                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-indigo-50 transition-all duration-200 font-medium text-gray-700"
                                >
                                    {answerOption.answerText}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default QuizAssessment;
