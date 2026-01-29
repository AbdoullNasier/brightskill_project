import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AIAssistant = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const location = useLocation();
    const messagesEndRef = useRef(null);
    const excludedRoutes = ['/login', '/register', '/ai-roleplay', '/profile/edit'];

    // Initial greeting based on context
    useEffect(() => {
        if (isAuthenticated && isOpen && messages.length === 0) {
            getContextualGreeting();
        }
    }, [isAuthenticated, isOpen, location.pathname]);
    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);



    const getContextualGreeting = () => {
        setIsTyping(true);
        setTimeout(() => {
            let greeting = `Hello ${user?.name || 'there'}! I'm Fodiye, your AI Career Mentor. How can I help you accelerate your growth today?`;

            // Context-aware logic
            const path = location.pathname;
            if (path.includes('/dashboard')) {
                greeting = `Welcome back, ${user?.name}! efficient progress today. Would you like to review your latest skill analysis?`;
            } else if (path.includes('/learning-path')) {
                greeting = "This roadmap is designed specifically for your goal. Notice the focus on 'Communication' first? That's your quick-win area.";
            } else if (path.includes('/skills')) {
                greeting = "Looking for something specific? I can recommend a module that fits your current gap analysis.";
            } else if (path.includes('/ai-roleplay')) {
                greeting = "Ready for your assessment? Just be honest and relax—there are no wrong answers here.";
            }

            setMessages([{ sender: 'ai', text: greeting, time: new Date() }]);
            setIsTyping(false);
        }, 1000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input, time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI processing
        setTimeout(() => {
            let aiResponse = "That's an interesting point. Let's explore that further in your learning path.";

            // Simple keyword matching for demo
            const lowerInput = userMsg.text.toLowerCase();
            if (lowerInput.includes('recommend') || lowerInput.includes('suggest')) {
                aiResponse = "Based on your profile, I strongly recommend starting with the 'Active Listening' module. It's crucial for your leadership goal.";
            } else if (lowerInput.includes('stress') || lowerInput.includes('anxiety')) {
                aiResponse = "Managing stress is a key soft skill. I have a great 5-minute exercise on 'Cognitive Reframing' if you'd like to try it?";
            } else if (lowerInput.includes('interview')) {
                aiResponse = "Interviews can be daunting. We can practice common questions right here if you want.";
            } else if (lowerInput.includes('thank')) {
                aiResponse = "You're very welcome! I'm here whenever you need guidance.";
            }

            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse, time: new Date() }]);
            setIsTyping(false);
        }, 1500);
    };

    if (!isAuthenticated || excludedRoutes.includes(location.pathname)) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div
                className={`
                    pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 
                    w-80 md:w-96 transition-all duration-300 ease-in-out transform origin-bottom-right
                    ${isOpen ? 'scale-100 opacity-100 mb-4 translation-y-0' : 'scale-75 opacity-0 mb-0 translate-y-10 h-0 overflow-hidden'}
                `}
                style={{ maxHeight: '600px', display: isOpen ? 'flex' : 'none' }}
            >
                <div className="flex flex-col h-full w-full h-[500px]">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 rounded-t-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                {/* Simple Robot Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Fodiye</h3>
                                <p className="text-indigo-200 text-xs">AI Career Coach</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                                    ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'}
                                `}>
                                    <p>{msg.text}</p>
                                    <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl rounded-bl-none border border-gray-100 px-4 py-3 shadow-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Fodiye..."
                                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* FAB (Toggle Button) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300
                    flex items-center justify-center
                    ${isOpen ? 'w-12 h-12 rounded-full bg-gray-200 text-gray-600' : 'w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}
                `}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        {/* Notification Dot */}
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIAssistant;
