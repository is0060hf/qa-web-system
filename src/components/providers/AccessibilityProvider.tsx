'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string) => void;
  highContrastMode: boolean;
  toggleHighContrastMode: () => void;
  fontSize: 'normal' | 'large' | 'larger';
  setFontSize: (size: 'normal' | 'large' | 'larger') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');
  
  // This element will be used for screen reader announcements
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announceToScreenReader = (message: string) => {
    setAnnouncements((prev) => [...prev, message]);
    // Clean up old announcements after they've been read
    setTimeout(() => {
      setAnnouncements((prev) => prev.slice(1));
    }, 3000);
  };

  const toggleHighContrastMode = () => {
    setHighContrastMode((prev) => !prev);
    document.documentElement.classList.toggle('high-contrast-mode');
  };

  // Add global styles for focus visibility
  React.useEffect(() => {
    // Add a class to the body to detect if user is using keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-user');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Add global styles for keyboard focus
    const style = document.createElement('style');
    style.innerHTML = `
      .keyboard-user :focus {
        outline: 2px solid #4f46e5 !important;
        outline-offset: 2px !important;
      }
      
      .high-contrast-mode {
        filter: contrast(1.5);
      }
      
      .skip-to-content {
        position: absolute;
        left: -9999px;
        top: 16px;
        z-index: 9999;
        padding: 8px 16px;
        background: white;
        border: 2px solid #4f46e5;
        color: #4f46e5;
        text-decoration: none;
        font-weight: bold;
      }
      
      .skip-to-content:focus {
        left: 16px;
      }
      
      body.font-size-large {
        font-size: 1.1rem;
      }
      
      body.font-size-larger {
        font-size: 1.2rem;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.head.removeChild(style);
    };
  }, []);

  // Apply font size changes
  React.useEffect(() => {
    document.body.classList.remove('font-size-large', 'font-size-larger');
    if (fontSize === 'large') {
      document.body.classList.add('font-size-large');
    } else if (fontSize === 'larger') {
      document.body.classList.add('font-size-larger');
    }
  }, [fontSize]);

  return (
    <AccessibilityContext.Provider
      value={{
        announceToScreenReader,
        highContrastMode,
        toggleHighContrastMode,
        fontSize,
        setFontSize,
      }}
    >
      {/* Skip to content link */}
      <a href="#main-content" className="skip-to-content">
        コンテンツにスキップ
      </a>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {announcements.map((announcement, index) => (
          <div key={`${announcement}-${index}`}>{announcement}</div>
        ))}
      </div>

      {children}
    </AccessibilityContext.Provider>
  );
}; 