import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  BarChart3,
  Globe,
  Wrench,
  GitCompare,
  
  Sparkles,

  Eye,
  Languages,
  FileText,
} from 'lucide-react';
import { QuickAuditModal } from './QuickAuditModal';
import { ToastProvider } from './Toast';
import { useLanguage } from '../context/LanguageContext';
import { VisionSimulator } from './VisionSimulator';

export default function Layout() {
  const { language, toggleLanguage, t } = useLanguage();
  const [quickAuditOpen, setQuickAuditOpen] = useState(false);
  const [visionSimOpen, setVisionSimOpen] = useState(false);

  const navItems = [
    { to: '/', label: t('navDashboard'), icon: BarChart3 },
    { to: '/sites', label: t('navSites'), icon: Globe },
    { to: '/remediations', label: t('navRemediations'), icon: Wrench },
    { to: '/compare', label: t('navCompare'), icon: GitCompare },

    { to: '/executive-brief', label: t('navExecutiveBrief'), icon: FileText },
  ];

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const activeEl = document.activeElement;
        if (activeEl) {
          const tagName = activeEl.tagName.toLowerCase();
          if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
            return; // don't trigger if user is typing
          }
        }
        e.preventDefault();
        setQuickAuditOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50/90 text-slate-800 flex flex-col font-sans relative overflow-x-hidden">
        {/* Ambient Gradient Glows in Background */}
        <div className="ambient-glow w-[550px] h-[550px] bg-blue-400/20 -top-32 -left-20 pointer-events-none"></div>
        <div className="ambient-glow w-[500px] h-[500px] bg-indigo-400/15 top-40 right-0 pointer-events-none"></div>
        <div className="ambient-glow w-[600px] h-[600px] bg-emerald-400/15 bottom-40 left-1/3 pointer-events-none"></div>

        {/* Skip to main content — accessibility dogfooding */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Header — Clean Luminous Government Tech Navigation */}
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/90 shadow-2xs print:hidden transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-15">
              {/* Brand Identity */}
              <Link
                to="/"
                className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-slate-900 rounded-lg py-1 px-1 -ml-1 transition-colors"
                aria-label="AccessIQ Home"
              >
                <img src="/logo.png" alt="AccessIQ" className="h-8 object-contain" />
              </Link>

              {/* Navigation Tabs */}
              <nav aria-label="Main navigation" className="hidden md:flex items-center">
                <ul className="flex items-center gap-0.5 p-1 bg-slate-100/70 border border-slate-200/60 rounded-xl">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                          `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`
                        }
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Actions & Utilities Strip */}
              <div className="flex items-center gap-2">
                {/* Mobile Navigation Icons */}
                <nav aria-label="Mobile navigation" className="flex md:hidden items-center gap-1">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      aria-label={label}
                      className={({ isActive }) =>
                        `p-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </NavLink>
                  ))}
                </nav>

                <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

                {/* Citizen Vision Simulator Toggle */}
                <button
                  type="button"
                  onClick={() => setVisionSimOpen(!visionSimOpen)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                    visionSimOpen
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  aria-label="Toggle Citizen Vision Simulator"
                  title="Citizen Vision & Audio Simulator"
                >
                  <Eye size={13} className={visionSimOpen ? 'text-indigo-600' : 'text-slate-500'} />
                  <span className="hidden lg:inline">Vision Sim</span>
                </button>

                {/* Bilingual Language Switcher */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900"
                  aria-label={`Switch language. Current: ${language === 'en' ? 'English' : 'Kannada'}`}
                  title="Switch Language (ಕನ್ನಡ / English)"
                >
                  <Languages size={13} className="text-slate-500" />
                  <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
                </button>

                {/* Quick Audit Button */}
                <button
                  type="button"
                  onClick={() => setQuickAuditOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/30 active:scale-[0.98]"
                  aria-label="Open Quick Audit modal (Shortcut: Command K)"
                >
                  <Sparkles size={13} className="text-emerald-400" />
                  <span className="hidden sm:inline">{t('quickAudit')}</span>
                  <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-slate-300 bg-slate-800 px-1 py-0.5 rounded border border-slate-700">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Landmark */}
        <main id="main-content" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 relative z-10">
          <Outlet />
        </main>

        {/* Footer Landmark — Clean & Modern */}
        <footer className="bg-white/80 backdrop-blur-md text-slate-600 py-6 mt-auto border-t border-slate-200/90 print:hidden relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p className="flex items-center gap-2">
              <img src="/logo.png" alt="AccessIQ" className="h-4 object-contain" />
              <span>• Digital Inclusion & Compliance Platform</span>
            </p>
            <p className="text-slate-600">Conforms to WCAG 2.2 Level AA & Indian Government Guidelines (GIGW 3.0)</p>
          </div>
        </footer>

        {/* Global Quick Audit Modal */}
        <QuickAuditModal isOpen={quickAuditOpen} onClose={() => setQuickAuditOpen(false)} />

        {/* Citizen Vision & Audio Simulator Floating Tool */}
        <VisionSimulator isOpen={visionSimOpen} onClose={() => setVisionSimOpen(false)} />
      </div>
    </ToastProvider>
  );
}
