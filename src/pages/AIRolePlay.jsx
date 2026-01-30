import React, { useState, useRef, useEffect } from 'react';
import { MdSend, MdMic, MdSmartToy, MdPerson } from 'react-icons/md';
import Button from '../components/Button';
import Input from '../components/Input';
import { useGamification } from '../context/GamificationContext';

const AIRolePlay = () => {
    const { addXp } = useGamification();
    const chatContainerRef = useRef(null);

    // Conversation State
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                setMessages([{
                    id: 1,
                    sender: 'ai',
                    text: "Hello! I'm your AI Assistant Coach. \n\nI'm here to discuss your career goals, help you understand soft skills, or answer questions about BrightSkill. What's on your mind today?"
                }]);
                setIsTyping(false);
            }, 500);
        }
    }, [messages.length]);

    // Auto-scroll logic
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg = { id: messages.length + 1, sender: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Simple Mock AI Logic
        setTimeout(() => {
            const lowerInput = inputText.toLowerCase();
            let responseText = "That's an interesting perspective. Tell me more about how that aligns with your long-term goals.";

            if (lowerInput.includes('communication') || lowerInput.includes('speak') || lowerInput.includes('listen')) {
                responseText = "Communication is the bedrock of career success. Are you looking to improve your public speaking or your active listening skills?";
            } else if (lowerInput.includes('leader') || lowerInput.includes('manage')) {
                responseText = "Leadership isn't just about managing others; it's about influence. We have great modules on 'Empathy in Leadership' if you're interested.";
            } else if (lowerInput.includes('stress') || lowerInput.includes('anural') || lowerInput.includes('confident')) {
                responseText = "Confidence comes from preparation and mindset. Have you tried the 'Stress Management' exercises in your dashboard?";
            } else if (lowerInput.includes('goal') || lowerInput.includes('plan')) {
                responseText = "Setting clear goals is the first step. I can help you break down your 'Communication' goal into smaller, actionable steps.";
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                responseText = "Hi there! Ready to work on your professional growth today?";
            }

            const aiMsg = { id: messages.length + 2, sender: 'ai', text: responseText };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);

            // Random chance for XP
            if (Math.random() > 0.7) addXp(10);

        }, 1200);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">AI Assistant Coach</h1>
                <p className="text-gray-600">Your personal guide for career advice and soft skill development.</p>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Chat Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 scroll-smooth"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`flex max-w-[80%] ${msg.sender === 'user'
                                    ? 'flex-row-reverse space-x-reverse'
                                    : 'flex-row'
                                    } space-x-3`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'
                                    }`}>
                                    {msg.sender === 'user' ? <MdPerson /> : <MdSmartToy />}
                                </div>

                                <div
                                    className={`p-4 rounded-2xl whitespace-pre-wrap ${msg.sender === 'user'
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                    <MdSmartToy />
                                </div>
                                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 transition-colors">
                            <MdMic size={24} />
                        </button>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <Button
                            onClick={handleSend}
                            className="!p-3 rounded-xl flex items-center justify-center"
                            disabled={!inputText.trim() || isTyping}
                        >
                            <MdSend size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default AIRolePlay;
