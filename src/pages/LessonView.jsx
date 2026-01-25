import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { MdCheckCircle, MdArrowBack, MdQuiz } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const LessonView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateCourseProgress } = useAuth();

    // Mock Data based on ID
    const lesson = {
        title: 'Understanding Active Listening',
        description: 'Active listening is the art of listening with meaning. It requires full attention and engagement.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
        content: `
            <h3>Key Concepts</h3>
            <p>1. Pay Attention: Give the speaker your undivided attention.</p>
            <p>2. Show That You're Listening: Use body language and gestures.</p>
            <p>3. Provide Feedback: Reflect on what has been said.</p>
            <p>4. Defer Judgment: Don't interrupt.</p>
            <p>5. Respond Appropriately: Be candid, open, and honest.</p>
        `
    };

    const handleTakeQuiz = () => {
        // Navigate to quiz without marking as complete
        navigate(`/quiz/${id}`);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center">
                <MdArrowBack className="mr-2" /> Back to Learning Path
            </Button>

            <Card className="p-0 overflow-hidden mb-6">
                <div className="aspect-w-16 aspect-h-9 bg-black">
                    <iframe
                        width="100%"
                        height="500"
                        src={lesson.videoUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-[500px]"
                    ></iframe>
                </div>
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
                    <p className="text-gray-600 mb-6">{lesson.description}</p>

                    <div
                        className="prose max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                </div>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleTakeQuiz} className="flex items-center text-lg px-8 py-3">
                    <MdQuiz className="mr-2" /> Take Practice Quiz
                </Button>
            </div>


        </div>
    );
};

export default LessonView;
