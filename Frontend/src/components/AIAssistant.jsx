import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getAI, postAI } from '../utils/aiClient';

const LESSON_CONTEXT_STORAGE_KEY = 'brightskill_lesson_context';

const AIAssistant = () => {
    const { isAuthenticated, user, activeCourseId, apiRequest } = useAuth();
    const { language } = useLanguage();
    const location = useLocation();
    const messagesEndRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [pageContext, setPageContext] = useState({ page: 'general', page_context: {} });
    const [roadmapContext, setRoadmapContext] = useState(null);
    const [roleplayMode, setRoleplayMode] = useState(false);
    const [roleplayDifficulty, setRoleplayDifficulty] = useState('intermediate');
    const [roleplaySessionId, setRoleplaySessionId] = useState(null);

    const excludedRoutes = [
        '/login',
        '/register',
        '/profile/edit',
        '/about',
        '/ai-roleplay',
        '/privacy-policy',
        '/terms',
        '/terms-and-condition',
        '/terms-and-conditions',
    ];
    const displayName = user?.first_name || user?.username || 'there';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        const syncContext = async () => {
            const path = location.pathname || '';
            let ctx = { current_path: path };

            if (path.includes('/lesson/')) {
                try {
                    const stored = JSON.parse(sessionStorage.getItem(LESSON_CONTEXT_STORAGE_KEY) || '{}');
                    ctx = { ...ctx, ...stored };
                } catch {
                    // ignore parse errors
                }
                setPageContext({ page: 'lesson', page_context: ctx });
                return;
            }

            if (path.includes('/learning-path')) {
                let roadmap = null;
                try {
                    roadmap = await getAI('/roadmap/');
                } catch {
                    roadmap = null;
                }
                setRoadmapContext(roadmap);
                const stages = Array.isArray(roadmap?.stages) ? roadmap.stages : [];
                const currentStage = stages.find((s) => !s.is_completed) || stages[0] || null;
                ctx = {
                    ...ctx,
                    selected_skill: roadmap?.selected_skill || '',
                    roadmap_title: roadmap?.title || '',
                    current_stage: currentStage?.stage_title || '',
                    roadmap_tasks: currentStage?.learner_actions || '',
                };
                setPageContext({ page: 'roadmap', page_context: ctx });
                return;
            }

            if (path.includes('/dashboard')) {
                if (activeCourseId) {
                    try {
                        const response = await apiRequest(`/courses/${activeCourseId}/`);
                        if (response.ok) {
                            const course = await response.json();
                            ctx = {
                                ...ctx,
                                active_course_id: course.id,
                                active_course_title: course.title || '',
                                selected_skill: course.skill_name || '',
                            };
                        }
                    } catch {
                        // ignore course context fetch errors
                    }
                }
                setPageContext({ page: 'dashboard', page_context: ctx });
                return;
            }
            if (path.includes('/skills')) {
                if (activeCourseId) {
                    try {
                        const response = await apiRequest(`/courses/${activeCourseId}/`);
                        if (response.ok) {
                            const course = await response.json();
                            ctx = {
                                ...ctx,
                                active_course_id: course.id,
                                active_course_title: course.title || '',
                                selected_skill: course.skill_name || '',
                            };
                        }
                    } catch {
                        // ignore course context fetch errors
                    }
                }
                setPageContext({ page: 'skills', page_context: ctx });
                return;
            }
            setPageContext({ page: 'general', page_context: ctx });
        };

        syncContext();
    }, [location.pathname, activeCourseId, apiRequest]);

    useEffect(() => {
        setConversationId(null);
        setMessages([]);
        setRoleplaySessionId(null);
    }, [location.pathname]);

    useEffect(() => {
        if (isAuthenticated && isOpen && messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                const greeting = roleplayMode
                    ? `Hello ${displayName}. Role-play mode is active. Choose difficulty and send your scenario.`
                    : `Hello ${displayName}. I am Fodiye. I can guide your current learning stage and next actions.`;
                setMessages([{ sender: 'ai', text: greeting, time: new Date() }]);
                setIsTyping(false);
            }, 400);
        }
    }, [isAuthenticated, isOpen, roleplayMode, displayName, messages.length]);

    const sendRoleplayMessage = async (text) => {
        const selectedSkill = roadmapContext?.selected_skill || '';
        const currentStage = Array.isArray(roadmapContext?.stages)
            ? roadmapContext.stages.find((s) => !s.is_completed) || roadmapContext.stages[0]
            : null;
        const data = await postAI('/roleplay/', {
            prompt: text,
            ...(roleplaySessionId ? { session_id: roleplaySessionId } : {}),
            scenario: currentStage?.stage_objective || 'Practice a realistic soft-skills situation',
            context: {
                difficulty: roleplayDifficulty,
                ...(selectedSkill ? { selected_skill: selectedSkill } : {}),
            },
        });
        if (data?.session_id && data.session_id !== roleplaySessionId) {
            setRoleplaySessionId(data.session_id);
        }
        return data;
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        setMessages((prev) => [...prev, { sender: 'user', text: userText, time: new Date() }]);
        setInput('');
        setIsTyping(true);

        try {
            if (roleplayMode) {
                const rp = await sendRoleplayMessage(userText);
                setMessages((prev) => [...prev, { sender: 'ai', text: rp.reply, time: new Date() }]);
            } else {
                const data = await postAI('/fab-assist/', {
                    prompt: userText,
                    skill: pageContext.page_context?.selected_skill || roadmapContext?.selected_skill || (language === 'HA' ? 'hausa soft skills' : 'soft skills'),
                    page: pageContext.page,
                    page_context: {
                        ...pageContext.page_context,
                        selected_skill: pageContext.page_context?.selected_skill || roadmapContext?.selected_skill || '',
                        roadmap_stage: Array.isArray(roadmapContext?.stages)
                            ? (roadmapContext.stages.find((s) => !s.is_completed) || roadmapContext.stages[0])?.stage_title || ''
                            : '',
                        roadmap_tasks: Array.isArray(roadmapContext?.stages)
                            ? (roadmapContext.stages.find((s) => !s.is_completed) || roadmapContext.stages[0])?.learner_actions || ''
                            : '',
                    },
                    ...(conversationId ? { conversation_id: conversationId } : {}),
                });
                setMessages((prev) => [...prev, { sender: 'ai', text: data.reply, time: new Date() }]);
                if (data.conversation_id) setConversationId(data.conversation_id);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'ai',
                    text: err?.message || 'I could not connect to the AI service right now. Please try again.',
                    time: new Date(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isAuthenticated || excludedRoutes.includes(location.pathname)) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none overflow-auto">
            <div
                className={`
                    pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200
                    w-80 md:w-96 transition-all duration-300 ease-in-out transform origin-bottom-right
                    ${isOpen ? 'scale-100 opacity-100 mb-4 translate-y-0' : 'scale-75 opacity-0 mb-0 translate-y-10 h-0 overflow-hidden'}
                `}
                style={{ maxHeight: '680px', display: isOpen ? 'flex' : 'none' }}
            >
                <div className="flex flex-col h-full w-full">
                    <div className="bg-indigo-600 p-4 rounded-t-2xl flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-sm">Fodiye</h3>
                            <p className="text-indigo-200 text-xs">
                                {roleplayMode ? `Role-play (${roleplayDifficulty})` : 'Context-aware FAB assistant'}
                            </p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200 transition">
                            x
                        </button>
                    </div>

                    <div className="px-3 py-2 border-b border-gray-100 bg-white flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setRoleplayMode(false)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${!roleplayMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                            Assistant
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setRoleplayMode(true);
                                setRoleplaySessionId(null);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${roleplayMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                            Role-play
                        </button>
                        {roleplayMode && (
                            <select
                                value={roleplayDifficulty}
                                onChange={(e) => setRoleplayDifficulty(e.target.value)}
                                className="ml-auto text-xs border rounded-lg px-2 py-1"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                        msg.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
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

                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={roleplayMode ? 'Type your role-play response...' : 'Ask Fodiye...'}
                                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300
                    flex items-center justify-center
                    ${isOpen ? 'w-12 h-12 rounded-full bg-gray-200 text-gray-600' : 'w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}
                `}
            >
                {isOpen ? 'x' : 'Fodiye'}
            </button>
        </div>
    );
};

export default AIAssistant;
