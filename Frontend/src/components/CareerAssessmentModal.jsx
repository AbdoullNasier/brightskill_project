import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdWork, MdClose, MdPsychology, MdSend } from 'react-icons/md';

const CareerAssessmentModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [view, setView] = useState('intro'); // intro, interview, analyzing, complete
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const [qIndex, setQIndex] = useState(0);

    const questions = [
        "Welcome! I'm Fodiye. To build your custom roadmap, I need to know: What is your main career ambition right now?",
        "Interesting. To reach that level, how would you rate your ability to handle high-pressure situations?",
        "Thanks. Lastly, do you prefer working independently or leading a team?",
        "Got it. One moment while I generate your psychometric profile..."
    ];

    useEffect(() => {
        if (view === 'interview' && messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                setMessages([{ sender: 'ai', text: questions[0] }]);
                setIsTyping(false);
            }, 1000);
        }
    }, [view]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleStart = () => {
        setView('interview');
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simple progression logic
        setTimeout(() => {
            const nextQ = qIndex + 1;
            if (nextQ < questions.length - 1) {
                setMessages(prev => [...prev, { sender: 'ai', text: questions[nextQ] }]);
                setQIndex(nextQ);
                setIsTyping(false);
            } else {
                // Final step
                setView('analyzing');
                setTimeout(() => {
                    setView('complete');
                }, 2000);
            }
        }, 1200);
    };

    const handleFinish = () => {
        // Mock saving data
        localStorage.setItem('brightskill_learning_path_generated', 'true');
        navigate('/learning-path');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`
                bg-white rounded-2xl shadow-2xl w-full overflow-hidden transform transition-all 
                ${view === 'intro' ? 'max-w-md' : 'max-w-2xl h-[600px] flex flex-col'}
            `}>
                {/* Header (Simplified for Interview Mode) */}
                {view === 'intro' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
                            <MdClose size={24} />
                        </button>
                        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                            <MdPsychology className="text-white text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Career Diagnostic</h2>
                        <p className="text-white/90 text-sm mt-2">Fodiye AI will analyze your soft skills.</p>
                    </div>
                )}

                {view === 'interview' && (
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shadow-md z-10">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-full"><MdPsychology size={20} /></div>
                            <span className="font-bold">Fodiye Assessment</span>
                        </div>
                        <button onClick={onClose}><MdClose size={24} /></button>
                    </div>
                )}

                {/* Content */}
                <div className={`${view === 'intro' ? 'p-6' : 'flex-1 flex flex-col bg-gray-50 overflow-hidden'}`}>

                    {view === 'intro' && (
                        <div className="text-center">
                            <p className="text-gray-600 mb-6">
                                Unlike standard tests, this is a conversation. I'll ask you a few behavioral questions to understand your goals and gaps.
                            </p>
                            <div className="space-y-3">
                                <button onClick={handleStart} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    <MdWork /> Start Interview
                                </button>
                                <button onClick={onClose} className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'interview' && (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-400 animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t border-gray-200">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Type your answer..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <button onClick={handleSend} disabled={!input.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                                        <MdSend size={24} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {view === 'analyzing' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                            <h3 className="text-xl font-bold text-gray-800">Analyzing Responses...</h3>
                            <p className="text-gray-500 mt-2">Mapping your soft-skill gaps against industry standards...</p>
                        </div>
                    )}

                    {view === 'complete' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                <MdWork size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Analysis Complete</h3>
                            <p className="text-gray-600 mt-2 mb-8 max-w-sm">
                                We've identified <strong>Emotional Intelligence</strong> and <strong>Conflict Resolution</strong> as your key growth areas.
                            </p>
                            <button onClick={handleFinish} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
                                View My Learning Path
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CareerAssessmentModal;
