import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icons';
import { sendAIChatMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Safe lightweight Markdown parser without dangerouslySetInnerHTML.
 * Supports bold (**text**), bullet items (• or -), numbered steps (1.), and line breaks.
 */
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem', lineHeight: 1.55 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '0.25rem' }} />;

        // Check for bullet line
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
        const bulletText = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

        // Parse **bold** parts
        const parts = bulletText.split(/(\*\*.*?\*\*)/g);

        const renderedText = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ color: '#FFFFFF', fontWeight: 700 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--orange-primary)', fontSize: '0.8rem', lineHeight: 1.6 }}>•</span>
              <span style={{ color: 'var(--text-primary)', flex: 1 }}>{renderedText}</span>
            </div>
          );
        }

        return (
          <div key={idx} style={{ color: 'var(--text-primary)' }}>
            {renderedText}
          </div>
        );
      })}
    </div>
  );
};

/**
 * DISASTERCHAIN AI ASSISTANT
 * Production-grade Emergency Intelligence & Safety Assistant
 * Theme: Warm Crisis Command
 */
const AIAssistant = ({ onOpenSos, onOpenShelter, externalQuery = null }) => {
  const { user } = useAuth();
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
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'acquiring' | 'ready' | 'denied'
  const [systemMode, setSystemMode] = useState('LIMITED'); // 'LIVE' | 'LIMITED'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Persist conversation to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('disasterchain_chat_history', JSON.stringify(messages.slice(-10)));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  // Listen for global custom event to trigger AI Assistant (e.g. from EmergencyDashboard Situation Brief)
  useEffect(() => {
    const handleGlobalTrigger = (e) => {
      const query = e.detail?.query || 'Give me an operational situation brief';
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

  // Handle external query prop if supplied
  useEffect(() => {
    if (externalQuery) {
      setIsOpen(true);
      handleSendMessage(externalQuery);
    }
  }, [externalQuery]);

  // Acquire Geolocation
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('acquiring');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationStatus('ready');
      },
      () => {
        setLocationStatus('denied');
      },
      { timeout: 8000 }
    );
  };

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
      // Send conversation history to backend
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const res = await sendAIChatMessage({
        message: text,
        conversation: historyPayload,
        latitude: userCoords?.latitude,
        longitude: userCoords?.longitude,
      });

      if (res && res.success && res.data) {
        const assistantMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: res.data.reply,
          sources: res.data.sources || [],
          actions: res.data.actions || [],
          isEmergency: res.data.isEmergency || false,
          mode: res.data.context?.mode || 'LIMITED',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (res.data.context?.mode) {
          setSystemMode(res.data.context.mode);
        }

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(res?.message || 'Empty response from assistant service');
      }
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: `⚠️ The AI Emergency Assistant encountered a temporary communication issue.\n\nDisasterChain live safety services and tactical monitoring remain fully operational. Please utilize the verified emergency links below:`,
        sources: ['DisasterChain Safe Mode'],
        actions: [
          { type: 'NAVIGATE', label: 'VIEW ALERTS', route: '/alerts' },
          { type: 'NAVIGATE', label: 'FIND SHELTER', route: '/shelters' },
          { type: 'NAVIGATE', label: 'MISSION DASHBOARD', route: '/dashboard' },
          { type: 'TRIGGER_SOS', label: '🚨 EMERGENCY SOS' },
        ],
        isEmergency: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    try {
      sessionStorage.removeItem('disasterchain_chat_history');
    } catch {
      // Ignore
    }
  };

  // Handle action buttons embedded in responses
  const executeAction = (action) => {
    if (!action) return;

    if (action.type === 'TRIGGER_SOS') {
      if (onOpenSos) onOpenSos();
    } else if (action.type === 'VIEW_SHELTER') {
      if (onOpenShelter && action.payload) {
        onOpenShelter(action.payload);
      } else {
        navigate('/shelters');
      }
    } else if (action.type === 'GET_DIRECTIONS') {
      if (action.url) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      }
    } else if (action.type === 'VIEW_MAP' || action.type === 'VIEW_GLOBE') {
      navigate('/dashboard');
    } else if (action.type === 'NAVIGATE') {
      if (action.route) navigate(action.route);
    } else if (action.type === 'QUICK_QUERY') {
      handleSendMessage(action.query);
    }
  };

  const role = (user && user.role) || 'citizen';
  const isPrivileged = role === 'admin' || role === 'responder';

  // Role-tailored quick action suggestions
  const quickActions = useMemo(() => {
    const list = [
      { label: '🏛️ Nearest Shelter', query: 'Where is the nearest safe shelter with open beds?' },
      { label: '📢 Current Alerts', query: 'What are the active emergency broadcast alerts?' },
      { label: '🔥 Explain Risk', query: 'Explain the current regional risk level and hazard hotspots' },
      { label: '🛡️ Flood Protocol', query: 'What should I do during a flood?' },
      { label: '📦 Emergency Kit', query: 'What should I keep in an emergency kit?' },
    ];

    if (isPrivileged) {
      list.unshift({ label: '⚡ AI Situation Brief', query: 'Give me an operational situation brief' });
      list.push({ label: '📋 Critical Incidents', query: 'Show all unresolved field incidents' });
    }

    return list;
  }, [isPrivileged]);

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ai-assistant-launcher"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9995,
            background: 'linear-gradient(135deg, #FF6B2C 0%, #D94600 100%)',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '9999px',
            padding: '0.65rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 8px 24px rgba(255, 107, 44, 0.45), 0 2px 6px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 107, 44, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 44, 0.45)';
          }}
          title="Open DisasterChain Emergency AI Assistant"
          aria-label="Open DisasterChain Emergency AI Assistant"
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="bot" size={16} color="#FFFFFF" />
          </div>
          <span>AI ASSIST</span>
        </button>
      )}

      {/* 2. CHAT PANEL DRAWER */}
      {isOpen && (
        <div
          className="ai-assistant-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '620px',
            maxHeight: 'calc(100vh - 100px)',
            zIndex: 9998,
            background: 'rgba(22, 13, 9, 0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 107, 44, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              background: 'rgba(28, 17, 13, 0.95)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 107, 44, 0.15)',
                  border: '1px solid rgba(255, 107, 44, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="bot" size={18} color="var(--orange-primary)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>
                    DISASTERCHAIN AI
                  </span>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: systemMode === 'LIVE' ? 'rgba(132, 204, 22, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: systemMode === 'LIVE' ? '#84CC16' : '#F59E0B',
                      border: `1px solid ${systemMode === 'LIVE' ? 'rgba(132, 204, 22, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                    }}
                  >
                    {systemMode === 'LIVE' ? '● LIVE AI' : '● LIMITED MODE'}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Emergency Intelligence & Safety Assistant
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}
                  title="Clear conversation history"
                >
                  CLEAR
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px', color: 'var(--text-muted)' }}
                title="Close Assistant"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>

          {/* Quick Context Strip: Geolocation status */}
          <div
            style={{
              padding: '0.4rem 1.15rem',
              background: 'rgba(0, 0, 0, 0.35)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Role: <strong style={{ color: 'var(--orange-primary)', textTransform: 'uppercase' }}>{role}</strong>
            </span>

            {locationStatus === 'ready' && userCoords ? (
              <span style={{ color: 'var(--safe)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="map-pin" size={11} color="var(--safe)" />
                GPS: {userCoords.latitude.toFixed(3)}, {userCoords.longitude.toFixed(3)}
              </span>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.68rem', padding: '2px 6px', color: 'var(--amber)' }}
                title="Share GPS coordinates for pinpoint shelter routing"
              >
                <Icon name="navigation" size={11} color="var(--amber)" />
                <span>{locationStatus === 'acquiring' ? 'Locating...' : 'Pinpoint GPS'}</span>
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Welcome message if empty */}
            {messages.length === 0 && (
              <div
                style={{
                  background: 'rgba(255, 107, 44, 0.05)',
                  border: '1px solid rgba(255, 107, 44, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--orange-primary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  DisasterChain Command Intelligence
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                  Ask real-time questions about safe shelters, live crisis warnings, risk hotspots, or emergency procedures.
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                  Quick Operational Actions
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {quickActions.map((qa, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(qa.query)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.04)' }}
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Conversation */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '0.3rem',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    background:
                      msg.sender === 'user'
                        ? 'rgba(255, 107, 44, 0.18)'
                        : 'rgba(28, 17, 13, 0.85)',
                    border:
                      msg.sender === 'user'
                        ? '1px solid rgba(255, 107, 44, 0.4)'
                        : '1px solid var(--border-subtle)',
                    borderLeft:
                      msg.sender === 'assistant'
                        ? `3px solid ${msg.isEmergency ? 'var(--crimson)' : 'var(--orange-primary)'}`
                        : undefined,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.95rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Immediate Emergency Callout */}
                  {msg.isEmergency && (
                    <div
                      style={{
                        background: 'rgba(229, 57, 53, 0.15)',
                        border: '1px solid var(--crimson)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.4rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.65rem',
                        color: '#EF4444',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                      }}
                    >
                      <Icon name="alert-triangle" size={16} color="var(--crimson)" />
                      <span>LIFE SAFETY PRIORITY — DIAL 112 / 101 / 911</span>
                    </div>
                  )}

                  <FormattedMessage content={msg.content} />

                  {/* Sources chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.65rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sources:</span>
                      {msg.sources.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            fontSize: '0.62rem',
                            color: 'var(--orange-primary)',
                            background: 'rgba(255, 107, 44, 0.08)',
                            border: '1px solid rgba(255, 107, 44, 0.2)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.75rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {msg.actions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => executeAction(action)}
                          className={action.type === 'TRIGGER_SOS' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            background: action.type === 'TRIGGER_SOS' ? 'var(--crimson)' : undefined,
                            borderColor: action.type === 'TRIGGER_SOS' ? 'var(--crimson)' : undefined,
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingInline: '0.25rem' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Response Loading state */}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 107, 44, 0.05)',
                  border: '1px solid rgba(255, 107, 44, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  width: 'fit-content',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--orange-primary)',
                    animation: 'pulseGlow 1.2s infinite',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--orange-primary)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  ANALYZING LIVE EMERGENCY DATA...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills (When chat has messages) */}
          {messages.length > 0 && (
            <div
              style={{
                padding: '0.35rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {quickActions.slice(0, 4).map((qa, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qa.query)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.75rem',
              background: 'rgba(28, 17, 13, 0.98)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask safety guidance, shelters, risks..."
              disabled={loading}
              maxLength={1000}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                padding: '0.55rem 0.85rem',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--orange-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-medium)')}
            />

            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 0.85rem',
                background: inputValue.trim() ? 'var(--orange-primary)' : 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                opacity: inputValue.trim() && !loading ? 1 : 0.45,
              }}
              title="Send Message"
            >
              <Icon name="send" size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
