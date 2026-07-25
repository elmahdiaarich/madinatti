'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Son de notification (généré sans fichier externe) ──
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef(null);

  // ── Charger historique depuis localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem('madina_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('madina_chat_history');
      }
    }
  }, []);

  // ── Sauvegarder historique dans localStorage ──
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('madina_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // ── Message de bienvenue si historique vide ──
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendMessage('bonjour', true);
    }
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  // ── Auto scroll quand un nouveau message arrive ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto scroll quand on ROUVRE le chat (historique déjà présent, donc
  //    "messages" ne change pas — il faut un effet séparé sur isOpen).
  //    Le petit délai laisse le temps à la fenêtre du chat de se monter,
  //    puisqu'elle est en rendu conditionnel (isOpen && ...). ──
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const sendMessage = async (text, isSystem = false) => {
    if (!text.trim() || loading) return;

    if (!isSystem) {
      setMessages(prev => [...prev, { from: 'user', text }]);
    }

    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      setMessages(prev => [...prev, {
        from: 'bot',
        text: data.text,
        buttons: data.buttons || []
      }]);

      // Son + badge si chat fermé
      playNotificationSound();
      if (!isOpen) setHasUnread(true);

    } catch (err) {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: "❌ Une erreur est survenue. Veuillez réessayer.",
        buttons: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleButton = (btn) => {
    if (btn.action === 'message') {
      setMessages(prev => [...prev, { from: 'user', text: btn.label }]);
      sendMessage(btn.value, true);
    } else if (btn.action === 'redirect') {
      window.location.href = btn.value;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearHistory = () => {
    localStorage.removeItem('madina_chat_history');
    setMessages([]);
    setTimeout(() => sendMessage('bonjour', true), 100);
  };

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/my-space')) {
    return null;
  }

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        style={{ backgroundColor: '#A7D129' }}
        aria-label="Ouvrir le chat"
      >
        {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}

        {/* ── Badge notification ── */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        )}
      </button>

      {/* ── Fenêtre du chat ── */}
      {isOpen && (
        <div
          className="fixed inset-x-3 bottom-36 z-50 flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96"
          style={{ height: 'min(520px, calc(100dvh - 10rem))', backgroundColor: '#fff' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: '#2D5016' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: '#A7D129', color: '#2D5016' }}
            >
              M
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Madina</p>
              <p className="text-xs" style={{ color: '#A7D129' }}>Assistante Madinatti</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              {/* Bouton effacer historique */}
              <button
                onClick={clearHistory}
                title="Effacer la conversation"
                className="text-gray-300 hover:text-white transition-colors ml-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ backgroundColor: '#f9fafb' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Bubble */}
                <div
                  className="max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line"
                  style={{
                    backgroundColor: msg.from === 'user' ? '#A7D129' : '#ffffff',
                    color: msg.from === 'user' ? '#2D5016' : '#000',
                    border: msg.from === 'bot' ? '1px solid #e5e7eb' : 'none',
                    borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                  }}
                >
                  {msg.text}
                </div>

                {/* Buttons */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                    {msg.buttons.map((btn, j) => (
                      <button
                        key={j}
                        onClick={() => handleButton(btn)}
                        className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
                        style={{ borderColor: '#A7D129', color: '#2D5016', backgroundColor: '#E8F5D0' }}
                        onMouseEnter={e => { e.target.style.backgroundColor = '#A7D129'; e.target.style.color = '#fff'; }}
                        onMouseLeave={e => { e.target.style.backgroundColor = '#E8F5D0'; e.target.style.color = '#2D5016'; }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl border border-gray-200 bg-white">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#A7D129', animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#A7D129', animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#A7D129', animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-200 bg-white">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 outline-none focus:border-green-400"
              maxLength={500}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#A7D129' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
