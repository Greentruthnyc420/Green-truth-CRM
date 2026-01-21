import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader, Minimize2, ShoppingBag } from 'lucide-react';
import { generateDispensaryResponse } from '../services/geminiService';
import { PRODUCT_CATALOG } from '../data/productCatalog';
import { getDispensaryAnalytics } from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';

export default function DispensaryChatbot() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [liveContext, setLiveContext] = useState({});
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Welcome! 🌿 I'm your GreenTruth ordering assistant. Ask me about product pricing, bulk discounts, cash-on-delivery deals, your order history, or help placing an order!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch live analytics when chatbot opens
    useEffect(() => {
        if (isOpen && currentUser?.uid) {
            getDispensaryAnalytics(currentUser.uid).then(data => {
                setLiveContext(data);
                console.log('[DispensaryChatbot] Loaded live analytics');
            }).catch(err => console.warn('[DispensaryChatbot] Failed to load analytics:', err));
        }
    }, [isOpen, currentUser?.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Pass live analytics for smarter, personalized responses
            const response = await generateDispensaryResponse(userMessage, PRODUCT_CATALOG, liveContext);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I had trouble processing that. Please try again!"
            }]);
        }

        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 p-4 rounded-full shadow-xl hover:scale-110 transition-all group"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
                <ShoppingBag size={28} className="text-white" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <MessageCircle size={12} className="text-white" />
                </span>
            </button>
        );
    }

    return (
        <div
            className={`fixed bottom-24 md:bottom-6 right-2 md:right-6 z-50 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'w-72 h-14' : 'w-[calc(100vw-1rem)] md:w-96 h-[65vh] md:h-[500px] max-h-[500px]'
                }`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <ShoppingBag size={16} className="text-white" />
                    </div>
                    <div className="text-white">
                        <p className="font-bold text-sm">Order Assistant</p>
                        {!isMinimized && <p className="text-xs text-white/80">Powered by Gemini 3</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <Minimize2 size={16} className="text-white" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-white" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div
                        className="flex-1 overflow-y-auto p-4 space-y-3"
                        style={{ height: 'calc(100% - 120px)', background: 'var(--bg-secondary)' }}
                    >
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user'
                                        ? 'bg-purple-500 text-white rounded-br-sm'
                                        : 'rounded-bl-sm'
                                        }`}
                                    style={msg.role === 'assistant' ? {
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-primary)'
                                    } : {}}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div
                                    className="px-4 py-2 rounded-xl rounded-bl-sm"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                                >
                                    <Loader size={16} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                        className="p-3 flex gap-2"
                        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about deals, pricing, orders..."
                            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
