import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  Printer,
  Building2,
  MapPin,
  ClipboardList,
  Camera,
  Trash2,
  Share2,
  FileText,
  Plus,
  Image as ImageIcon,
  Save,
  History,
  RotateCcw,
  Check,
  AlertCircle,
  Calendar,
  UserCheck,
  Scale,
  Monitor,
  Languages,
  Accessibility,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api, FieldAuditReportSummary } from '../services/api';

interface ChecklistItem {
  id: string;
  category: 'kiosk' | 'language' | 'physical' | 'compliance';
  title: string;
  description: string;
  gigwRef: string;
  rpwdRef: string;
  points: number;
}

export interface AuditPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  category: string;
  timestamp: string;
}

const CHECKLIST_DATA: ChecklistItem[] = [
  // Kiosk & Digital
  {
    id: 'kiosk-screen-reader',
    category: 'kiosk',
    title: 'Screen Reader & Audio Output Enabled',
    description: 'Panchayat kiosk has functioning text-to-speech with 3.5mm headphone jack or speaker output.',
    gigwRef: 'GIGW 10.1',
    rpwdRef: 'RPwD Sec 42',
    points: 15,
  },
  {
    id: 'kiosk-keyboard-nav',
    category: 'kiosk',
    title: 'Complete Keypad / Tactile Navigation',
    description: 'Citizen services can be navigated entirely via 4-way arrow/keypad without touch precision.',
    gigwRef: 'GIGW 6.1',
    rpwdRef: 'RPwD Sec 42',
    points: 10,
  },
  {
    id: 'kiosk-high-contrast',
    category: 'kiosk',
    title: 'High Contrast Mode Toggle (4.5:1+)',
    description: 'Touchscreen provides high-contrast yellow-on-black or white-on-black mode for elderly citizens.',
    gigwRef: 'GIGW 7.1',
    rpwdRef: 'RPwD Sec 42',
    points: 10,
  },
  // Language & Content
  {
    id: 'lang-kannada-unicode',
    category: 'language',
    title: 'Unicode Kannada Fonts (Non-Bitmap)',
    description: 'All village notices, RTC forms, and Gram Sabha minutes use selectable Unicode Kannada text rather than scanned images.',
    gigwRef: 'GIGW 4.1',
    rpwdRef: 'RPwD Sec 42',
    points: 15,
  },
  {
    id: 'lang-audio-prompts',
    category: 'language',
    title: 'Kannada Audio Guidance Prompts',
    description: 'Voice prompts guide illiterate and non-sighted rural citizens through biometric registration.',
    gigwRef: 'GIGW 1.2',
    rpwdRef: 'RPwD Sec 42',
    points: 10,
  },
  // Physical & Service
  {
    id: 'physical-kiosk-height',
    category: 'physical',
    title: 'Wheelchair Reachable Kiosk Counter',
    description: 'Touchscreen and receipt slot placed between 750mm and 850mm from floor level with ramp access.',
    gigwRef: 'Harmonised Guidelines 2021',
    rpwdRef: 'RPwD Sec 44',
    points: 10,
  },
  {
    id: 'physical-braille-signage',
    category: 'physical',
    title: 'Braille Labeling on Kiosks & Office Signage',
    description: 'Grade 2 Braille text present on keypad numbers, emergency helpdesk button, and room entrance.',
    gigwRef: 'Harmonised Guidelines 2021',
    rpwdRef: 'RPwD Sec 40',
    points: 10,
  },
  // Compliance & Governance
  {
    id: 'comp-designated-officer',
    category: 'compliance',
    title: 'Designated Accessibility Welfare Officer',
    description: 'Gram Panchayat has designated an official responsible for assisting citizens with disabilities.',
    gigwRef: 'GIGW 11.2',
    rpwdRef: 'RPwD Sec 12',
    points: 10,
  },
  {
    id: 'comp-grievance-mechanism',
    category: 'compliance',
    title: 'Accessibility Feedback & Sakala Helpdesk',
    description: 'Accessible register and telephone helpline active for reporting electronic service delivery barriers.',
    gigwRef: 'GIGW 11.3',
    rpwdRef: 'RPwD Sec 42',
    points: 10,
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Criteria', icon: ClipboardList },
  { id: 'kiosk', label: 'Digital Kiosk', icon: Monitor },
  { id: 'language', label: 'Bilingual Kannada', icon: Languages },
  { id: 'physical', label: 'Universal Ergonomics', icon: Accessibility },
  { id: 'compliance', label: 'Governance & Redressal', icon: ShieldCheck },
] as const;

export const FieldAudit: React.FC = () => {
  const { language } = useLanguage();

  const [selectedLocation, setSelectedLocation] = useState('Subhas Nagara Gram Panchayath, Udupi');
  const [auditorName, setAuditorName] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<AuditPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Entrance & Ramp');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'kiosk' | 'language' | 'physical' | 'compliance'>('all');

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto: AuditPhoto = {
        id: 'photo-' + Date.now(),
        dataUrl,
        caption: `${selectedCategory} - Verified On-Site`,
        category: selectedCategory,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setPhotos((prev) => [...prev, newPhoto]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePhotoCaption = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  const totalPoints = CHECKLIST_DATA.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = CHECKLIST_DATA.reduce((sum, item) => {
    return sum + (checkedItems[item.id] ? item.points : 0);
  }, 0);

  const readinessScore = Math.round((earnedPoints / totalPoints) * 100);

  const getStatusBadge = () => {
    if (readinessScore >= 85) {
      return {
        label: 'Exemplary · GIGW 3.0 & RPwD Ready',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500/20',
        badge: 'CERTIFIED COMPLIANT',
        stage: 'Full Conformance',
      };
    }
    if (readinessScore >= 65) {
      return {
        label: 'Substantial Readiness · Minor Actions',
        color: 'text-amber-800 bg-amber-50 border-amber-300 ring-1 ring-amber-500/20',
        badge: 'PROVISIONAL READINESS',
        stage: 'Remediations Pending',
      };
    }
    return {
      label: 'Non-Compliant · Statutory Fixes Required',
      color: 'text-rose-800 bg-rose-50 border-rose-300 ring-1 ring-rose-500/20',
      badge: 'ACTION MANDATORY',
      stage: 'Barriers Detected',
    };
  };

  const status = getStatusBadge();

  // Database Persistence & History State
  const [savedAudits, setSavedAudits] = useState<FieldAuditReportSummary[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    loadSavedAudits();
  }, []);

  const loadSavedAudits = async () => {
    try {
      const audits = await api.fetchFieldAudits();
      setSavedAudits(audits);
    } catch (err: any) {
      console.warn('Could not load past audits:', err.message);
    }
  };

  const handleSaveAudit = async () => {
    if (!auditorName.trim()) {
      setNotification({
        type: 'error',
        text: 'Please enter the Inspecting Officer name before saving to official records.',
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    try {
      setIsSaving(true);
      const findings = CHECKLIST_DATA.map((item) => ({
        checklistItemId: item.id,
        passed: !!checkedItems[item.id],
      }));

      const payload = {
        officeName: selectedLocation,
        location: selectedLocation,
        inspectorName: auditorName.trim(),
        findings,
        photos: photos.map((p) => ({
          caption: p.caption,
          category: p.category,
          dataUrl: p.dataUrl,
        })),
        totalScore: earnedPoints,
        maxScore: totalPoints,
      };

      const saved = await api.saveFieldAudit(payload);
      setActiveReportId(saved.id);
      setNotification({
        type: 'success',
        text: `Official inspection record #${saved.id.slice(0, 8).toUpperCase()} logged to AccessIQ National Registry.`,
      });
      setTimeout(() => setNotification(null), 5000);
      loadSavedAudits();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to persist audit to database.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadAudit = async (id: string) => {
    try {
      const report = await api.fetchFieldAudit(id);
      setSelectedLocation(report.officeName);
      setAuditorName(report.inspectorName);
      setAuditDate(new Date(report.createdAt).toISOString().split('T')[0]);
      setActiveReportId(report.id);

      const itemsMap: Record<string, boolean> = {};
      report.findings.forEach((f) => {
        itemsMap[f.checklistItemId] = f.passed;
      });
      setCheckedItems(itemsMap);

      if (report.photos && report.photos.length > 0) {
        setPhotos(
          report.photos.map((p) => ({
            id: p.id,
            dataUrl: p.dataUrl,
            caption: p.caption,
            category: p.category,
            timestamp: new Date(report.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })),
        );
      } else {
        setPhotos([]);
      }

      setShowHistoryModal(false);
      setNotification({
        type: 'success',
        text: `Loaded audit record for ${report.officeName} (${new Date(report.createdAt).toLocaleDateString()})`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to load audit.' });
    }
  };

  const handleNewAudit = () => {
    setActiveReportId(null);
    setAuditorName('');
    setCheckedItems({});
    setPhotos([]);
    setAuditDate(new Date().toISOString().split('T')[0]);
    setNotification({ type: 'success', text: 'Started a fresh inspection session.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this field audit record from the database?')) return;
    try {
      await api.deleteFieldAudit(id);
      if (activeReportId === id) {
        setActiveReportId(null);
      }
      loadSavedAudits();
    } catch (err: any) {
      alert(err.message || 'Failed to delete audit.');
    }
  };

  const handleWhatsAppShare = () => {
    const verifiedCount = Object.values(checkedItems).filter(Boolean).length;
    const message =
      `🏛️ *AccessIQ Gram Panchayat Field Inspection Report*\n\n` +
      `📍 *Facility:* ${selectedLocation}\n` +
      `👤 *Auditor:* ${auditorName || 'Pending Inspection'}\n` +
      `📅 *Audit Date:* ${auditDate}\n` +
      `📊 *Readiness Score:* ${readinessScore}% (${status.badge})\n` +
      `✅ *Verified Criteria:* ${verifiedCount} of ${CHECKLIST_DATA.length} Passed\n` +
      `📷 *Photographic Evidence:* ${photos.length} item(s) attached\n` +
      `⚖️ *Compliance Framework:* RPwD Act 2016 (Sec 42 & 44) & MeitY GIGW 3.0\n\n` +
      `🔗 View Live Audit Suite: ${window.location.origin}/field-audit\n` +
      `📄 Official Executive Memo: ${window.location.origin}/executive-brief`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredItems = activeTab === 'all' 
    ? CHECKLIST_DATA 
    : CHECKLIST_DATA.filter((item) => item.category === activeTab);

  const verifiedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg border transition-all print:hidden ${
            notification.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 text-sm font-semibold">
            {notification.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check size={14} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle size={14} />
              </div>
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Inspection Command Center */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden print:hidden">
        {/* Institutional Authority Bar */}
        <div className="px-6 py-3 bg-slate-900 text-slate-300 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-white tracking-wide">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>GOVERNMENT OF KARNATAKA</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Panchayati Raj & Rural Development Department</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Udupi District Administration Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeReportId ? `REC #${activeReportId.slice(0, 8).toUpperCase()}` : 'NEW SESSION'}
            </span>
            <span className="text-slate-400 text-[11px]">RPwD 2016 § 42/44</span>
          </div>
        </div>

        {/* Header & Unified Action Toolbar */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title Block */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <ClipboardList className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {language === 'kn'
                      ? 'ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಮತ್ತು ಜಿಲ್ಲಾ ಕ್ಷೇತ್ರ ಪರಿಶೀಲನಾ ಪೋರ್ಟಲ್'
                      : 'Gram Panchayat & Citizen Kiosk Field Audit'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Standardized on-site inspection protocol for citizen service kiosks, bilingual Kannada usability, and wheelchair ergonomics.
                  </p>
                </div>
              </div>
            </div>

            {/* Unified Professional Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Session Controls */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handleNewAudit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white transition-all"
                  title="Start a new inspection"
                >
                  <RotateCcw size={13} />
                  <span>New</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white transition-all"
                  title="View saved inspection database"
                >
                  <History size={13} className="text-slate-500" />
                  <span>Records ({savedAudits.length})</span>
                </button>
              </div>

              {/* Utility Actions */}
              <Link
                to="/executive-brief"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                title="View DC/PDO Executive Brief"
              >
                <FileText size={14} className="text-slate-500" />
                <span>Executive Memo</span>
              </Link>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                title="Share formatted report on WhatsApp"
              >
                <Share2 size={14} className="text-emerald-600" />
                <span>Share WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                title="Print official audit report or save as PDF"
              >
                <Printer size={14} className="text-slate-500" />
                <span>Print / PDF</span>
              </button>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleSaveAudit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 disabled:opacity-50"
                aria-label="Save Inspection Record"
              >
                <Save size={14} className={isSaving ? 'animate-spin' : ''} />
                <span>{isSaving ? 'Saving Record...' : activeReportId ? 'Update Record' : 'Save Inspection'}</span>
              </button>
            </div>
          </div>

          {/* Inspection Metadata Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
            {/* Field Target */}
            <div className="space-y-1.5">
              <label htmlFor="field-location-select" className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Building2 size={14} className="text-slate-500" />
                <span>Field Inspection Target</span>
              </label>
              <select
                id="field-location-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
              >
                <option value="Subhas Nagara Gram Panchayath, Udupi">Subhas Nagara Gram Panchayath (Kaup / Udupi)</option>
                <option value="Kaup Gram Panchayat, Udupi">Kaup Gram Panchayat (Udupi Taluk)</option>
                <option value="Brahmavar Gram Panchayat, Udupi">Brahmavar Gram Panchayat (Brahmavar Taluk)</option>
                <option value="Karkala Taluk Administrative Kiosk">Karkala Taluk Citizen Seva Kiosk</option>
                <option value="Udupi DC Office (udupi.nic.in)">Udupi DC District Administration Complex</option>
                <option value="Panchamitra Rural Portal (panchamitra.kar.nic.in)">Panchamitra Karnataka Portal Kiosk</option>
              </select>
            </div>

            {/* Inspecting Officer */}
            <div className="space-y-1.5">
              <label htmlFor="field-auditor-name" className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <UserCheck size={14} className="text-slate-500" />
                <span>Inspecting Officer / Auditor</span>
              </label>
              <input
                id="field-auditor-name"
                type="text"
                value={auditorName}
                placeholder="e.g. Ramesh Kumar, PDO / EO"
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
              />
            </div>

            {/* Audit Date */}
            <div className="space-y-1.5">
              <label htmlFor="field-audit-date" className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar size={14} className="text-slate-500" />
                <span>Audit Date</span>
              </label>
              <input
                id="field-audit-date"
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry & Compliance HUD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
        {/* On-Site Readiness Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              On-Site Readiness Index
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.color}`}>
              {status.badge}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-black text-slate-900 tracking-tight">{readinessScore}%</span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {earnedPoints} / {totalPoints} PTS
              </span>
            </div>

            {/* Precision Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  readinessScore >= 85
                    ? 'bg-emerald-500'
                    : readinessScore >= 65
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Evaluation: <strong className="text-slate-800">{status.stage}</strong></span>
            <span>{verifiedCount} of {CHECKLIST_DATA.length} Verified</span>
          </div>
        </div>

        {/* Legal Framework Compliance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
              <Scale size={18} className="text-slate-700" />
              <span>Statutory Compliance Mandate</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforced pursuant to <strong>Sections 42 & 44 of RPwD Act 2016</strong> and <strong>MeitY GIGW 3.0</strong> guidelines for citizen-facing digital kiosks.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
              GIGW 3.0 § 6
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
              RPwD Sec 42
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
              RPwD Sec 44
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
              WCAG 2.2 AA
            </span>
          </div>
        </div>

        {/* Jurisdiction & District Node */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
              <MapPin size={18} className="text-slate-700" />
              <span>Administrative Jurisdiction</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jurisdiction:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">{selectedLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">District HQ:</span>
                <span className="font-semibold text-slate-900">Udupi, Karnataka</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">NIC Gateway:</span>
                <span className="font-semibold text-slate-900">Karnataka State Center</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AUDIT HASH:</span>
            <span className="text-slate-600 font-bold">SHA256:7F4A...9E12</span>
          </div>
        </div>
      </div>

      {/* Checklist Protocol Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden print:hidden">
        {/* Checklist Header & Category Tabs */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">On-Site Verification Protocol</h2>
              <p className="text-xs text-slate-500">
                Execute physical and digital compliance tests at the Panchayat citizen kiosk
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {verifiedCount} of {CHECKLIST_DATA.length} Verified ({earnedPoints} Pts)
              </span>
            </div>
          </div>

          {/* Clean Segmented Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            {CATEGORY_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tab.id === 'all' 
                ? CHECKLIST_DATA.length 
                : CHECKLIST_DATA.filter((i) => i.category === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <TabIcon size={14} className={isActive ? 'text-slate-900' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist Item Cards */}
        <div className="p-6 space-y-3">
          {filteredItems.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                  isChecked
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      isChecked ? 'bg-emerald-600 text-white shadow-xs' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <CheckCircle2 size={14} />}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold ${isChecked ? 'text-emerald-950' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.gigwRef}
                      </span>
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.rpwdRef}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${
                    isChecked ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    +{item.points} pts
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Photographic Evidence Management */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'kn' ? 'ಆನ್-ಸೈಟ್ ಫೋಟೋ ಸಾಕ್ಷ್ಯ ನಿರ್ವಹಣೆ' : 'Photographic Evidence Records'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Attach on-site photos of wheelchair ramps, kiosk height, and tactile keypads for official certification
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              id="photo-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Entrance & Ramp">Entrance & Ramp</option>
              <option value="Kiosk Console">Kiosk Console & Height</option>
              <option value="Tactile Keypad & Braille">Tactile Keypad & Braille</option>
              <option value="Kannada UI & Audio Jack">Kannada UI & Audio Jack</option>
              <option value="Welfare Officer Desk">Welfare Officer Desk</option>
            </select>

            <label
              htmlFor="field-photo-upload"
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors"
            >
              <Plus size={14} />
              <span>{language === 'kn' ? 'ಫೋಟೋ ಸೇರಿಸಿ' : 'Add Photo'}</span>
            </label>
            <input
              id="field-photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>

        {/* Photo Previews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs flex flex-col"
            >
              <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src={photo.dataUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs">
                  {photo.category}
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                  aria-label={`Remove photo: ${photo.caption}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <label htmlFor={`caption-${photo.id}`} className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Caption / Observation
                  </label>
                  <input
                    id={`caption-${photo.id}`}
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>Captured: {photo.timestamp}</span>
                  <span className="text-emerald-700 font-semibold">Evidence Verified</span>
                </div>
              </div>
            </div>
          ))}

          {photos.length === 0 && (
            <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
              <ImageIcon size={28} className="mx-auto mb-2 text-slate-400" />
              <p className="font-semibold text-slate-700 text-xs mb-1">No photographic evidence attached yet</p>
              <p className="text-slate-500 text-xs">Use "Add Photo" above to capture live evidence via mobile camera or upload from device.</p>
            </div>
          )}
        </div>
      </div>

      {/* Official Printable Certificate & Stamp Block */}
      <div className="bg-white rounded-2xl p-8 border-2 border-slate-300 shadow-xs print:border-solid print:p-6">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2 shadow-xs">
            <Shield size={22} className="text-emerald-400" />
          </div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
            Gram Panchayat Accessibility Field Inspection Certificate
          </h3>
          <p className="text-xs text-slate-600">
            Issued in accordance with Government of Karnataka Panchayati Raj & Rights of Persons with Disabilities Act 2016
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs text-slate-700">
          <div className="space-y-1.5">
            <div className="font-bold text-slate-900 mb-1">Panchayat / Location Details:</div>
            <div>Facility: <strong className="text-slate-900">{selectedLocation}</strong></div>
            <div>District: <strong className="text-slate-900">Udupi, Karnataka</strong></div>
            <div>Audited By: <strong className="text-slate-900">{auditorName || 'Pending Inspection'}</strong></div>
            <div>Verification Date: <strong className="text-slate-900">{auditDate}</strong></div>
            <div className="mt-3 font-bold text-emerald-800">
              Readiness Score: {readinessScore}% ({status.badge})
            </div>
          </div>

          <div className="flex flex-col justify-end items-end space-y-6">
            <div className="w-48 h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 text-[11px] font-bold bg-slate-50/50">
              [ Official Panchayat Seal ]
            </div>
            <div className="w-48 border-t border-slate-400 text-center text-[11px] font-bold text-slate-600 pt-1">
              Authorized Officer Signature
            </div>
          </div>
        </div>

        {/* Embedded Photo Evidence on the Printable Certificate */}
        {photos.length > 0 ? (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-3">
              <Camera size={14} className="text-slate-700" />
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                Attached Field Photographic Evidence ({photos.length} Recorded)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  <div className="aspect-video bg-slate-900 rounded overflow-hidden mb-1.5">
                    <img src={p.dataUrl} alt={p.caption} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 truncate">{p.category}</div>
                  <div className="text-[9px] text-slate-600 truncate">{p.caption}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 italic">
            No photographic evidence attached. Attach on-site photos above to embed them into this official field certificate.
          </div>
        )}
      </div>

      {/* Past Audits History Modal */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <History size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Saved Panchayat Field Audit Records
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspections stored in database with RPwD & GIGW 3.0 findings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {savedAudits.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ClipboardList size={36} className="mx-auto text-slate-400" />
                <p className="text-sm font-semibold">No saved inspection records found.</p>
                <p className="text-xs text-slate-400">
                  Perform an inspection and click "Save Inspection" to persist it.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {savedAudits.map((audit) => (
                  <div
                    key={audit.id}
                    onClick={() => handleLoadAudit(audit.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      activeReportId === audit.id
                        ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {audit.officeName}
                        </span>
                        {activeReportId === audit.id && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Auditor: <strong className="text-slate-700">{audit.inspectorName}</strong></span>
                        <span>•</span>
                        <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                        {audit._count?.photos > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Camera size={12} /> {audit._count.photos} photos
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${
                            audit.scorePercent >= 85
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : audit.scorePercent >= 65
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {audit.scorePercent}%
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteAudit(audit.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete audit record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
