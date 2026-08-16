import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, CheckCircle, ArrowLeft, RefreshCw,
  Globe, Link, FileText, Clock, UserX, HardDrive, Key,
  AlertCircle, Loader2, Filter, ExternalLink,
  ShieldCheck, Sparkles,
} from 'lucide-react';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const SEVERITY_META = {
  critical: {
    color:  'text-red-600',
    bg:     'bg-red-50',
    border: 'border-red-200',
    badge:  'bg-red-100 text-red-700 border-red-200',
    dot:    'bg-red-500',
    label:  'Critical',
  },
  high: {
    color:  'text-orange-600',
    bg:     'bg-orange-50',
    border: 'border-orange-200',
    badge:  'bg-orange-100 text-orange-700 border-orange-200',
    dot:    'bg-orange-500',
    label:  'High',
  },
  medium: {
    color:  'text-yellow-600',
    bg:     'bg-yellow-50',
    border: 'border-yellow-200',
    badge:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot:    'bg-yellow-400',
    label:  'Medium',
  },
  low: {
    color:  'text-blue-600',
    bg:     'bg-blue-50',
    border: 'border-blue-200',
    badge:  'bg-blue-100 text-blue-700 border-blue-200',
    dot:    'bg-blue-400',
    label:  'Low',
  },
};

const ICON_MAP = {
  globe:        Globe,
  link:         Link,
  'file-lock':  FileText,
  clock:        Clock,
  'user-x':     UserX,
  'hard-drive': HardDrive,
  key:          Key,
};

const FILTER_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Safe'];

const PRIORITY_META = {
  critical: 'bg-red-50 border-red-200',
  high:     'bg-orange-50 border-orange-200',
  medium:   'bg-yellow-50 border-yellow-200',
  low:      'bg-blue-50 border-blue-200',
};
const PRIORITY_DOT = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-400',
  low:      'bg-blue-400',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AlertIconBox({ icon, severity }) {
  const Icon = ICON_MAP[icon] || AlertTriangle;
  const meta = SEVERITY_META[severity] || SEVERITY_META.low;
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`p-2.5 rounded-xl ${meta.bg} border ${meta.border} flex-shrink-0 shadow-sm`}
    >
      <Icon size={18} className={meta.color} />
    </motion.div>
  );
}

function ScoreGauge({ score, level }) {
  const r    = 60;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const strokeColor =
    score >= 85 ? '#10B981' :
    score >= 70 ? '#3B82F6' :
    score >= 50 ? '#F59E0B' : '#EF4444';
  const textColor =
    score >= 85 ? 'text-green-600' :
    score >= 70 ? 'text-blue-600'  :
    score >= 50 ? 'text-yellow-600': 'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} stroke="#E5E7EB" strokeWidth="10" fill="none" />
          <motion.circle
            cx="65" cy="65" r={r}
            stroke={strokeColor} strokeWidth="10" fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-black text-gray-900 leading-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-gray-400 font-medium mt-0.5">/100</span>
        </div>
      </div>
      <span className={`mt-2 text-lg font-bold ${textColor}`}>{level}</span>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 text-center"
    >
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2 ${color.replace('text-', 'bg-').replace('600','50')}`}>
        <Icon size={15} className={color} />
      </div>
      <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">{label}</p>
    </motion.div>
  );
}

function SkeletonBlock({ h = 'h-20' }) {
  return <div className={`animate-pulse bg-white/70 rounded-2xl ${h} w-full border border-gray-100`} />;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BreachRadarPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error,   setError]   = useState(null);
  const [data,    setData]    = useState(null);
  const [filter,  setFilter]  = useState('All');
  const [noReport, setNoReport] = useState(false);

  // On mount: load stored report — no live scan.
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoReport(false);
    try {
      const result = await apiService.getBreachReport();
      setData(result);
    } catch (err) {
      if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no breach report'))) {
        setNoReport(true);
      } else {
        setError(err.message || 'Failed to load report.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual rescan — only triggered by the Re-Scan button.
  const load = useCallback(async () => {
    setScanning(true);
    setError(null);
    setNoReport(false);
    try {
      const result = await apiService.scanBreachRadar();
      setData(result);
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  const isBusy = loading || scanning;

  // ── Filtered alerts ──────────────────────────────────────────────────────
  const filteredAlerts = (() => {
    if (!data?.alerts) return [];
    if (filter === 'All')  return data.alerts;
    if (filter === 'Safe') return [];   // safe = no alerts shown, see empty state below
    return data.alerts.filter((a) => a.severity.toLowerCase() === filter.toLowerCase());
  })();

  const showSafeState = filter === 'Safe' || (data && data.alerts.length === 0 && !loading);

  const stats = data?.statistics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} /> <span className="hidden xs:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Shield className="text-white" size={16} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Privacy & Security Radar</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Powered by your Drive, Gmail & Website data</p>
              </div>
            </div>
          </div>

          <button
            onClick={load}
            disabled={isBusy}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all flex-shrink-0"
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {scanning ? 'Scanning…' : loading ? 'Loading…' : 'Re-Scan'}
          </button>
        </motion.div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isBusy ? (
          /* ── Skeleton ───────────────────────────────────────────────────── */
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => <SkeletonBlock key={i} h="h-20 sm:h-24" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <SkeletonBlock h="h-72" />
              <div className="lg:col-span-2 space-y-3">
                {[...Array(4)].map((_, i) => <SkeletonBlock key={i} h="h-20" />)}
              </div>
            </div>
          </div>
        ) : noReport ? (
          /* ── No report yet ──────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="text-blue-400" size={30} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No previous scan available</h3>
            <p className="text-sm text-gray-500 max-w-xs text-center mb-6">
              Run your first Privacy &amp; Security Radar scan to see your digital risk profile.
            </p>
            <button
              onClick={load}
              disabled={isBusy}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md"
            >
              <RefreshCw size={14} />
              Scan Now
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* ── Hero row: score + stats ──────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

              {/* Score card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center py-6 sm:py-8 px-4 sm:px-6">
                <ScoreGauge score={data?.score ?? 0} level={data?.level ?? ''} />
                <p className="text-sm text-gray-500 mt-3 sm:mt-4 text-center leading-relaxed px-2">
                  {data?.summary}
                </p>
              </div>

              {/* Stats grid */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 content-start">
                <StatCard label="Total Files"      value={stats?.totalFiles ?? 0}       color="text-gray-600"    icon={FileText}    />
                <StatCard label="Shared Files"     value={stats?.sharedFiles ?? 0}      color="text-orange-600"  icon={Link}        />
                <StatCard label="Public Files"     value={stats?.publicFiles ?? 0}      color="text-red-600"     icon={Globe}       />
                <StatCard label="Sensitive Shared" value={stats?.sensitiveShared ?? 0}  color="text-purple-600"  icon={FileText}    />
                <StatCard label="Dormant Accounts" value={stats?.dormantAccounts ?? 0}  color="text-yellow-600"  icon={UserX}       />
                <StatCard label="Large Shared"     value={stats?.largeSharedFiles ?? 0} color="text-blue-600"    icon={HardDrive}   />
                <StatCard label="Old Shared Files" value={stats?.oldSharedFiles ?? 0}   color="text-indigo-600"  icon={Clock}       />
                <StatCard label="Tracked Sites"    value={stats?.trackedWebsites ?? 0}  color="text-cyan-600"    icon={Shield}      />
              </div>
            </div>

            {/* ── Filter bar ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-4 sm:mb-5 flex-wrap">
              <Filter size={14} className="text-gray-400 flex-shrink-0" />
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filter === opt
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt}
                  {opt !== 'All' && opt !== 'Safe' && data?.alerts && (
                    <span className="ml-1 opacity-70">
                      ({data.alerts.filter((a) => a.severity.toLowerCase() === opt.toLowerCase()).length})
                    </span>
                  )}
                  {opt === 'All' && data?.alerts && (
                    <span className="ml-1 opacity-70">({data.alerts.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Alerts timeline + Recommendations ────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Alerts timeline */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-base font-bold text-gray-800 mb-3">Security Alerts</h2>

                {/* Safe / all-clear state */}
                {showSafeState && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <ShieldCheck className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">Excellent!</h3>
                    <p className="text-sm text-green-700 text-center max-w-xs">
                      No significant privacy risks detected. Your digital footprint looks healthy.
                    </p>
                  </motion.div>
                )}

                {/* No results for current filter */}
                {!showSafeState && filteredAlerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                    <CheckCircle size={32} className="text-green-400 mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-gray-600">No {filter.toLowerCase()} alerts</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different filter</p>
                  </div>
                )}

                {/* Alert cards */}
                <AnimatePresence>
                  {filteredAlerts.map((alert, index) => {
                    const meta = SEVERITY_META[alert.severity] || SEVERITY_META.low;
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 sm:p-5 rounded-2xl border ${meta.bg} ${meta.border} hover:shadow-md transition-all duration-200 group`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertIconBox icon={alert.icon} severity={alert.severity} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-gray-900 text-sm">{alert.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border capitalize ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2 break-words">{alert.description}</p>
                            <div className="flex items-start gap-1.5">
                              <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${meta.dot}`} />
                              <p className="text-xs text-gray-500 italic break-words">{alert.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Recommendations sidebar */}
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-3">Recommendations</h2>
                <div className="space-y-3">
                  {(data?.recommendations || []).map((rec, i) => {
                    const bg  = PRIORITY_META[rec.priority]  || 'bg-gray-50 border-gray-200';
                    const dot = PRIORITY_DOT[rec.priority]   || 'bg-gray-400';
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        className={`rounded-xl border p-4 ${bg}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                          <p className="text-sm font-bold text-gray-800">{rec.title}</p>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3 pl-4">{rec.body}</p>
                        <button
                          onClick={() => navigate(rec.route)}
                          className="ml-4 flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {rec.action}
                          <ExternalLink size={11} />
                        </button>
                      </motion.div>
                    );
                  })}

                  {/* Healthy fallback */}
                  {(!data?.recommendations || data.recommendations.length === 0) && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex flex-col items-center text-center gap-2">
                      <Sparkles size={20} className="text-green-500" />
                      <p className="text-sm font-semibold text-green-800">All clear!</p>
                      <p className="text-xs text-green-600">No recommendations at this time. Keep it up!</p>
                    </div>
                  )}
                </div>

                {/* Quick-action buttons */}
                <div className="mt-4 sm:mt-5 space-y-2">
                  {[
                    { label: 'Drive Classifier',  route: '/drive-classifier',  color: 'from-purple-500 to-violet-600'  },
                    { label: 'Drive Cleanup',      route: '/drive-cleanup',     color: 'from-yellow-500 to-amber-600'   },
                    { label: 'Website Tracker',    route: '/website-tracker',   color: 'from-blue-500 to-indigo-600'    },
                  ].map(({ label, route, color }) => (
                    <motion.button
                      key={label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(route)}
                      className={`w-full flex items-center justify-between bg-gradient-to-r ${color} text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all min-h-[44px]`}
                    >
                      <span>{label}</span>
                      <ExternalLink size={14} />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
