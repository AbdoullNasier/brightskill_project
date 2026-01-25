import React, { useState, useRef, useEffect } from 'react';
import { MdSend, MdMic, MdSmartToy, MdPerson } from 'react-icons/md';
import Button from '../components/Button';
import Input from '../components/Input';
import { useGamification } from '../context/GamificationContext';

const AIRolePlay = () => {
    const { addXp } = useGamification();
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: "Hello! I'm your AI Interview Coach. I'm here to help you practice for your behavioral interview. Let's start with a classic: Tell me about a time you had a conflict with a coworker and how you resolved it." }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg = { id: messages.length + 1, sender: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Mock AI response
        setTimeout(() => {
            const aiResponses = [
                "That's a great example using the STAR method! You clearly articulated the Situation and Task.",
                "Interesting approach. How did you ensure the other person felt heard during that conversation?",
                "Good detail on the Action you took. What was the specific Result of your intervention?",
                "I like how you stayed calm. Can you give me another example demonstrating your adaptability?",
                "Excellent. Now, let's switch gears. What is your greatest professional weakness?"
            ];
            const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

            const aiMsg = { id: messages.length + 2, sender: 'ai', text: randomResponse };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);

            // Award mock XP for engagement
            if (Math.random() > 0.5) {
                addXp(50);
            }
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">AI Role Play</h1>
                <p className="text-gray-600">Interact with AI to guide you and improve your career skills.</p>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
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
                                    className={`p-4 rounded-2xl ${msg.sender === 'user'
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
                    <div ref={messagesEndRef} />
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
                            placeholder="Type your answer here..."
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
