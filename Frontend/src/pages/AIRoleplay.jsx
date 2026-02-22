import React, { useState, useRef, useEffect } from 'react';
import { MdSend, MdMic, MdSmartToy, MdPerson, MdAdd, MdDelete, MdEdit, MdSearch, MdCheck, MdClose } from 'react-icons/md';
import Button from '../components/Button';
import { useGamification } from '../context/GamificationContext';
import { useLanguage } from '../context/LanguageContext';
import { deleteAI, getAI, patchAI, postAI } from '../utils/aiClient';

const defaultGreeting = 'This is your safe space to practice, improve, and lead with confidence.';

const toChatMessages = (session) =>
    (session?.messages || []).map((msg) => ({
        id: msg.id,
        sender: msg.role === 'ai' ? 'ai' : 'user',
        text: msg.content,
    }));

const getSessionPreview = (session) => {
    if ((session.title || '').trim()) return session.title;
    const firstUser = (session.messages || []).find((msg) => msg.role === 'user');
    if (!firstUser?.content) return `Session #${session.id}`;
    return firstUser.content.length > 44 ? `${firstUser.content.slice(0, 44)}...` : firstUser.content;
};

const AIRolePlay = () => {
    const { addXp } = useGamification();
    const { language } = useLanguage();
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    const [sessions, setSessions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [historyError, setHistoryError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    const autoGrowTextarea = () => {
        if (!inputRef.current) return;
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    };

    useEffect(() => {
        autoGrowTextarea();
    }, [inputText]);

    const loadHistory = async (query = '') => {
            setIsHistoryLoading(true);
            setHistoryError('');
            try {
                const history = await getAI(`/roleplay/history/${query ? `?q=${encodeURIComponent(query)}` : ''}`);
                const safeHistory = Array.isArray(history) ? history : [];
                setSessions(safeHistory);

                if (safeHistory.length > 0) {
                    const latest = safeHistory[0];
                    setSessionId(latest.id);
                    const mapped = toChatMessages(latest);
                    setMessages(mapped.length > 0 ? mapped : [{ id: 1, sender: 'ai', text: defaultGreeting }]);
                } else {
                    setSessionId(null);
                    setMessages([{ id: 1, sender: 'ai', text: defaultGreeting }]);
                }
            } catch (err) {
                setHistoryError("AI roleplay is unavailable right now. Please try again shortly.");
                setSessionId(null);
                setMessages([{ id: 1, sender: 'ai', text: "AI roleplay is unavailable right now. Please try again shortly." }]);
                console.error(err);
            } finally {
                setIsHistoryLoading(false);
            }
        };

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadHistory(searchText);
        }, 250);
        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const refreshHistory = async (preferredSessionId) => {
        try {
            const history = await getAI(`/roleplay/history/${searchText ? `?q=${encodeURIComponent(searchText)}` : ''}`);
            const safeHistory = Array.isArray(history) ? history : [];
            setSessions(safeHistory);

            if (!safeHistory.length) return;
            const selected = safeHistory.find((item) => item.id === preferredSessionId) || safeHistory[0];
            if (!selected) return;

            setSessionId(selected.id);
            setMessages(toChatMessages(selected));
        } catch (err) {
            console.error(err);
        }
    };

    const openSession = (session) => {
        setSessionId(session.id);
        const mapped = toChatMessages(session);
        setMessages(mapped.length > 0 ? mapped : [{ id: 1, sender: 'ai', text: defaultGreeting }]);
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([{ id: 1, sender: 'ai', text: defaultGreeting }]);
        setInputText('');
        setEditingSessionId(null);
        setEditingTitle('');
    };

    const beginRename = (session) => {
        setEditingSessionId(session.id);
        setEditingTitle(getSessionPreview(session));
    };

    const cancelRename = () => {
        setEditingSessionId(null);
        setEditingTitle('');
    };

    const saveRename = async (sessionIdToRename) => {
        const nextTitle = editingTitle.trim();
        if (!nextTitle) return;
        try {
            await patchAI(`/roleplay/sessions/${sessionIdToRename}/`, { title: nextTitle });
            setSessions((prev) => prev.map((item) => (item.id === sessionIdToRename ? { ...item, title: nextTitle } : item)));
            if (sessionId === sessionIdToRename) {
                setSessionId(sessionIdToRename);
            }
            cancelRename();
        } catch (err) {
            console.error(err);
        }
    };

    const removeSession = async (sessionIdToDelete) => {
        try {
            await deleteAI(`/roleplay/sessions/${sessionIdToDelete}/`);
            const remaining = sessions.filter((item) => item.id !== sessionIdToDelete);
            setSessions(remaining);

            if (sessionId === sessionIdToDelete) {
                if (remaining.length > 0) {
                    openSession(remaining[0]);
                } else {
                    startNewChat();
                }
            }
            if (editingSessionId === sessionIdToDelete) {
                cancelRename();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const submittedText = inputText;
        const userMsg = { id: messages.length + 1, sender: 'user', text: inputText };
        setMessages((prev) => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const data = await postAI('/roleplay/', {
                prompt: submittedText,
                session_id: sessionId || undefined,
                language: language === 'HA' ? 'hausa' : 'english',
            });
            const aiMsg = { id: messages.length + 2, sender: 'ai', text: data.reply };
            setMessages((prev) => [...prev, aiMsg]);
            const nextSessionId = data.session_id || sessionId;
            if (nextSessionId) setSessionId(nextSessionId);
            await refreshHistory(nextSessionId);
            setIsTyping(false);

            if (data.xp_awarded) addXp(data.xp_awarded);
        } catch (err) {
            setMessages((prev) => [...prev, {
                id: messages.length + 2,
                sender: 'ai',
                text: err?.message || "I could not reach the AI service. Please try again.",
            }]);
            setIsTyping(false);
            console.error(err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">AI Assistant Coach</h1>
                <p className="text-gray-600">Your personal guide for career advice and soft skill development.</p>
            </div>

            <div className="flex-1 min-h-0 flex gap-4">
                <aside className="w-full md:w-80 md:flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                        <Button onClick={startNewChat} className="w-full !py-2.5 flex items-center justify-center gap-2">
                            <MdAdd size={18} />
                            New chat
                        </Button>
                        <div className="mt-3 relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search chats..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {isHistoryLoading && <p className="text-sm text-gray-500 px-3 py-2">Loading chats...</p>}
                        {!isHistoryLoading && sessions.length === 0 && (
                            <p className="text-sm text-gray-500 px-3 py-2">No chats found.</p>
                        )}
                        {!isHistoryLoading &&
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`w-full text-left px-3 py-3 rounded-xl mb-2 border transition-colors ${
                                        session.id === sessionId
                                            ? 'bg-primary/10 border-primary/30'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {editingSessionId === session.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                maxLength={140}
                                            />
                                            <button type="button" onClick={() => saveRename(session.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                                <MdCheck size={18} />
                                            </button>
                                            <button type="button" onClick={cancelRename} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                                <MdClose size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openSession(session)}
                                                className="flex-1 text-left min-w-0"
                                            >
                                                <p className="text-sm font-medium text-gray-900 truncate">{getSessionPreview(session)}</p>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => beginRename(session)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                                    <MdEdit size={16} />
                                                </button>
                                                <button type="button" onClick={() => removeSession(session.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                                    <MdDelete size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(session.started_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                    </div>
                </aside>

                <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 scroll-smooth"
                    >
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`flex max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}
                                >
                                    <div
                                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                            msg.sender === 'user' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'
                                        }`}
                                    >
                                        {msg.sender === 'user' ? <MdPerson /> : <MdSmartToy />}
                                    </div>
                                    <div
                                        className={`p-4 rounded-2xl whitespace-pre-wrap ${
                                            msg.sender === 'user'
                                                ? 'bg-primary text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                        }`}
                                    >
                                        <p className="text-sm md:text-base leading-relaxed break-words">{msg.text}</p>
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

                    <div className="p-4 bg-white border-t border-gray-100">
                        {historyError && <p className="text-sm text-red-600 mb-2">{historyError}</p>}
                        <div className="flex items-end space-x-2">
                            <button className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 transition-colors">
                                <MdMic size={24} />
                            </button>
                            <textarea
                                ref={inputRef}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask me anything..."
                                rows={1}
                                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none max-h-40 overflow-y-auto leading-relaxed"
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
        </div>
    );
};


export default AIRolePlay;
