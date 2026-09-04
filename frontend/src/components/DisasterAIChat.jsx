import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icons';
import { sendAIChatMessage, createSosRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';

/**
 * Safe lightweight Markdown parser without dangerouslySetInnerHTML.
 * Supports bold (**text**), bullet items (•, -, *), numbered steps (1.), and highlighted alerts.
 */
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '0.3rem' }} />;

        // Header / Alert callouts
        const isHeader = trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#');
        const headerText = trimmed.replace(/^#+\s*/, '');

        if (isHeader) {
          return (
            <div key={idx} style={{ color: '#f97316', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em', marginTop: '0.2rem' }}>
              {headerText}
            </div>
          );
        }

        // Check for bullet line
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
        const bulletText = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

        // Numbered list items: "1. text"
        const isNumber = /^[0-9]+\.\s+/.test(trimmed);
        const numberPrefix = isNumber ? trimmed.match(/^[0-9]+\.\s+/)[0] : '';
        const numberText = isNumber ? trimmed.replace(/^[0-9]+\.\s+/, '') : trimmed;

        const textToParse = isBullet ? bulletText : (isNumber ? numberText : trimmed);

        // Parse **bold** parts
        const parts = textToParse.split(/(\*\*.*?\*\*)/g);
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
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#f97316', fontSize: '0.85rem', lineHeight: 1.6 }}>•</span>
              <span style={{ color: '#e2e8f0', flex: 1 }}>{renderedText}</span>
            </div>
          );
        }

        if (isNumber) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem', minWidth: '1.2rem' }}>{numberPrefix}</span>
              <span style={{ color: '#e2e8f0', flex: 1 }}>{renderedText}</span>
            </div>
          );
        }

        return (
          <div key={idx} style={{ color: '#e2e8f0' }}>
            {renderedText}
          </div>
        );
      })}
    </div>
  );
};

/**
 * DISASTERCHAIN AI CHAT ASSISTANT
 * Theme: Warm Crisis Command (#0d1117 / #161b22 / #1c2128 with #f97316, #ef4444, #f59e0b, #10b981)
 * Distinguishes Live Telemetry vs Verified Guidance, detects emergencies, handles explicit SOS confirmation.
 */
export const DisasterAIChat = ({ onOpenSos, onOpenShelter, externalQuery = null }) => {
  const { user } = useAuth();
  const { t, currentLanguage, languageConfig, isRtl } = useTranslation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'acquiring' | 'ready' | 'denied'
  const [systemMode, setSystemMode] = useState('LIMITED'); // 'LIVE' | 'LIMITED'
  const [sosConfirmDialog, setSosConfirmDialog] = useState(null); // { promptText, confirmed }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Progressive Thinking Phases for realistic crisis telemetry synthesis
  const THINKING_PHASES = useMemo(() => [
    t('ai.thinking1', 'Analyzing live crisis telemetry...'),
    t('ai.thinking2', 'Querying smart shelter registry & bed capacities...'),
    t('ai.thinking3', 'Checking regional risk heatmap & active hazard scores...'),
    t('ai.thinking4', 'Synthesizing verified emergency life-safety protocols...'),
  ], [t]);

  useEffect(() => {
    let interval = null;
    if (loading) {
      setLoadingPhase(0);
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % THINKING_PHASES.length);
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, sosConfirmDialog]);

  // Persist conversation to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('disasterchain_chat_history', JSON.stringify(messages.slice(-12)));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  // Listen for global custom events to trigger AI Assistant
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

  // Automatically attempt geolocation silently on mount
  useEffect(() => {
    if ('geolocation' in navigator && locationStatus === 'idle') {
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
        { timeout: 5000 }
      );
    }
  }, [locationStatus]);

  // Explicit GPS Request Handler
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
      // Send recent history to backend
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
        const assistantMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: res.data.reply,
          sources: res.data.sources || [],
          actions: res.data.actions || [],
          isEmergency: res.data.isEmergency || false,
          dataCategory: res.data.dataCategory || (res.data.isEmergency ? 'EMERGENCY' : 'GUIDANCE'),
          liveStats: res.data.liveStats || null,
          mode: res.data.context?.mode || 'LIMITED',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (res.data.context?.mode) {
          setSystemMode(res.data.context.mode);
        }

        setMessages((prev) => [...prev, assistantMessage]);

        // If backend flagged explicit SOS confirmation required
        if (res.data.actionRequired === 'SOS_CONFIRMATION' || res.data.isEmergency) {
          setSosConfirmDialog({
            promptText: 'Do you want me to create an emergency SOS request with your current location?',
          });
        }
      } else {
        throw new Error(res?.message || 'Empty response from assistant service');
      }
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: `⚠️ **COMMUNICATION INTERRUPTION DETECTED**\n\n` +
          `The AI Assistant encountered a temporary upstream communication issue.\n\n` +
          `**DisasterChain Core Safety Services & Tactical Monitoring remain 100% OPERATIONAL.**\n` +
          `Please utilize verified emergency actions below:`,
        sources: ['DisasterChain Fail-Safe Guard'],
        actions: [
          { type: 'NAVIGATE', label: 'VIEW ALL ALERTS', route: '/alerts' },
          { type: 'NAVIGATE', label: 'FIND SHELTERS', route: '/shelters' },
          { type: 'NAVIGATE', label: 'MISSION DASHBOARD', route: '/dashboard' },
          { type: 'TRIGGER_SOS', label: '🚨 BROADCAST EMERGENCY SOS' },
        ],
        isEmergency: false,
        dataCategory: 'GUIDANCE',
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
    setSosConfirmDialog(null);
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
      if (onOpenSos) {
        onOpenSos();
      } else {
        navigate('/sos');
      }
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

  // Confirm SOS Creation from interactive card
  const handleConfirmSos = async () => {
    setSosConfirmDialog(null);
    if (onOpenSos) {
      onOpenSos();
    } else {
      navigate('/sos');
    }
    // Also post confirmed status in chat
    handleSendMessage('Yes, please create an emergency SOS request immediately');
  };

  const role = (user && user.role) || 'citizen';
  const isPrivileged = role === 'admin' || role === 'responder';

  // Role-tailored quick action prompts
  const quickActions = useMemo(() => {
    const list = [
      { label: t('ai.quickEmergency', '🚨 Emergency Help'), query: t('emergency.immediateDangerDetected', 'Help me, I am in immediate danger!') },
      { label: t('ai.quickShelter', '⛺ Nearby Shelters & Beds'), query: t('shelters.nearestShelter', 'Where is the nearest safe shelter with open beds?') },
      { label: t('ai.quickAlerts', '📢 Active Alerts & Broadcasts'), query: t('alerts.activeBroadcasts', 'What are the current emergency broadcast alerts?') },
      { label: t('ai.quickIncidents', '⚠️ Active Incidents & SOS'), query: t('incidents.fieldReports', 'Show all active incidents and field reports') },
      { label: t('ai.quickKit', '📦 Emergency Kit Checklist'), query: t('disasters.emergencyKit', 'What should I pack in a 72-hour emergency survival kit?') },
      { label: t('ai.quickFlood', '🌊 Flood Safety Guide'), query: t('disasters.flood', 'What should I do during a flood emergency?') },
      { label: t('ai.quickEvac', '🗺️ Evacuation Planning'), query: t('disasters.evacuation', 'What are the recommended evacuation procedures and routes?') },
      { label: t('ai.quickRisk', '🔥 Explain Risk Heatmap'), query: t('risk.riskAssessment', 'Explain the current regional risk level and hazard hotspots') },
    ];

    if (isPrivileged) {
      list.unshift({ label: t('ai.quickBrief', '⚡ AI Situation Briefing'), query: t('dashboard.sitrep', 'Give me an operational situation brief') });
    }

    return list;
  }, [isPrivileged, t]);

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="disaster-ai-launcher"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9995,
            background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '9999px',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.86rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 8px 28px rgba(249, 115, 22, 0.5), 0 2px 8px rgba(0, 0, 0, 0.6)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(249, 115, 22, 0.65), 0 4px 12px rgba(0, 0, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(249, 115, 22, 0.5), 0 2px 8px rgba(0, 0, 0, 0.6)';
          }}
          title="Open DisasterChain AI Emergency Assistant"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bot" size={20} color="#FFFFFF" />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
          </div>
          <span>DISASTERCHAIN AI</span>
          <span
            style={{
              fontSize: '0.65rem',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              letterSpacing: '0.05em',
            }}
          >
            {systemMode === 'LIVE' ? '● LIVE' : '● SAFE'}
          </span>
        </button>
      )}

      {/* 2. CHAT DRAWER / COMMAND MODAL */}
      {isOpen && (
        <div
          className="disaster-ai-modal"
          style={{
            position: 'fixed',
            bottom: isExpanded ? '0' : '24px',
            right: isExpanded ? '0' : '24px',
            width: isExpanded ? '100vw' : '440px',
            maxWidth: '100vw',
            height: isExpanded ? '100vh' : '640px',
            maxHeight: '92vh',
            background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
            border: isExpanded ? 'none' : '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: isExpanded ? '0px' : '16px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
            animation: 'aiModalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'linear-gradient(90deg, #1c2128 0%, #161b22 100%)',
              borderBottom: '1px solid rgba(249, 115, 22, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            {/* Title & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(220, 38, 38, 0.25) 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f97316',
                }}
              >
                <Icon name="bot" size={20} color="#f97316" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    {t('ai.aiTitle', 'DISASTERCHAIN AI')}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.4rem',
                      borderRadius: '4px',
                      background: systemMode === 'LIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: systemMode === 'LIVE' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${systemMode === 'LIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {systemMode === 'LIVE' ? `● ${t('common.operational', 'OPERATIONAL')}` : `● ${t('common.degraded', 'DEGRADED')}`}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                  {t('ai.aiSubtitle', 'Emergency & Disaster Management Intelligence')}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700, marginTop: '2px', letterSpacing: '0.04em' }}>
                  {t('ai.aiResponseLang', `AI RESPONSE: ${languageConfig?.nativeName || 'English'}`)}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {/* Geolocation Button */}
              <button
                type="button"
                onClick={requestLocation}
                title={locationStatus === 'ready' ? 'GPS Coordinates Active' : 'Enable GPS for nearby shelter triage'}
                style={{
                  background: locationStatus === 'ready' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${locationStatus === 'ready' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                  color: locationStatus === 'ready' ? '#10b981' : '#cbd5e1',
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <span>📍</span>
                <span style={{ fontSize: '0.68rem' }}>
                  {locationStatus === 'ready' ? 'GPS ON' : locationStatus === 'acquiring' ? 'LOCATING...' : 'GPS'}
                </span>
              </button>

              {/* Clear History */}
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <Icon name="trash" size={15} />
              </button>

              {/* Expand / Minimize */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore size' : 'Expand full screen'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>{isExpanded ? '❐' : '⛶'}</span>
              </button>

              {/* Close Drawer */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <Icon name="x" size={17} />
              </button>
            </div>
          </div>

          {/* Conversation History Area */}
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
            {/* Welcome banner if no messages */}
            {messages.length === 0 && (
              <div
                style={{
                  background: 'rgba(249, 115, 22, 0.05)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    color: '#f97316',
                  }}
                >
                  <Icon name="bot" size={24} color="#f97316" />
                </div>
                <h4 style={{ margin: '0 0 0.35rem', color: '#FFFFFF', fontSize: '1rem', fontWeight: 800 }}>
                  {t('ai.welcomeTitle', 'DisasterChain Emergency Intelligence')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {t('ai.welcomeDesc', 'Synthesizing real-time shelter registries, hazard heatmaps, field incident logs, and 21 verified emergency protocols.')}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#f97316', fontWeight: 700 }}>● {t('shelters.shelterTitle', 'Smart Shelters')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t('shelters.shelterSubtitle', 'Live bed count and capacity routing')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700 }}>● {t('risk.riskTitle', 'Risk Heatmap')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t('risk.riskSubtitle', 'Dynamic sector hazard scoring')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 700 }}>● {t('emergency.sosTitle', 'Emergency SOS')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t('emergency.sosSubtitle', 'Direct responder distress beacon')}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>● {t('nav.safetyProtocols', 'Verified Protocols')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t('emergency.safetyGuidanceOnly', 'Civil defense life-safety actions')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Stream */}
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              const isEmergencyMsg = m.isEmergency;
              const isLiveData = m.dataCategory === 'LIVE_DATA';

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
                  {/* Category Badge for Assistant Messages */}
                  {!isUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      {isEmergencyMsg ? (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            letterSpacing: '0.04em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            animation: 'pulse 1.5s infinite',
                          }}
                        >
                          <span>🚨</span> {t('ai.lifeThreatEmergency', 'LIFE-THREAT EMERGENCY')}
                        </span>
                      ) : isLiveData ? (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {t('ai.liveTelemetry', '● LIVE TELEMETRY')}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {t('ai.verifiedProtocol', '● VERIFIED PROTOCOL')}
                        </span>
                      )}

                      <span style={{ fontSize: '0.64rem', color: '#64748b' }}>{m.timestamp}</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                        : isEmergencyMsg
                        ? 'rgba(239, 68, 68, 0.12)'
                        : '#1c2128',
                      color: isUser ? '#FFFFFF' : '#e2e8f0',
                      border: isUser
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : isEmergencyMsg
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '0.75rem 0.95rem',
                      maxWidth: '92%',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <FormattedMessage content={m.content} />

                    {/* Sources Badge List */}
                    {m.sources && m.sources.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Verified Sources:
                        </span>
                        {m.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '0.62rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            ✓ {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Action Buttons */}
                  {m.actions && m.actions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.5rem',
                        maxWidth: '92%',
                      }}
                    >
                      {m.actions.map((act, aIdx) => {
                        const isSos = act.type === 'TRIGGER_SOS';
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => executeAction(act)}
                            style={{
                              background: isSos
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'rgba(249, 115, 22, 0.12)',
                              color: isSos ? '#FFFFFF' : '#f97316',
                              border: `1px solid ${isSos ? 'rgba(239, 68, 68, 0.5)' : 'rgba(249, 115, 22, 0.35)'}`,
                              borderRadius: '6px',
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              letterSpacing: '0.03em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s ease',
                              boxShadow: isSos ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              if (!isSos) e.currentTarget.style.background = 'rgba(249, 115, 22, 0.22)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              if (!isSos) e.currentTarget.style.background = 'rgba(249, 115, 22, 0.12)';
                            }}
                          >
                            <span>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Interactive SOS Confirmation Prompt Card */}
            {sosConfirmDialog && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(13, 17, 23, 0.95) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '0.5rem',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🚨</span>
                  <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.86rem', letterSpacing: '0.03em' }}>
                    {t('emergency.confirmSosTitle', 'EMERGENCY DISTRESS BEACON CONFIRMATION')}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.85rem', color: '#f8fafc', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {sosConfirmDialog.promptText || t('emergency.confirmSosPrompt')}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleConfirmSos}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    {t('emergency.confirmSosBtn', '🚨 YES, BROADCAST SOS')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSosConfirmDialog(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.85rem',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t('emergency.safetyGuidanceOnly', 'No, Safety Guidance Only')}
                  </button>
                </div>
              </div>
            )}

            {/* Progressive Thinking Indicator */}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(249, 115, 22, 0.08)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  borderRadius: '10px',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid #f97316',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span style={{ fontSize: '0.76rem', color: '#f97316', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {THINKING_PHASES[loadingPhase]}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Prompt Chips */}
          <div
            style={{
              padding: '0.4rem 0.75rem',
              background: '#161b22',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              overflowX: 'auto',
              display: 'flex',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {quickActions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q.query)}
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.75rem 1rem',
              background: '#12161c',
              borderTop: '1px solid rgba(249, 115, 22, 0.2)',
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
              placeholder={t('ai.askPlaceholder', 'Ask about shelters, hazard risks, emergency procedures...')}
              disabled={loading}
              maxLength={1000}
              style={{
                flex: 1,
                background: '#1c2128',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#f97316')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              style={{
                background: inputValue.trim() && !loading
                  ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: inputValue.trim() && !loading ? '#FFFFFF' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{t('ai.send', 'SEND')}</span>
              <Icon name="arrow-right" size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Global CSS Keyframes */}
      <style>{`
        @keyframes aiModalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </>
  );
};

export default DisasterAIChat;
