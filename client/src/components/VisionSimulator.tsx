import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Volume2,
  Play,
  Square,
  X,
  AlertTriangle,
  Monitor,
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type VisionFilterType =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'cataracts'
  | 'glaucoma';

interface VisionSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisionSimulator: React.FC<VisionSimulatorProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<VisionFilterType>('none');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Screen Reader HUD state
  const [isHudActive, setIsHudActive] = useState(false);
  const [hudSpeechEnabled, setHudSpeechEnabled] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const lastAnnouncementRef = useRef<string>('');
  const hudSpeechEnabledRef = useRef<boolean>(hudSpeechEnabled);

  useEffect(() => {
    hudSpeechEnabledRef.current = hudSpeechEnabled;
  }, [hudSpeechEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Apply visual filter to document body or #main-content
  useEffect(() => {
    const mainEl = document.getElementById('main-content') || document.body;

    // Reset previous filters
    mainEl.style.filter = '';
    const existingTunnel = document.getElementById('glaucoma-tunnel-overlay');
    if (existingTunnel) existingTunnel.remove();

    if (activeFilter === 'none') {
      return;
    }

    if (activeFilter === 'protanopia') {
      mainEl.style.filter = 'url(#protanopia-filter)';
    } else if (activeFilter === 'deuteranopia') {
      mainEl.style.filter = 'url(#deuteranopia-filter)';
    } else if (activeFilter === 'tritanopia') {
      mainEl.style.filter = 'url(#tritanopia-filter)';
    } else if (activeFilter === 'achromatopsia') {
      mainEl.style.filter = 'url(#achromatopsia-filter) grayscale(100%)';
    } else if (activeFilter === 'cataracts') {
      mainEl.style.filter = 'blur(2px) contrast(65%) brightness(115%)';
    } else if (activeFilter === 'glaucoma') {
      mainEl.style.filter = 'contrast(90%)';
      const tunnel = document.createElement('div');
      tunnel.id = 'glaucoma-tunnel-overlay';
      tunnel.style.position = 'fixed';
      tunnel.style.top = '0';
      tunnel.style.left = '0';
      tunnel.style.width = '100vw';
      tunnel.style.height = '100vh';
      tunnel.style.pointerEvents = 'none';
      tunnel.style.zIndex = '99999';
      tunnel.style.background =
        'radial-gradient(circle at center, transparent 15%, rgba(15, 23, 42, 0.85) 45%, rgba(15, 23, 42, 0.98) 75%)';
      document.body.appendChild(tunnel);
    }

    return () => {
      mainEl.style.filter = '';
      const tunnel = document.getElementById('glaucoma-tunnel-overlay');
      if (tunnel) tunnel.remove();
    };
  }, [activeFilter]);

  // Screen Reader HUD Event Listener
  useEffect(() => {
    if (!isHudActive) {
      setAnnouncements([]);
      lastAnnouncementRef.current = '';
      if (synthRef.current && isSpeaking === false) synthRef.current.cancel();
      return;
    }

    const handleInteraction = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!el || el === document.body || el === document.documentElement) return;
      
      if (el.closest('#sr-hud-container') || el.closest('[role="dialog"]')) return;

      const role = el.getAttribute('role') || el.tagName.toLowerCase();
      let name = el.getAttribute('aria-label') || el.getAttribute('alt') || el.title;
      if (!name && el.textContent) {
        name = el.textContent.trim().slice(0, 60).replace(/\s+/g, ' ');
      }
      
      let state = '';
      if (el.hasAttribute('disabled') || (el as any).disabled) state += ' disabled';
      if (el.hasAttribute('aria-expanded')) state += ` expanded:${el.getAttribute('aria-expanded')}`;
      if (el.hasAttribute('aria-checked')) state += ` checked:${el.getAttribute('aria-checked')}`;
      if (el.hasAttribute('aria-selected')) state += ` selected:${el.getAttribute('aria-selected')}`;
      
      let level = '';
      if (/^h[1-6]$/i.test(el.tagName)) {
        level = ` level ${el.tagName.toLowerCase().replace('h', '')}`;
      } else if (el.hasAttribute('aria-level')) {
        level = ` level ${el.getAttribute('aria-level')}`;
      }

      const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
      const announcement = `[${roleCapitalized}${level}]${name ? `: ${name}` : ''}${state ? ` (${state.trim()})` : ''}`;

      if (announcement !== lastAnnouncementRef.current && announcement.trim() !== `[${roleCapitalized}]`) {
        lastAnnouncementRef.current = announcement;
        setAnnouncements(prev => [announcement, ...prev].slice(0, 4));

        // Subtle assistive earcon chime (NVDA / VoiceOver audio cue)
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(role.toLowerCase());
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isInteractive ? 880 : 520, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(isInteractive ? 1174 : 660, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }
        } catch {
          // AudioContext disabled or restricted
        }
        
        if (hudSpeechEnabledRef.current && synthRef.current) {
          synthRef.current.cancel();
          const utterance = new SpeechSynthesisUtterance(announcement);
          utterance.rate = 1.0;
          synthRef.current.speak(utterance);
        }
      }
    };

    document.body.addEventListener('mouseover', handleInteraction, { capture: true });
    document.body.addEventListener('focusin', handleInteraction, { capture: true });

    return () => {
      document.body.removeEventListener('mouseover', handleInteraction, { capture: true });
      document.body.removeEventListener('focusin', handleInteraction, { capture: true });
    };
  }, [isHudActive]);

  // Screen Reader Audio Narration
  const startScreenReaderSimulation = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Gather page elements to speak in order
    const elementsToRead: string[] = [];
    const mainEl = document.getElementById('main-content') || document.body;

    const headings = mainEl.querySelectorAll('h1, h2, h3');
    const buttons = mainEl.querySelectorAll('button:not([aria-hidden="true"])');
    const images = mainEl.querySelectorAll('img');

    elementsToRead.push(
      language === 'kn'
        ? 'ಪರದೆ ಓದುಗ ಸಿಮ್ಯುಲೇಶನ್ ಪ್ರಾರಂಭವಾಗಿದೆ. ಪ್ರವೇಶಿಸುವಿಕೆ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ.'
        : 'Screen Reader simulation active. Inspecting page hierarchy and accessible labels.'
    );

    headings.forEach((h, i) => {
      const level = h.tagName.toLowerCase().replace('h', '');
      const text = h.textContent?.trim();
      if (text && i < 4) {
        elementsToRead.push(`Heading Level ${level}: ${text}`);
      }
    });

    // Check for defective elements to alert the evaluator
    let missingAltCount = 0;
    images.forEach((img) => {
      if (!img.hasAttribute('alt')) {
        missingAltCount++;
      }
    });

    if (missingAltCount > 0) {
      elementsToRead.push(
        `Alert: Detected ${missingAltCount} graphics missing alternative text. GIGW Checkpoint 2.1 violation.`
      );
    }

    buttons.forEach((btn, i) => {
      const text = btn.textContent?.trim() || btn.getAttribute('aria-label');
      if (text && i < 3) {
        elementsToRead.push(`Button: ${text}`);
      }
    });

    elementsToRead.push(
      language === 'kn'
        ? 'ಪುಟದ ಮುಖ್ಯ ವಿಷಯ ಲೋಡ್ ಆಗಿದೆ. ಎಲ್ಲಾ ಸಂವಾದಾತ್ಮಕ ನಿಯಂತ್ರಣಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ.'
        : 'Main region loaded. Interactive controls ready.'
    );

    setIsSpeaking(true);

    // Speak sequentially
    elementsToRead.forEach((phrase) => {
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      synthRef.current?.speak(utterance);
    });
  };

  const stopScreenReaderSimulation = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden SVG Filter Definitions */}
      <svg className="hidden" aria-hidden="true">
        <defs>
          {/* Protanopia: Red deficiency */}
          <filter id="protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0, 0, 0
                      0.558, 0.442, 0, 0, 0
                      0, 0.242, 0.758, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
          {/* Deuteranopia: Green deficiency (most common) */}
          <filter id="deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0, 0, 0
                      0.7, 0.3, 0, 0, 0
                      0, 0.3, 0.7, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
          {/* Tritanopia: Blue deficiency */}
          <filter id="tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05, 0, 0, 0
                      0, 0.433, 0.567, 0, 0
                      0, 0.475, 0.525, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
          {/* Achromatopsia: Complete color blindness */}
          <filter id="achromatopsia-filter">
            <feColorMatrix
              type="matrix"
              values="0.299, 0.587, 0.114, 0, 0
                      0.299, 0.587, 0.114, 0, 0
                      0.299, 0.587, 0.114, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Floating Simulation Panel */}
      <div
        className="fixed top-20 right-4 sm:right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-2xl text-white rounded-2xl shadow-2xl border border-slate-700/80 p-5 animate-in fade-in slide-in-from-top-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulator-heading"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Eye size={18} />
            </div>
            <div>
              <h2 id="simulator-heading" className="text-sm font-bold text-white">
                {language === 'kn' ? 'ನಾಗರಿಕ ದೃಷ್ಟಿ ಸಿಮ್ಯುಲೇಟರ್' : 'Citizen Vision Simulator'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'kn'
                  ? 'ವಿವಿಧ ದೃಷ್ಟಿ ವಿಕಲಾಂಗತೆಯೊಂದಿಗೆ ಅನುಭವಿಸಿ'
                  : 'Experience the web as citizens with disabilities'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close simulator"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Active Filter Indicator */}
          {activeFilter !== 'none' && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Simulation Active: {activeFilter.toUpperCase()}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveFilter('none')}
                className="text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700"
              >
                Reset
              </button>
            </div>
          )}

          {/* Color Blindness Filters */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Color Vision Deficiency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Normal Vision', desc: 'Default' },
                { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-Blind (6%)' },
                { id: 'protanopia', label: 'Protanopia', desc: 'Red-Blind (1%)' },
                { id: 'tritanopia', label: 'Tritanopia', desc: 'Blue-Blind (Rare)' },
                { id: 'achromatopsia', label: 'Achromatopsia', desc: 'Monochrome (0.003%)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveFilter(item.id as VisionFilterType)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    activeFilter === item.id
                      ? 'bg-primary-600 text-white border-primary-400 shadow-md ring-2 ring-primary-400/50'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-400 opacity-90">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Low Vision & Glaucoma */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Visual Impairments
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('cataracts')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  activeFilter === 'cataracts'
                    ? 'bg-primary-600 text-white border-primary-400 shadow-md ring-2 ring-primary-400/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">Cataracts / Blur</div>
                <div className="text-[10px] text-slate-400 opacity-90">Clouded lens & glare</div>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('glaucoma')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  activeFilter === 'glaucoma'
                    ? 'bg-primary-600 text-white border-primary-400 shadow-md ring-2 ring-primary-400/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">Tunnel Vision</div>
                <div className="text-[10px] text-slate-400 opacity-90">Glaucoma perimeter loss</div>
              </button>
            </div>
          </div>

          {/* Audio Screen Reader Simulation */}
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-white">Audio Screen Reader (NVDA / JAWS)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Web Speech
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Audibly announces page hierarchy, landmarks, and highlights accessibility violations.
            </p>
            <div className="flex items-center gap-2 mb-3">
              {!isSpeaking ? (
                <button
                  type="button"
                  onClick={startScreenReaderSimulation}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play size={13} fill="currentColor" /> Play Screen Reader
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScreenReaderSimulation}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Square size={13} fill="currentColor" /> Stop Narration
                </button>
              )}
            </div>

            <div className="border-t border-slate-700/80 pt-3">
              <button
                type="button"
                onClick={() => setIsHudActive(!isHudActive)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all ${
                  isHudActive 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <Monitor size={13} /> {isHudActive ? 'Disable Screen Reader HUD' : 'Enable Screen Reader HUD'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Reader HUD Overlay */}
      {isHudActive && (
        <div 
          id="sr-hud-container"
          className="fixed bottom-0 left-0 w-full h-[120px] bg-black/90 backdrop-blur-md border-t-2 border-emerald-500/50 z-[999999] p-4 font-mono flex flex-col pointer-events-none"
        >
          <div className="flex items-center justify-between mb-2 pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-sm font-bold tracking-tight">🔊 Screen Reader Output (NVDA Simulation)</span>
            </div>
            <button
              onClick={() => setHudSpeechEnabled(!hudSpeechEnabled)}
              className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-600"
              aria-label={hudSpeechEnabled ? 'Disable HUD Speech' : 'Enable HUD Speech'}
            >
              {hudSpeechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {hudSpeechEnabled ? 'Speech ON' : 'Speech OFF'}
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col-reverse justify-start">
            {announcements.map((ann, idx) => (
              <div 
                key={`${ann}-${idx}`}
                className={`truncate ${idx === 0 ? 'text-white text-base font-bold' : 'text-slate-400 text-xs mt-1'}`}
                style={{ opacity: idx === 0 ? 1 : 1 - (idx * 0.25) }}
              >
                {ann}
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-slate-500 text-sm italic">Hover or focus elements to inspect...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
