import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

/**
 * DISASTERCHAIN LANGUAGE SELECTOR
 * Warm Crisis Command design with searchable list, keyboard navigation,
 * native script display, and accessibility support.
 */
const LanguageSelector = ({ compact = false }) => {
  const { currentLanguage, setLanguage, languages, languageConfig, t, isRtl } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Filter languages by English or native script
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

  return (
    <div
      ref={dropdownRef}
      className="language-selector-container"
      style={{
        position: 'relative',
        display: 'inline-block',
        fontFamily: 'inherit',
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.language', 'Language')}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: compact ? '0.35rem 0.55rem' : '0.4rem 0.75rem',
          background: isOpen ? 'rgba(255, 107, 44, 0.16)' : 'rgba(38, 21, 15, 0.85)',
          border: `1px solid ${isOpen ? 'var(--primary)' : 'rgba(255, 138, 61, 0.25)'}`,
          color: '#ffffff',
          borderRadius: 'var(--radius-sm, 8px)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        <span style={{ fontSize: '0.95rem' }} role="img" aria-hidden="true">🌐</span>
        <span style={{ letterSpacing: '0.02em' }}>
          {compact ? languageConfig?.code.toUpperCase() : languageConfig?.nativeName || 'English'}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            opacity: 0.7,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          ▼
        </span>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Supported Languages"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: isRtl ? 'auto' : 0,
            left: isRtl ? 0 : 'auto',
            width: '240px',
            maxHeight: '360px',
            background: 'linear-gradient(180deg, #1C110D 0%, #120B08 100%)',
            border: '1px solid rgba(255, 107, 44, 0.4)',
            borderRadius: '12px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'langFadeIn 0.15s ease-out',
          }}
        >
          {/* Header & Search Filter */}
          <div
            style={{
              padding: '0.65rem 0.75rem',
              borderBottom: '1px solid rgba(255, 138, 61, 0.2)',
              background: 'rgba(38, 21, 15, 0.75)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--primary, #FF6B2C)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.4rem',
              }}
            >
              <span>🌐</span>
              <span>{t('common.language', 'Select Language')} (20)</span>
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.searchLanguage', 'Search language...')}
              style={{
                width: '100%',
                background: 'rgba(18, 11, 8, 0.95)',
                border: '1px solid rgba(255, 138, 61, 0.3)',
                borderRadius: '6px',
                padding: '0.35rem 0.6rem',
                color: '#ffffff',
                fontSize: '0.78rem',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 138, 61, 0.3)')}
            />
          </div>

          {/* Languages List */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '270px',
              padding: '0.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
            }}
          >
            {filteredLanguages.length === 0 ? (
              <div
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
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
                      padding: '0.45rem 0.65rem',
                      background: isSelected ? 'rgba(255, 107, 44, 0.18)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255, 107, 44, 0.4)' : '1px solid transparent',
                      borderRadius: '6px',
                      color: isSelected ? '#FFFFFF' : 'var(--text-primary, #FFF7ED)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: lang.isRtl ? 'right' : 'left',
                      transition: 'all 0.12s ease',
                      fontFamily: lang.fontFamily || 'inherit',
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
                      <span style={{ fontWeight: isSelected ? 700 : 500 }}>{lang.nativeName}</span>
                      {lang.code !== 'en' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #B9A495)', opacity: 0.8 }}>
                          ({lang.name})
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span style={{ color: 'var(--primary, #FF6B2C)', fontWeight: 800, fontSize: '0.85rem' }}>✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Scoped CSS Keyframe */}
      <style>{`
        @keyframes langFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
