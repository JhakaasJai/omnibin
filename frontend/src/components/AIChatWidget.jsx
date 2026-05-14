import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Leaf, Bot } from 'lucide-react';

const AIChatWidget = () => {
  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState([
    { role: 'ai', content: 'Hello! I am OmniBin AI. How can I help you with your smart waste management system today?' }
  ]);
  const [inputValue,  setInputValue]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const msg = inputValue.trim();
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setInputValue('');
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(p => [...p, { role: 'ai', content: data.response }]);
    } catch {
      setMessages(p => [...p, { role: 'ai', content: 'Sorry, I could not reach the server. Please try again.' }]);
    } finally { setIsLoading(false); }
  };

  return (
    <>
      {/* FAB */}
      <button
        id="ai-chat-fab"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-[60] transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #16a34a, #059669)',
          boxShadow: '0 8px 24px rgba(22,163,74,0.40)',
          opacity:   isOpen ? 0 : 1,
          transform: isOpen ? 'scale(0.8)' : 'scale(1)',
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      <div
        id="ai-chat-window"
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-[340px] sm:w-[380px] h-[500px] flex flex-col z-[60] glass-panel"
        style={{
          borderRadius: 22,
          boxShadow: '0 24px 80px rgba(13,74,47,0.22)',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          transformOrigin: 'bottom right',
          transform: isOpen ? 'scale(1)' : 'scale(0.85)',
          opacity:   isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 shrink-0 rounded-t-[22px]"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.50)', background: 'rgba(255,255,255,0.20)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#16a34a,#059669)', boxShadow:'0 4px 10px rgba(22,163,74,0.30)' }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#0d4a2f' }}>OmniBin AI</h3>
              <p className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: '#16a34a' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <button
            id="ai-chat-close"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/50"
            style={{ color: 'rgba(13,74,47,0.50)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-1"
                     style={{ background:'rgba(22,163,74,0.12)', border:'1px solid rgba(22,163,74,0.25)' }}>
                  <Bot className="w-3 h-3" style={{ color: '#16a34a' }} />
                </div>
              )}
              <div
                className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                style={msg.role === 'user' ? {
                  background: 'linear-gradient(135deg,#16a34a,#059669)',
                  color: '#fff',
                  borderBottomRightRadius: 5,
                  boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                } : {
                  background: 'rgba(255,255,255,0.60)',
                  border: '1px solid rgba(255,255,255,0.75)',
                  color: '#0d4a2f',
                  borderBottomLeftRadius: 5,
                  boxShadow: '0 2px 8px rgba(13,74,47,0.08)',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-1"
                   style={{ background:'rgba(22,163,74,0.12)', border:'1px solid rgba(22,163,74,0.25)' }}>
                <Bot className="w-3 h-3" style={{ color: '#16a34a' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
                   style={{ background:'rgba(255,255,255,0.60)', border:'1px solid rgba(255,255,255,0.75)', borderBottomLeftRadius:5 }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color:'#16a34a' }} />
                <span className="text-[13px]" style={{ color:'rgba(13,74,47,0.55)' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}>
          <div className="relative flex items-center">
            <input
              id="ai-chat-input"
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about routes, bins, analytics..."
              className="eco-input pr-11 text-sm"
              style={{ borderRadius: 14 }}
              disabled={isLoading}
            />
            <button
              id="ai-chat-send"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background:'linear-gradient(135deg,#16a34a,#059669)', color:'#fff',
                       boxShadow: inputValue.trim() ? '0 4px 10px rgba(22,163,74,0.30)' : 'none' }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AIChatWidget;
