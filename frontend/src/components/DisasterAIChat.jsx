import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icons';
import { sendAIChatMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';

/**
 * Clean, safe Markdown formatter for structured emergency responses.
 */
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '0.2rem' }} />;

        // Headers
        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={idx} style={{ color: '#ff6b2c', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {text}
            </div>
          );
        }

        // Bullet / Numbered items
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
        const isNumbered = /^[0-9]+\.\s+/.test(trimmed);

        const cleanText = isBullet
          ? trimmed.replace(/^[•\-*]\s*/, '')
          : isNumbered
            ? trimmed
            : trimmed;

        // Render bold text
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ color: '#ffffff', fontWeight: 800 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', paddingLeft: '0.25rem' }}>
              <span style={{ color: '#ff6b2c', fontWeight: 800 }}>•</span>
              <span>{rendered}</span>
            </div>
          );
        }

        return <div key={idx}>{rendered}</div>;
      })}
    </div>
  );
};

export const DisasterAIChat = ({ onOpenSos, onOpenShelter, externalQuery = null }) => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('disasterchain_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [sosConfirmDialog, setSosConfirmDialog] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, sosConfirmDialog]);

  // Persist conversation to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('disasterchain_chat_history', JSON.stringify(messages.slice(-10)));
    } catch {
      // Ignore
    }
  }, [messages]);

  // Handle body class and escape key
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('ai-assistant-open');
    } else {
      document.body.classList.remove('ai-assistant-open');
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('ai-assistant-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Global event trigger listener
  useEffect(() => {
    const handleGlobalTrigger = (e) => {
      const query = e.detail?.query || 'How can I get emergency help?';
      setIsOpen(true);
      if (query) {
        handleSendMessage(query);
      }
    };

    window.addEventListener('disasterchain:ai-assistant-open', handleGlobalTrigger);
    return () => {
      window.removeEventListener('disasterchain:ai-assistant-open', handleGlobalTrigger);
    };
  }, []);

  // External query prop listener
  useEffect(() => {
    if (externalQuery) {
      setIsOpen(true);
      handleSendMessage(externalQuery);
    }
  }, [externalQuery]);

  // Attempt silent GPS geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => { },
        { timeout: 5000 }
      );
    }
  }, []);

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await sendAIChatMessage({
        message: text,
        conversation: historyPayload,
        latitude: userCoords?.latitude,
        longitude: userCoords?.longitude,
        language: currentLanguage,
      });

      if (res && res.success && res.data) {
        const isEmergency = res.data.isEmergency || /emergency|sos|danger|help|trapped|flood|fire/i.test(text);

        const assistantMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: res.data.reply,
          actions: res.data.actions || [],
          isEmergency,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (res.data.actionRequired === 'SOS_CONFIRMATION' || isEmergency) {
          setSosConfirmDialog({
            promptText: 'Do you want to send an emergency SOS distress beacon with your live coordinates?',
          });
        }
      } else {
        throw new Error('No response received from assistant');
      }
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: `**EMERGENCY ASSISTANCE PROTOCOL**\n\nIf you are in immediate danger:\n1. Move to high ground or a safe location.\n2. Call national emergency hotline 112.\n3. Send an SOS beacon via DisasterChain.`,
        actions: [
          { type: 'TRIGGER_SOS', label: '🚨 Send Emergency SOS' },
          { type: 'NAVIGATE', label: 'Find Nearby Shelters', route: '/shelters' },
        ],
        isEmergency: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    setSosConfirmDialog(null);
    try {
      sessionStorage.removeItem('disasterchain_chat_history');
    } catch { }
  };

  // Action button executor
  const executeAction = (action) => {
    if (!action) return;
    if (action.type === 'TRIGGER_SOS') {
      if (onOpenSos) onOpenSos();
      else navigate('/sos');
    } else if (action.type === 'NAVIGATE' && action.route) {
      navigate(action.route);
    } else if (action.type === 'VIEW_SHELTER') {
      if (onOpenShelter && action.payload) onOpenShelter(action.payload);
      else navigate('/shelters');
    }
  };

  // The 5 standard simplified prompt chips
  const quickChips = [
    { label: '🚨 I need emergency help', query: 'I need emergency help right now' },
    { label: '🏠 Find a shelter', query: 'Find the nearest emergency shelter with available space' },
    { label: '⚠️ What alerts are active?', query: 'What active disaster alerts and warnings are in effect?' },
    { label: "🌦️ What's the weather?", query: 'What is the current local weather and hazard risk?' },
    { label: '🧰 What should I prepare?', query: 'What emergency supplies should I prepare right now?' },
  ];

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Visible ONLY when chat is closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="disaster-ai-launcher"
          aria-label="Open DisasterChain AI Assistant"
          id="open-ai-assistant-btn"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9995,
            background: '#ff6b2c',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '9999px',
            padding: '0.65rem 1.15rem',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(255, 107, 44, 0.45), 0 2px 6px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <span style={{ fontSize: '1.15rem' }}>🤖</span>
          <span>AI ASSISTANT</span>
        </button>
      )}

      {/* 2. BACKDROP (Desktop / Tablet click-outside to close) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="disaster-ai-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(2px)',
            zIndex: 9998,
          }}
        />
      )}

      {/* 3. SIMPLIFIED AI CHAT WINDOW (Modal) */}
      {isOpen && (
        <div
          className="disaster-ai-modal"
          role="dialog"
          aria-label="DisasterChain AI Emergency Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 48px)',
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: '16px',
            zIndex: 10000,
            background: '#14100c',
            border: '1px solid rgba(255, 107, 44, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* HEADER (Safe-Area Aware & Explicit 44x44 Close Button) */}
          <header
            className="disaster-ai-header"
            style={{
              background: '#1a1410',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexShrink: 0,
            }}
          >
            {/* Title Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 107, 44, 0.15)',
                  border: '1px solid rgba(255, 107, 44, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                  DisasterChain AI
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Emergency Assistant
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Clear History Button */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  style={{
                    minWidth: '38px',
                    minHeight: '38px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <Icon name="trash" size={16} />
                </button>
              )}

              {/* CRITICAL: Explicit, High-Contrast 44x44 Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                id="close-ai-assistant-btn"
                aria-label="Close AI Assistant"
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  width: '44px',
                  height: '44px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                  zIndex: 10002,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
              >
                ✕
              </button>
            </div>
          </header>

          {/* CHAT MESSAGES BODY */}
          <div
            className="disaster-ai-body"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxSizing: 'border-box',
            }}
          >
            {/* Welcome Screen if no messages */}
            {messages.length === 0 && (
              <div
                style={{
                  margin: 'auto 0',
                  textAlign: 'center',
                  padding: '1.5rem 0.5rem',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'rgba(255, 107, 44, 0.15)',
                    border: '1px solid rgba(255, 107, 44, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    fontSize: '1.6rem',
                  }}
                >
                  🤖
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem' }}>
                  DisasterChain AI
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0 }}>
                  How can I help?
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/weather-gpt');
                    }}
                    style={{
                      minHeight: '44px',
                      padding: '0.4rem 0.85rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>🌦️</span>
                    <span>Ask WeatherGPT</span>
                  </button>
                </div>
              </div>
            )}

            {/* Message Stream */}
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      background: isUser
                        ? '#ff6b2c'
                        : m.isEmergency
                          ? 'rgba(239, 68, 68, 0.15)'
                          : '#1c1612',
                      color: '#ffffff',
                      border: isUser
                        ? 'none'
                        : m.isEmergency
                          ? '1px solid rgba(239, 68, 68, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '0.75rem 1rem',
                      maxWidth: '90%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <FormattedMessage content={m.content} />
                  </div>

                  {/* Actions / Call 112 CTA */}
                  {m.actions && m.actions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.45rem',
                        maxWidth: '90%',
                      }}
                    >
                      {m.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => executeAction(act)}
                          style={{
                            minHeight: '38px',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            background: act.type === 'TRIGGER_SOS' ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {act.label}
                        </button>
                      ))}

                      {m.isEmergency && (
                        <a
                          href="tel:112"
                          style={{
                            minHeight: '38px',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>📞</span>
                          <span>Call 112</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Emergency SOS Confirmation Box */}
            {sosConfirmDialog && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.16)',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '0.4rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  🚨 Emergency SOS Confirmation
                </div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.84rem', color: '#f8fafc' }}>
                  {sosConfirmDialog.promptText}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSosConfirmDialog(null);
                      if (onOpenSos) onOpenSos();
                      else navigate('/sos');
                    }}
                    style={{
                      flex: 1,
                      minHeight: '42px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    SEND SOS NOW
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosConfirmDialog(null)}
                    style={{
                      minHeight: '42px',
                      padding: '0 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Loading spinner */}
            {loading && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(255, 107, 44, 0.1)',
                  borderRadius: '8px',
                  color: '#ff6b2c',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  maxWidth: 'fit-content',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid #ff6b2c',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Assisting...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 5 QUICK ACTION CHIPS */}
          <div
            className="disaster-ai-chips"
            style={{
              padding: '0.5rem 0.75rem',
              background: '#16110d',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              overflowX: 'auto',
              display: 'flex',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
              flexShrink: 0,
            }}
          >
            {quickChips.map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  touchAction: 'manipulation',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 107, 44, 0.2)';
                  e.currentTarget.style.borderColor = '#ff6b2c';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* INPUT FOOTER */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="disaster-ai-footer"
            style={{
              background: '#1a1410',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask for shelters, alerts, survival advice..."
              disabled={loading}
              maxLength={500}
              id="ai-assistant-input"
              style={{
                flex: 1,
                minHeight: '44px',
                background: '#120d09',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ff6b2c')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              id="ai-assistant-send-btn"
              style={{
                minHeight: '44px',
                minWidth: '70px',
                background: inputValue.trim() && !loading ? '#ff6b2c' : 'rgba(255, 255, 255, 0.08)',
                color: inputValue.trim() && !loading ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                touchAction: 'manipulation',
              }}
            >
              <span>Send</span>
              <Icon name="arrow-right" size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default DisasterAIChat;
