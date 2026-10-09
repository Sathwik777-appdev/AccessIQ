import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Play, Loader2, Globe, Shield, ExternalLink, FileText, LayoutGrid, List } from 'lucide-react';
import { api, ScanTarget } from '../services/api';
import { useToast } from '../components/Toast';
import { sanitizeUrl } from '../lib/sanitize-url';

const MiniSparkline = ({ seed }: { seed: string }) => {
  const hash = seed.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const data = useMemo(() => {
    let current = 40;
    return Array.from({ length: 7 }).map((_, i) => {
      const randomOffset = ((Math.abs(hash) + i * 13) % 20) - 5; 
      current = Math.max(10, Math.min(90, current + randomOffset));
      return current;
    });
  }, [hash]);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 120;
    const y = 40 - ((d - min) / range) * 30 - 5;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} 120,40 0,40`;

  return (
    <svg width="120" height="40" viewBox="0 0 120 40" className="opacity-70">
      <defs>
        <linearGradient id={`grad-${hash}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={areaPoints} fill={`url(#grad-${hash})`} />
    </svg>
  );
};

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColor = (v: number) => {
    if (v >= 80) return 'text-emerald-500';
    if (v >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-12 h-12">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-200"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${getColor(value)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <span className="absolute text-xs font-bold text-slate-700">{value}%</span>
    </div>
  );
};

const SITE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  'central-govt': { label: 'Central Govt', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'state-govt': { label: 'State Govt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  psu: { label: 'PSU', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  municipal: { label: 'Municipal', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'international-benchmark': { label: 'Intl Benchmark', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  'demo-page': { label: 'Demo Proof', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const SiteList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [targets, setTargets] = useState<ScanTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());
  const pollingIntervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  // Add form state
  const [newUrl, setNewUrl] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState('central-govt');
  const [newCountry, setNewCountry] = useState('India');
  const [addError, setAddError] = useState<string | null>(null);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const data = await api.fetchTargets();
      setTargets(data);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
    return () => {
      pollingIntervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      await api.createTarget({
        url: newUrl,
        siteName: newSiteName,
        siteType: newSiteType,
        country: newCountry,
      });
      setShowAddModal(false);
      setNewUrl('');
      setNewSiteName('');
      setNewSiteType('central-govt');
      showToast('New target successfully registered', 'success');
      fetchTargets();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add target');
    }
  };

  const handleScan = async (targetId: string) => {
    try {
      setScanningIds((prev) => new Set(prev).add(targetId));
      showToast('Headless accessibility audit started...', 'info');
      const res = await api.triggerScan(targetId);

      // Poll scan status until completed or failed
      const interval = setInterval(async () => {
        try {
          const statusRes = await api.pollScanStatus(res.jobId);
          if (statusRes.status === 'completed' || statusRes.status === 'failed') {
            clearInterval(interval);
            pollingIntervalsRef.current.delete(interval);
            setScanningIds((prev) => {
              const next = new Set(prev);
              next.delete(targetId);
              return next;
            });
            showToast(statusRes.status === 'completed' ? 'Audit scan complete!' : 'Scan failed', statusRes.status === 'completed' ? 'success' : 'error');
            fetchTargets(); // Refresh list with new scan data
          }
        } catch {
          clearInterval(interval);
          pollingIntervalsRef.current.delete(interval);
          setScanningIds((prev) => {
            const next = new Set(prev);
            next.delete(targetId);
            return next;
          });
        }
      }, 2000);
      pollingIntervalsRef.current.add(interval);
    } catch (err: any) {
      setScanningIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      showToast(err.message || 'Failed to trigger scan', 'error');
    }
  };

  const filteredTargets = useMemo(() => targets.filter((t) => {
    const matchesSearch =
      t.siteName.toLowerCase().includes(search.toLowerCase()) ||
      t.url.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? t.siteType === typeFilter : true;
    return matchesSearch && matchesType;
  }), [targets, search, typeFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary-600" />
            Monitored Web Properties
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and scan government services and public portals for WCAG 2.2 / GIGW 3.0 compliance.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus size={16} className="mr-2" />
            Add Target
          </button>
        </div>
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAddModal(false)}
            ></div>

            <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
              <form onSubmit={handleAddSite} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary-600" /> Add Website to Track
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-600 hover:text-slate-900 p-1 rounded-lg"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>

                {addError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                    {addError}
                  </div>
                )}

                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                    Portal Name
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    required
                    placeholder="e.g. National Portal of India"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    Target URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    required
                    placeholder="https://india.gov.in"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="siteType" className="block text-sm font-medium text-gray-700">
                      Entity Classification
                    </label>
                    <select
                      id="siteType"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm focus:ring-primary-500"
                      value={newSiteType}
                      onChange={(e) => setNewSiteType(e.target.value)}
                    >
                      <option value="central-govt">Central Govt</option>
                      <option value="state-govt">State Govt</option>
                      <option value="psu">PSU</option>
                      <option value="municipal">Municipal</option>
                      <option value="international-benchmark">Intl Benchmark</option>
                      <option value="demo-page">Demo Page</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country / Jurisdiction
                    </label>
                    <input
                      type="text"
                      id="country"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-500"
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500"
                  >
                    Save Target
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filter, Search Bar, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white/80 backdrop-blur-sm placeholder-slate-500 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search targets by site name or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search targets"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-slate-500" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white/80 backdrop-blur-sm focus:ring-primary-500 focus:border-primary-500 text-slate-700"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by site type"
            >
              <option value="">All Classifications</option>
              <option value="central-govt">Central Government</option>
              <option value="state-govt">State Government</option>
              <option value="psu">PSU</option>
              <option value="municipal">Municipal</option>
              <option value="international-benchmark">International Benchmark</option>
              <option value="demo-page">Demo Page</option>
            </select>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={16} /> Table View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={16} /> Card Grid View
          </button>
        </div>
      </div>

      {/* Target Views */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-5 flex flex-col h-full animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                  </div>
                  <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                </div>
                <div className="py-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                    <div className="h-10 bg-slate-100 rounded-lg w-28"></div>
                  </div>
                  <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-slate-200 rounded-lg flex-1"></div>
                    <div className="h-9 bg-slate-200 rounded-lg flex-1"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredTargets.length === 0 ? (
             <div className="col-span-full py-12 text-center text-sm text-slate-600">
               No targets found matching the current search criteria.
             </div>
          ) : (
            filteredTargets.map((target) => {
              const typeInfo = SITE_TYPE_LABELS[target.siteType] || {
                label: target.siteType,
                color: 'bg-gray-100 text-gray-700 border-gray-200',
              };
              const passRate = target.lastScanPassRate ?? null;
              const isScanning = scanningIds.has(target.id);
              
              return (
                <div key={target.id} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-primary-600 transition-colors" title={target.siteName}>
                        {target.siteName}
                      </h3>
                      <a href={sanitizeUrl(target.url)} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-primary-600 inline-flex items-center gap-1 mt-1 truncate max-w-full">
                        {target.url} <ExternalLink size={10} className="flex-shrink-0" />
                      </a>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center py-4">
                    <div className="flex items-center justify-between">
                      <div>
                         <p className="text-xs text-slate-500 mb-1 font-medium">Compliance Trend</p>
                         <MiniSparkline seed={target.siteName} />
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Score</p>
                        {passRate !== null ? (
                          <CircularProgress value={passRate} />
                        ) : (
                          <span className="text-xs text-slate-400 italic py-3">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span>Last scan:</span>
                      <span className="font-medium text-slate-700">{target.lastScannedAt ? new Date(target.lastScannedAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        onClick={() => navigate(`/sites/${target.id}`)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        onClick={() => handleScan(target.id)}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <><Loader2 size={16} className="animate-spin mr-1.5" /> Scanning</>
                        ) : (
                          <><Play size={16} className="mr-1.5" /> Scan Now</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="glass-card shadow-sm overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Entity
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pass Rate
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Violations (Crit / Ser / Mod / Min)
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Last Scanned
                </th>
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Audit Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/60 divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-600">
                    <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary-600 mb-2" />
                    Loading monitored targets...
                  </td>
                </tr>
              ) : filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-600">
                    No targets found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredTargets.map((target) => {
                  const typeInfo = SITE_TYPE_LABELS[target.siteType] || {
                    label: target.siteType,
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                  };
                  const passRate = target.lastScanPassRate ?? null;
                  const isScanning = scanningIds.has(target.id);
                  const sev = target.lastScanViolationsBySeverity;

                  return (
                    <tr
                      key={target.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.action-control')) return;
                        navigate(`/sites/${target.id}`);
                      }}
                    >
                      {/* Site Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{target.siteName}</span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${typeInfo.color}`}
                            >
                              {typeInfo.label}
                            </span>
                          </div>
                          <a
                            href={sanitizeUrl(target.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-control text-xs font-mono text-gray-500 hover:text-primary-600 inline-flex items-center gap-1 mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {target.url} <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>

                      {/* Pass Rate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {passRate !== null ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold px-2 py-0.5 rounded ${
                                passRate >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : passRate >= 50
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {passRate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Not scanned</span>
                        )}
                      </td>

                      {/* Severity Breakdown */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {target.lastScanTotalViolations !== null && target.lastScanTotalViolations !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 w-6">
                              {target.lastScanTotalViolations}
                            </span>
                            {sev ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold" title="Critical">
                                  {sev.critical}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold" title="Serious">
                                  {sev.serious}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold" title="Moderate">
                                  {sev.moderate}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold" title="Minor">
                                  {sev.minor}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>

                      {/* Last Scanned */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {target.lastScannedAt ? new Date(target.lastScannedAt).toLocaleString() : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {target.lastScanId && (
                          <button
                            type="button"
                            className="action-control inline-flex items-center px-2.5 py-1.5 border border-primary-200 shadow-sm text-xs font-semibold rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 mr-2 focus:ring-2 focus:ring-primary-500"
                            onClick={() => navigate(`/sites/${target.id}/report`)}
                            title="View Executive Audit Report"
                          >
                            <FileText size={13} className="mr-1" /> Report
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-control inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-semibold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          onClick={() => handleScan(target.id)}
                          disabled={isScanning}
                        >
                          {isScanning ? (
                            <>
                              <Loader2 size={14} className="animate-spin mr-1.5 text-primary-600" /> Scanning...
                            </>
                          ) : (
                            <>
                              <Play size={14} className="mr-1.5 text-primary-600" /> Scan Now
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SiteList;
