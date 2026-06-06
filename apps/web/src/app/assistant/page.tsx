'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@executive-health/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UserData {
  id: string;
  email: string;
  display_name: string;
  last_intake_date: string | null;
}

const ONBOARDING_GREETING = `Hi! 👋 Welcome to your AI Health Assistant!

I'd love to give you personalized health insights, but I need a bit of information about you first.

**Please complete your Health Assessment** — it only takes a few minutes and helps me understand your lifestyle, habits, and wellness goals.

[Start Health Assessment →]`;

const COMPLETED_GREETING = `Hi! I'm your health assistant. I can see your health assessment data. Ask me anything about your health score, recommendations, or how to improve your well-being.`;

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      let token: string | null = null;
      try {
        token = localStorage.getItem('token');
      } catch { /* private browsing */ }
      if (!token) {
        try {
          const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
          if (match) {
            token = decodeURIComponent(match[1]);
            try { localStorage.setItem('token', token); } catch { /* ignore */ }
          }
        } catch { /* cookie access denied */ }
      }
      if (!token) {
        if (!cancelled) router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        if (data.error) {
          router.push('/auth/login');
          return;
        }
        if (!cancelled) {
          setUserData(data.user);
          if (data.user?.last_intake_date != null) {
            setMessages([{ role: 'assistant', content: COMPLETED_GREETING }]);
          } else {
            setMessages([{ role: 'assistant', content: ONBOARDING_GREETING }]);
          }
        }
      } catch {
        if (!cancelled) {
          setMessages([{ role: 'assistant', content: 'Unable to verify your account. Please try again later.' }]);
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    loadUser();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setSending(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Sorry, I couldn\'t process that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <DashboardLayout currentPath="/assistant" onNavigate={(p) => router.push(p)}>
      <style>{`
        /* ── Chat layout ── */
        .eh-chat-wrapper {
          max-width: 700px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - var(--eh-header-height) - clamp(16px, 3vw, 24px) * 2);
          min-height: 0;
          padding: 0 clamp(8px, 2vw, 16px);
        }
        .eh-chat-card {
          flex: 1;
          overflow-y: auto;
          padding: clamp(12px, 2.5vw, 20px);
          margin-bottom: clamp(8px, 2vw, 12px);
          background: var(--bg-card);
          border-radius: clamp(14px, 2.5vw, 16px);
          border: 1px solid var(--border-light);
          min-height: 0;
          -webkit-overflow-scrolling: touch;
        }
        .eh-chat-card::-webkit-scrollbar { width: 4px; }
        .eh-chat-card::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── Chat bubbles ── */
        .eh-chat-bubble {
          max-width: min(85%, 520px);
          padding: clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px);
          border-radius: 14px;
          font-size: clamp(13px, 1.8vw, 14px);
          line-height: 1.6;
          word-wrap: break-word;
          overflow-wrap: break-word;
          min-width: 0;
          transition: transform 0.15s ease;
        }
        .eh-chat-bubble-user {
          background: var(--accent-light);
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }
        .eh-chat-bubble-assistant {
          background: #16213e;
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* ── Message animation ── */
        .eh-chat-msg-enter {
          animation: eh-chat-slide-up 0.3s ease forwards;
        }
        @keyframes eh-chat-slide-up {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Input row ── */
        .eh-chat-input-row {
          display: flex;
          gap: clamp(6px, 1.5vw, 10px);
          align-items: center;
          flex-shrink: 0;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .eh-chat-input {
          flex: 1;
          min-width: 0;
          height: clamp(44px, 8vw, 52px);
          padding: clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px);
          font-size: clamp(15px, 2.5vw, 16px);
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .eh-chat-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .eh-chat-input:disabled {
          opacity: 0.5;
        }
        .eh-chat-send-btn {
          white-space: nowrap;
          flex-shrink: 0;
          min-height: clamp(44px, 8vw, 52px);
          min-width: clamp(60px, 12vw, 80px);
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .eh-chat-disclaimer {
          color: #4b5563;
          font-size: clamp(10px, 1.5vw, 11px);
          text-align: center;
          margin-top: clamp(6px, 1.5vw, 10px);
          line-height: 1.5;
          flex-shrink: 0;
          padding: 0 4px;
        }

        /* ── Typing indicator ── */
        .eh-chat-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 0;
        }
        .eh-chat-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: eh-typing-bounce 1.4s ease-in-out infinite;
        }
        .eh-chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .eh-chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes eh-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        /* Tablet */
        @media (max-width: 768px) {
          .eh-chat-wrapper {
            height: calc(100vh - var(--eh-header-height) - clamp(20px, 4vw, 32px));
          }
          .eh-chat-card {
            padding: clamp(10px, 2vw, 14px);
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .eh-chat-wrapper {
            height: calc(100vh - 52px - clamp(16px, 3vw, 24px));
            padding: 0 6px;
          }
          .eh-chat-card {
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 16px;
          }
          .eh-chat-input-row {
            gap: 6px;
          }
          .eh-chat-send-btn {
            min-width: 56px;
            padding: 10px 12px !important;
            font-size: 13px !important;
          }
          .eh-chat-bubble {
            max-width: 92%;
          }
          .eh-chat-input {
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="eh-chat-wrapper">
        <h1 className="eh-page-title" style={{ marginBottom: 'clamp(8px, 2vw, 16px)', flexShrink: 0 }}>
          AI Health Assistant
        </h1>

        {loadingUser ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div className="eh-chat-typing">
              <div className="eh-chat-typing-dot" />
              <div className="eh-chat-typing-dot" />
              <div className="eh-chat-typing-dot" />
            </div>
          </div>
        ) : (
          <>
            {/* Chat messages */}
            <div className="eh-chat-card">
              {messages.map((m, i) => {
                const isOnboardingGreeting = i === 0 && userData?.last_intake_date == null && m.role === 'assistant';
                const isLast = i === messages.length - 1;

                return (
                  <div
                    key={i}
                    className={isLast ? 'eh-chat-msg-enter' : ''}
                    style={{
                      display: 'flex',
                      justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 'clamp(8px, 1.5vw, 12px)',
                    }}
                  >
                    <div
                      className={`eh-chat-bubble ${m.role === 'user' ? 'eh-chat-bubble-user' : 'eh-chat-bubble-assistant'}`}
                    >
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      {isOnboardingGreeting && (
                        <button
                          onClick={() => router.push('/onboarding')}
                          className="eh-btn eh-btn-primary"
                          style={{
                            marginTop: '14px',
                            padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 28px)',
                            fontSize: 'clamp(13px, 2vw, 15px)',
                            fontWeight: 600,
                            width: '100%',
                            borderRadius: 10,
                          }}
                        >
                          Start Health Assessment →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div
                    className="eh-chat-bubble eh-chat-bubble-assistant"
                    style={{ display: 'flex', alignItems: 'center', minHeight: 38 }}
                  >
                    <div className="eh-chat-typing">
                      <div className="eh-chat-typing-dot" />
                      <div className="eh-chat-typing-dot" />
                      <div className="eh-chat-typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input area */}
            <div className="eh-chat-input-row">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your health..."
                disabled={sending}
                className="eh-chat-input"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="eh-btn eh-btn-primary eh-chat-send-btn"
                style={{
                  opacity: sending ? 0.6 : 1,
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? '···' : 'Send →'}
              </button>
            </div>

            <p className="eh-chat-disclaimer">
              Always consult with a qualified healthcare provider before making any health decisions based on this information. I am an AI assistant, not a doctor — my responses are for informational purposes only.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
