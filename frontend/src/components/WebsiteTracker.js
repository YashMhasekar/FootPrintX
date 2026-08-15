import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Search,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ShoppingBag,
  Code2,
  Briefcase,
  Tv,
  GraduationCap,
  DollarSign,
  Plane,
  Users,
  Cloud,
  Shield,
  Heart,
  LayoutGrid,
  Filter,
  SortDesc,
  Mail,
  Calendar,
  Loader2,
  Inbox,
} from 'lucide-react';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_META = {
  Shopping:      { icon: ShoppingBag,   color: 'text-orange-500',  bg: 'bg-orange-50',   border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
  Developer:     { icon: Code2,         color: 'text-indigo-500',  bg: 'bg-indigo-50',   border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700' },
  Professional:  { icon: Briefcase,     color: 'text-blue-500',    bg: 'bg-blue-50',     border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  Entertainment: { icon: Tv,            color: 'text-pink-500',    bg: 'bg-pink-50',     border: 'border-pink-200',    badge: 'bg-pink-100 text-pink-700' },
  Education:     { icon: GraduationCap, color: 'text-green-500',   bg: 'bg-green-50',    border: 'border-green-200',   badge: 'bg-green-100 text-green-700' },
  Finance:       { icon: DollarSign,    color: 'text-emerald-500', bg: 'bg-emerald-50',  border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  Travel:        { icon: Plane,         color: 'text-cyan-500',    bg: 'bg-cyan-50',     border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700' },
  Social:        { icon: Users,         color: 'text-violet-500',  bg: 'bg-violet-50',   border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
  Cloud:         { icon: Cloud,         color: 'text-sky-500',     bg: 'bg-sky-50',      border: 'border-sky-200',     badge: 'bg-sky-100 text-sky-700' },
  Security:      { icon: Shield,        color: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-200',     badge: 'bg-red-100 text-red-700' },
  Health:        { icon: Heart,         color: 'text-rose-500',    bg: 'bg-rose-50',     border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
  Other:         { icon: Globe,         color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    badge: 'bg-gray-100 text-gray-600' },
};

const SORT_OPTIONS = [
  { value: 'emails',  label: 'Most Emails' },
  { value: 'recent',  label: 'Recently Active' },
  { value: 'oldest',  label: 'Oldest First' },
  { value: 'name',    label: 'Name A–Z' },
];

const STATUS_OPTIONS = ['All', 'Active', 'Inactive'];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={color} size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badge}`}>
      <Icon size={11} />
      {category}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
        <CheckCircle size={11} /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
      <Clock size={11} /> Inactive
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const map = {
    high:   'bg-emerald-50 text-emerald-600 border border-emerald-200',
    medium: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
    low:    'bg-gray-50 text-gray-500 border border-gray-200',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${map[confidence] || map.low}`}>
      {confidence} confidence
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Website card (expandable)
// ---------------------------------------------------------------------------

function WebsiteCard({ website, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[website.category] || CATEGORY_META.Other;
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Main card body */}
      <div className="p-5">
        {/* Top row: logo + name + badges */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <img
              src={website.logoUrl}
              alt={website.websiteName}
              className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
            />
            <div
              className={`w-10 h-10 rounded-xl ${meta.bg} items-center justify-center hidden`}
              style={{ display: 'none' }}
            >
              <Icon className={meta.color} size={20} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{website.websiteName}</h3>
            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors truncate block"
            >
              {website.domain}
            </a>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <StatusBadge status={website.status} />
            <CategoryBadge category={website.category} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-gray-50 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Mail size={12} className="text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900">{website.emailCount}</p>
            <p className="text-xs text-gray-500">Emails</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Calendar size={12} className="text-gray-400" />
            </div>
            <p className="text-xs font-semibold text-gray-700 leading-tight">{formatDate(website.firstSeen)}</p>
            <p className="text-xs text-gray-500">First Seen</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-2">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock size={12} className="text-gray-400" />
            </div>
            <p className="text-xs font-semibold text-gray-700 leading-tight">{formatDate(website.lastSeen)}</p>
            <p className="text-xs text-gray-500">Last Active</p>
          </div>
        </div>

        <div className="mb-3">
          <ConfidenceBadge confidence={website.confidence} />
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {expanded ? 'Hide Emails' : 'Show Emails'}
          </button>
          <a
            href={`https://${website.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ExternalLink size={14} />
            Open Site
          </a>
        </div>
      </div>

      {/* Expandable sample emails */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="px-5 py-4 bg-gray-50 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sample Emails</p>
              {website.sampleEmails.length === 0 && (
                <p className="text-xs text-gray-400">No sample emails available.</p>
              )}
              {website.sampleEmails.map((em, i) => (
                <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-800 leading-snug truncate">{em.subject || '(no subject)'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 truncate">{em.from}</span>
                    {em.date && (
                      <span className="text-xs text-gray-300 flex-shrink-0">· {formatDate(em.date)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category chart bar
// ---------------------------------------------------------------------------

function CategoryBar({ category, count, total }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  const pct  = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-24 truncate flex-shrink-0">{category}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-2 rounded-full ${meta.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress indicator shown during scan
// ---------------------------------------------------------------------------

function ScanProgress() {
  const steps = [
    'Connecting to Gmail…',
    'Fetching email headers…',
    'Extracting sender domains…',
    'Applying category rules…',
    'Running AI for unknown domains…',
    'Building dashboard…',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 2200);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center py-20">
      {/* Spinner ring */}
      <div className="relative w-24 h-24 mb-8">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <motion.circle
            cx="40" cy="40" r="34"
            stroke="#3b82f6" strokeWidth="6" fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 213.628', strokeDashoffset: 0 }}
            animate={{ strokeDasharray: ['0 213.628', '160 213.628', '0 213.628'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="text-blue-500" size={28} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">Scanning your inbox…</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
        Analysing up to 300 emails to discover websites you've interacted with.
      </p>

      {/* Steps */}
      <div className="space-y-3 w-full max-w-sm">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < step ? 'bg-blue-500' : i === step ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {i < step
                ? <CheckCircle size={12} className="text-white" />
                : i === step
                ? <Loader2 size={12} className="text-blue-500 animate-spin" />
                : <div className="w-2 h-2 rounded-full bg-gray-300" />
              }
            </div>
            <span className={`text-sm ${i === step ? 'text-blue-600 font-medium' : i < step ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onScan }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Inbox size={36} className="text-blue-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No websites found</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
        Scan your Gmail inbox to discover all the websites and services you've signed up for.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onScan}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <RefreshCw size={15} />
        Scan Inbox
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-16 text-center"
    >
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle className="text-red-400" size={30} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{message}</p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
      >
        <RefreshCw size={14} />
        Try Again
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const WebsiteTracker = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // ── state ──────────────────────────────────────────────────────────────
  const [data, setData]         = useState(null);   // full API response
  const [loading, setLoading]   = useState(true);   // initial report load
  const [scanning, setScanning] = useState(false);  // live rescan
  const [error, setError]       = useState(null);
  const [noReport, setNoReport] = useState(false);

  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [status,     setStatus]     = useState('All');
  const [sort,       setSort]       = useState('emails');

  // ── on mount: load stored report ────────────────────────────────────────
  useEffect(() => {
    apiService.getWebsiteReport()
      .then((result) => setData(result))
      .catch((err) => {
        if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no website report'))) {
          setNoReport(true);
        } else {
          setError(err.message || 'Failed to load website report.');
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── manual rescan — only on Rescan button click ──────────────────────────
  async function runScan() {
    setScanning(true);
    setError(null);
    setNoReport(false);
    try {
      const result = await apiService.scanWebsites({ maxMessages: 300 });
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to scan Gmail. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  const isBusy = loading || scanning;

  // ── derived data ─────────────────────────────────────────────────────────
  const allCategories = useMemo(() => {
    if (!data?.websites) return ['All'];
    const cats = [...new Set(data.websites.map((w) => w.category))].sort();
    return ['All', ...cats];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data?.websites) return [];
    let list = [...data.websites];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.websiteName.toLowerCase().includes(q) ||
          w.domain.toLowerCase().includes(q) ||
          w.category.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') list = list.filter((w) => w.category === category);
    if (status   !== 'All') list = list.filter((w) => w.status === status.toLowerCase());

    switch (sort) {
      case 'emails':  list.sort((a, b) => b.emailCount - a.emailCount);          break;
      case 'recent':  list.sort((a, b) => new Date(b.lastSeen)  - new Date(a.lastSeen));  break;
      case 'oldest':  list.sort((a, b) => new Date(a.firstSeen) - new Date(b.firstSeen)); break;
      case 'name':    list.sort((a, b) => a.websiteName.localeCompare(b.websiteName));    break;
      default: break;
    }
    return list;
  }, [data, search, category, status, sort]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={18} /> Back
              </motion.button>
              <div className="h-7 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Globe className="text-white" size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">Website Tracker</h1>
                  <p className="text-xs text-gray-400">Gmail-powered discovery</p>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: isBusy ? 1 : 1.04 }}
              whileTap={{ scale: isBusy ? 1 : 0.97 }}
              onClick={runScan}
              disabled={isBusy}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
            >
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {scanning ? 'Scanning…' : loading ? 'Loading…' : 'Rescan'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Loading */}
        {isBusy && <ScanProgress />}

        {/* Error */}
        {!isBusy && error && <ErrorState message={error} onRetry={runScan} />}

        {/* No report yet */}
        {!isBusy && !error && noReport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Inbox size={36} className="text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No previous scan available</h3>
            <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
              Scan your Gmail inbox to discover all the websites and services you've interacted with.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={runScan}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw size={15} />
              Scan Now
            </motion.button>
          </motion.div>
        )}

        {/* Results */}
        {!isBusy && !error && data && (
          <>
            {/* ── Analytics cards ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <StatCard icon={Globe}        label="Total Websites"   value={data.totalWebsites}    color="text-blue-500"    bg="bg-blue-50" />
              <StatCard icon={CheckCircle}  label="Active"           value={data.activeCount}       color="text-green-500"   bg="bg-green-50" />
              <StatCard icon={Clock}        label="Inactive"         value={data.inactiveCount}     color="text-gray-400"    bg="bg-gray-50" />
              <StatCard icon={LayoutGrid}   label="Categories"       value={Object.keys(data.categoryCounts).length} color="text-violet-500" bg="bg-violet-50" />
            </motion.div>

            {/* ── Category summary + chart ───────────────────────────────── */}
            {Object.keys(data.categoryCounts).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
              >
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-5">Category Breakdown</h2>
                <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
                  {Object.entries(data.categoryCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, cnt]) => (
                      <CategoryBar key={cat} category={cat} count={cnt} total={data.totalWebsites} />
                    ))}
                </div>
              </motion.div>
            )}

            {/* ── Filters toolbar ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6"
            >
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search websites…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Category filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer transition-all"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                        status === s
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="relative">
                  <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer transition-all"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of{' '}
                  <span className="font-semibold text-gray-700">{data.totalWebsites}</span> websites
                </p>
                {(search || category !== 'All' || status !== 'All') && (
                  <button
                    onClick={() => { setSearch(''); setCategory('All'); setStatus('All'); }}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── Website grid ───────────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <EmptyState onScan={runScan} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((website, idx) => (
                  <WebsiteCard key={website.id} website={website} index={idx} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Initial empty state (before first scan) */}
        {!isBusy && !error && !data && !noReport && (
          <EmptyState onScan={runScan} />
        )}
      </div>
    </div>
  );
};

export default WebsiteTracker;
