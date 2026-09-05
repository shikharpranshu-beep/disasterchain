import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from '../i18n/i18n';

/**
 * DISASTERCHAIN LANGUAGE SELECTOR
 * Warm Crisis Command design with searchable 20-language list,
 * touch-friendly 44px minimum touch targets, portal rendering to prevent clipping,
 * safe viewport bounds, keyboard navigation, and localStorage persistence.
 */
const LanguageSelector = ({ compact = false, className = '' }) => {
  const { currentLanguage, setLanguage, languages, languageConfig, t, isRtl } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 260, maxHeight: 360 });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Calculate position relative to trigger button and clamp within viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = Math.min(270, window.innerWidth - 16);

    // Horizontal placement: align with trigger, clamp to screen margins (8px)
    let left;
    if (isRtl) {
      left = Math.max(8, Math.min(rect.left, window.innerWidth - dropdownWidth - 8));
    } else {
      left = Math.max(8, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 8));
    }

    // Vertical placement: place below if room, otherwise flip above
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    let top;
    let maxHeight;

    if (spaceBelow >= 220 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
      maxHeight = Math.min(360, Math.max(160, spaceBelow));
    } else {
      maxHeight = Math.min(360, Math.max(160, spaceAbove));
      top = Math.max(8, rect.top - maxHeight - 6);
    }

    setDropdownPos({ top, left, width: dropdownWidth, maxHeight });
  }, [isRtl]);

  // Open & update position
  const toggleDropdown = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close dropdown on click/touch outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleOutsideInteraction = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Listen on pointerdown, touchstart and mousedown for robust mobile & desktop dismissal
    document.addEventListener('pointerdown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter 20 languages by English or native script
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const q = searchQuery.toLowerCase().trim();
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [languages, searchQuery]);

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // Safe portal dropdown content
  const dropdownContent = isOpen && typeof document !== 'undefined' && (
    <div
      ref={dropdownRef}
      role="listbox"
      id="disasterchain-language-dropdown"
      aria-label="Supported Languages (20)"
      className="language-selector-portal"
      style={{
        position: 'fixed',
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
        maxHeight: `${dropdownPos.maxHeight}px`,
        background: 'linear-gradient(180deg, #1C110D 0%, #120B08 100%)',
        border: '1px solid rgba(255, 107, 44, 0.4)',
        borderRadius: '12px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'langFadeIn 0.15s ease-out',
        boxSizing: 'border-box',
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Header & Search Filter */}
      <div
        style={{
          padding: '0.65rem 0.75rem',
          borderBottom: '1px solid rgba(255, 138, 61, 0.2)',
          background: 'rgba(38, 21, 15, 0.85)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.4rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--primary, #FF6B2C)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🌐</span>
            <span>{t('common.language', 'Select Language')} (20)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close language selector"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #B9A495)',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('common.searchLanguage', 'Search 20 languages...')}
          aria-label="Filter languages"
          style={{
            width: '100%',
            background: 'rgba(18, 11, 8, 0.95)',
            border: '1px solid rgba(255, 138, 61, 0.3)',
            borderRadius: '6px',
            padding: '0.45rem 0.65rem',
            color: '#ffffff',
            fontSize: '0.82rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 138, 61, 0.3)')}
        />
      </div>

      {/* Languages List: Minimum 44px touch targets per option */}
      <div
        className="language-options-scroll"
        style={{
          overflowY: 'auto',
          flex: 1,
          minHeight: 0, // Critical: Allows flex child to shrink and scroll within maxHeight
          padding: '0.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {filteredLanguages.length === 0 ? (
          <div
            style={{
              padding: '1.25rem 0.75rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted, #B9A495)',
            }}
          >
            No languages match "{searchQuery}"
          </div>
        ) : (
          filteredLanguages.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  minHeight: '44px', // Touch-friendly 44px target
                  background: isSelected ? 'rgba(255, 107, 44, 0.18)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255, 107, 44, 0.45)' : '1px solid transparent',
                  borderRadius: '6px',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary, #FFF7ED)',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: lang.isRtl ? 'right' : 'left',
                  transition: 'background 0.12s ease',
                  fontFamily: lang.fontFamily || 'inherit',
                  boxSizing: 'border-box',
                  touchAction: 'manipulation',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem' }}>
                    {lang.nativeName}
                  </span>
                  {lang.code !== 'en' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #B9A495)', opacity: 0.85 }}>
                      ({lang.name})
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span style={{ color: 'var(--primary, #FF6B2C)', fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`language-selector-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        fontFamily: 'inherit',
        verticalAlign: 'middle',
      }}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id="disasterchain-lang-btn"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.language', 'Language')}
        className="btn btn-secondary btn-sm language-selector-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          minHeight: '40px',
          padding: '0.35rem 0.65rem',
          background: isOpen ? 'rgba(255, 107, 44, 0.18)' : 'rgba(38, 21, 15, 0.85)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'rgba(255, 138, 61, 0.28)'}`,
          color: '#ffffff',
          borderRadius: 'var(--radius-sm, 8px)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxSizing: 'border-box',
          touchAction: 'manipulation',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.95rem' }} role="img" aria-hidden="true">🌐</span>
        <span className="lang-label-full" style={{ letterSpacing: '0.02em' }}>
          {languageConfig?.nativeName || 'English'}
        </span>
        <span className="lang-label-compact" style={{ letterSpacing: '0.02em', display: compact ? 'inline' : undefined }}>
          {languageConfig?.code?.toUpperCase() || 'EN'}
        </span>
        <span
          style={{
            fontSize: '0.62rem',
            opacity: 0.7,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Render popover safely to document.body portal */}
      {dropdownContent && ReactDOM.createPortal(dropdownContent, document.body)}

      {/* Scoped CSS */}
      <style>{`
        @keyframes langFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lang-label-compact {
          display: ${compact ? 'inline' : 'none'};
        }
        .lang-label-full {
          display: ${compact ? 'none' : 'inline'};
        }
        @media (max-width: 1199px) {
          .lang-label-full {
            display: none !important;
          }
          .lang-label-compact {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
