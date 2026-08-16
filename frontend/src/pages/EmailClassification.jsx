import React, { useState, useEffect } from 'react';
import {
  Mail,
  Search,
  RefreshCw,
  Zap,
  Trash2,
  Trash,
  CheckSquare,
  ShieldCheck,
  ChevronDown,
  Inbox,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Summary card config
// ---------------------------------------------------------------------------
const SUMMARY_CARDS = [
  { label: 'Total Emails',  key: 'total',        accent: 'border-slate-600',    text: 'text-slate-100'   },
  { label: 'Spam',          key: 'Spam',          accent: 'border-red-500/50',   text: 'text-red-400'     },
  { label: 'Marketing',     key: 'Marketing',     accent: 'border-amber-500/50', text: 'text-amber-400'   },
  { label: 'Important',     key: 'Financial',     accent: 'border-emerald-500/50', text: 'text-emerald-400' },
  { label: 'Newsletters',   key: 'Newsletters',   accent: 'border-sky-500/50',   text: 'text-sky-400'     },
  { label: 'Personal',      key: 'Personal',      accent: 'border-violet-500/50', text: 'text-violet-400' },
  { label: 'Work',          key: 'Work',          accent: 'border-blue-500/50',  text: 'text-blue-400'    },
  { label: 'Automated',     key: 'Automated',     accent: 'border-teal-500/50',  text: 'text-teal-400'    },
  { label: 'Low Priority',  key: 'Low Priority',  accent: 'border-slate-500/50', text: 'text-slate-400'   },
];

const CATEGORY_OPTIONS = [
  'All Categories',
  'Personal',
  'Work',
  'Financial',
  'Social Media',
  'Newsletters',
  'Marketing',
  'Automated',
  'Spam',
  'Low Priority',
];

const CATEGORY_BADGE = {
  'Personal':    'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Work':        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Financial':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Social Media':'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Newsletters': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'Marketing':   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Automated':   'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'Spam':        'bg-red-500/15 text-red-400 border-red-500/30',
  'Low Priority':'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

// Desktop-only column headers — hidden on mobile
const TABLE_COLUMNS = [
  { label: '',           cls: 'w-10 flex-shrink-0' },
  { label: 'Sender',     cls: 'flex-1 min-w-0' },
  { label: 'Subject',    cls: 'flex-[2] min-w-0' },
  { label: 'Category',   cls: 'w-32 flex-shrink-0' },
  { label: 'Confidence', cls: 'w-28 flex-shrink-0' },
  { label: 'Date',       cls: 'w-28 flex-shrink-0' },
  { label: 'Actions',    cls: 'w-24 flex-shrink-0 text-right' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenClassified(classified) {
  const rows = [];
  for (const [category, emails] of Object.entries(classified)) {
    for (const email of emails) {
      rows.push({
        id:         email.id || email.messageId || Math.random().toString(36).slice(2),
        from:       email.from       || '',
        subject:    email.subject    || '(no subject)',
        body:       email.body       || '',
        category,
        confidence: email.confidence ?? null,
        date:       email.date       || email.internalDate || null,
      });
    }
  }
  return rows;
}

function formatDate(raw) {
  if (!raw) return '—';
  const ms = /^\d+$/.test(String(raw)) ? Number(raw) : Date.parse(raw);
  if (Number.isNaN(ms)) return raw;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatSender(from) {
  if (!from) return '—';
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].trim() : from.split('@')[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EmailClassification() {
  // ── API state ──────────────────────────────────────────────────────────
  const [scanning, setScanning]   = useState(false);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);
  const [scanned,  setScanned]    = useState(false);
  const [noReport, setNoReport]   = useState(false);

  // ── Data state ─────────────────────────────────────────────────────────
  const [totalEmails,    setTotalEmails]    = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [emailRows,      setEmailRows]      = useState([]);

  // ── UI state ───────────────────────────────────────────────────────────
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedCategory,  setSelectedCategory]  = useState('All Categories');
  const [categoryOpen,      setCategoryOpen]       = useState(false);
  const [selectedIds]                              = useState(new Set());

  const hasSelection = selectedIds.size > 0;

  function applyData(data) {
    setTotalEmails(data.totalEmails ?? 0);
    setCategoryCounts(data.categoryCounts ?? {});
    setEmailRows(flattenClassified(data.classified ?? {}));
    setScanned(true);
    setNoReport(false);
  }

  useEffect(() => {
    apiService.getEmailReport()
      .then((data) => applyData(data))
      .catch((err) => {
        if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no email report'))) {
          setNoReport(true);
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAnalyze() {
    setScanning(true);
    setError(null);
    try {
      const data = await apiService.scanEmails();
      applyData(data);
    } catch (err) {
      setError(err.message || 'Failed to analyse inbox. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  function cardValue(key) {
    if (key === 'total') return totalEmails;
    return categoryCounts[key] ?? 0;
  }

  const visibleRows = emailRows;

  return (
    <div className="min-h-screen px-3 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}
      <header className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Mail className="text-violet-400" size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold text-slate-100 leading-tight">
              Email Classification &amp; Bulk Cleanup
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              AI-powered inbox analysis
            </p>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Error banner                                                      */}
      {/* ---------------------------------------------------------------- */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 mb-5 sm:mb-6 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Summary cards                                                     */}
      {/* ---------------------------------------------------------------- */}
      {/* Mobile: 3 cols → 3 cols at sm → 5 at md → 9 at lg               */}
      <section className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {SUMMARY_CARDS.map(({ label, key, accent, text }) => (
          <div
            key={key}
            className={`rounded-xl border ${accent} bg-slate-800/40 backdrop-blur-sm p-2 sm:p-3 flex flex-col items-center gap-0.5 sm:gap-1`}
          >
            <span className={`text-lg sm:text-2xl font-bold tabular-nums transition-all duration-300 leading-tight ${text}`}>
              {scanning ? (
                <Loader2 size={16} className="animate-spin opacity-50" />
              ) : (
                cardValue(key).toLocaleString()
              )}
            </span>
            <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
          </div>
        ))}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Toolbar                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-5 sm:mb-6">

        {/* Search — full width on mobile */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search sender or subject…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 sm:py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition"
          />
        </div>

        {/* Category + Refresh + Analyze on same row on mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Category dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setCategoryOpen((o) => !o)}
              className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-600 transition w-full sm:min-w-[160px] justify-between min-h-[42px] sm:min-h-0"
            >
              <span className="truncate">{selectedCategory}</span>
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform flex-shrink-0 ${categoryOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {categoryOpen && (
              <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSelectedCategory(opt); setCategoryOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-700 ${
                      selectedCategory === opt ? 'text-violet-400' : 'text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={handleAnalyze}
            disabled={scanning}
            className="flex items-center gap-2 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 min-h-[42px] sm:min-h-0"
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Analyze Inbox — primary CTA */}
          <button
            onClick={handleAnalyze}
            disabled={scanning}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 sm:px-5 py-2.5 sm:py-2 text-sm font-semibold shadow-lg shadow-violet-900/30 transition flex-shrink-0 min-h-[42px] sm:min-h-0"
          >
            {scanning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            <span className="whitespace-nowrap">{scanning ? 'Analysing…' : 'Analyze Inbox'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Email list — table on sm+, cards on mobile                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 backdrop-blur-sm overflow-hidden mb-5 sm:mb-6">

        {/* Desktop column headers — hidden on mobile */}
        <div className="hidden sm:flex items-center px-4 py-3 border-b border-slate-700/60 bg-slate-800/50">
          {TABLE_COLUMNS.map(({ label, cls }) => (
            <span
              key={label || '_cb'}
              className={`${cls} text-xs font-semibold text-slate-500 uppercase tracking-wider`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Mobile column header bar */}
        <div className="sm:hidden flex items-center justify-between px-3 py-2.5 border-b border-slate-700/60 bg-slate-800/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emails</span>
          <span className="text-xs text-slate-600">{visibleRows.length} total</span>
        </div>

        {/* Loading skeleton */}
        {scanning && (
          <div className="divide-y divide-slate-700/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                {/* Desktop skeleton row */}
                <div className="hidden sm:flex items-center px-4 py-3 gap-4 animate-pulse">
                  <div className="w-4 h-4 rounded bg-slate-700/60 flex-shrink-0" />
                  <div className="flex-1 h-3 rounded bg-slate-700/60" />
                  <div className="flex-[2] h-3 rounded bg-slate-700/60" />
                  <div className="w-24 h-3 rounded bg-slate-700/60 flex-shrink-0" />
                  <div className="w-16 h-3 rounded bg-slate-700/60 flex-shrink-0" />
                  <div className="w-16 h-3 rounded bg-slate-700/60 flex-shrink-0" />
                  <div className="w-12 h-3 rounded bg-slate-700/60 flex-shrink-0" />
                </div>
                {/* Mobile skeleton card */}
                <div className="sm:hidden px-3 py-3 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded bg-slate-700/60 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-3 rounded bg-slate-700/60 w-24" />
                        <div className="h-5 rounded-full bg-slate-700/60 w-16" />
                      </div>
                      <div className="h-3 rounded bg-slate-700/60 w-full" />
                      <div className="h-3 rounded bg-slate-700/60 w-2/3" />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Empty state — before first scan */}
        {!scanning && !scanned && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4 text-slate-600">
            {loading ? (
              <>
                <Loader2 size={32} className="animate-spin text-violet-400" strokeWidth={1.5} />
                <p className="text-sm">Loading saved report…</p>
              </>
            ) : (
              <>
                <Inbox size={36} strokeWidth={1.5} />
                <p className="text-sm text-center px-4">
                  {noReport ? 'No previous scan available' : 'No emails analysed yet'}
                </p>
                <p className="text-xs text-slate-700 text-center px-4">
                  Click{' '}
                  <span className="text-violet-500 font-medium">Analyze Inbox</span>{' '}
                  to get started
                </p>
              </>
            )}
          </div>
        )}

        {/* Empty state — scan ran but returned nothing */}
        {!scanning && scanned && visibleRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4 text-slate-600">
            <Inbox size={36} strokeWidth={1.5} />
            <p className="text-sm">No emails found in your inbox</p>
          </div>
        )}

        {/* Email rows */}
        {!scanning && visibleRows.length > 0 && (
          <div className="divide-y divide-slate-700/40">
            {visibleRows.map((row) => {
              const badgeCls = CATEGORY_BADGE[row.category] || 'bg-slate-700/40 text-slate-400 border-slate-600';
              return (
                <div key={row.id} className="hover:bg-slate-700/20 transition">

                  {/* Desktop row — hidden on mobile */}
                  <div className="hidden sm:flex items-center px-4 py-3">
                    {/* Checkbox */}
                    <div className="w-10 flex-shrink-0">
                      <input
                        type="checkbox"
                        disabled
                        className="rounded border-slate-600 bg-slate-700 opacity-40 cursor-not-allowed"
                      />
                    </div>
                    {/* Sender */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm text-slate-200 truncate" title={row.from}>
                        {formatSender(row.from)}
                      </p>
                      <p className="text-xs text-slate-600 truncate">{row.from}</p>
                    </div>
                    {/* Subject */}
                    <div className="flex-[2] min-w-0 pr-4">
                      <p className="text-sm text-slate-300 truncate" title={row.subject}>
                        {row.subject}
                      </p>
                    </div>
                    {/* Category badge */}
                    <div className="w-32 flex-shrink-0 pr-2">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium truncate max-w-full ${badgeCls}`}>
                        {row.category}
                      </span>
                    </div>
                    {/* Confidence */}
                    <div className="w-28 flex-shrink-0 pr-2">
                      {row.confidence !== null && row.confidence !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-700">
                            <div
                              className="h-1.5 rounded-full bg-violet-500"
                              style={{ width: `${Math.round(row.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">
                            {Math.round(row.confidence * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>
                    {/* Date */}
                    <div className="w-28 flex-shrink-0 pr-2">
                      <span className="text-xs text-slate-500">{formatDate(row.date)}</span>
                    </div>
                    {/* Actions */}
                    <div className="w-24 flex-shrink-0 text-right">
                      <span className="text-xs text-slate-700 italic">—</span>
                    </div>
                  </div>

                  {/* Mobile card — hidden on sm+ */}
                  <div className="sm:hidden px-3 py-3">
                    {/* Top row: sender + category badge */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 leading-snug">
                          {formatSender(row.from)}
                        </p>
                        <p className="text-xs text-slate-600 truncate">{row.from}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${badgeCls}`}>
                        {row.category}
                      </span>
                    </div>
                    {/* Subject — wraps naturally */}
                    <p className="text-xs text-slate-300 mb-1.5 break-words leading-relaxed">
                      {row.subject}
                    </p>
                    {/* Confidence bar + date on same row */}
                    <div className="flex items-center gap-3">
                      {row.confidence !== null && row.confidence !== undefined ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-700/80">
                            <div
                              className="h-1.5 rounded-full bg-violet-500"
                              style={{ width: `${Math.round(row.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {Math.round(row.confidence * 100)}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <span className="text-xs text-slate-600 flex-shrink-0">{formatDate(row.date)}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Bottom action bar                                                 */}
      {/* ---------------------------------------------------------------- */}
      {/* Stack 2×2 on mobile, single row on sm+                           */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 pt-2">

        <button
          disabled
          className="flex items-center justify-center gap-2 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-slate-500 cursor-not-allowed opacity-50 min-h-[44px] sm:min-h-0"
        >
          <CheckSquare size={14} />
          <span>Select All</span>
        </button>

        <button
          disabled={!hasSelection}
          className="flex items-center justify-center gap-2 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-slate-500 cursor-not-allowed opacity-50 min-h-[44px] sm:min-h-0"
        >
          <Trash size={14} />
          <span>Trash Selected</span>
        </button>

        <button
          disabled={!hasSelection}
          className="flex items-center justify-center gap-2 border border-red-900/50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-red-500/50 cursor-not-allowed opacity-50 min-h-[44px] sm:min-h-0"
        >
          <Trash2 size={14} />
          <span>Delete Selected</span>
        </button>

        <button
          disabled={!hasSelection}
          className="flex items-center justify-center gap-2 border border-slate-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm text-slate-500 cursor-not-allowed opacity-50 min-h-[44px] sm:min-h-0"
        >
          <ShieldCheck size={14} />
          <span>Verify Deletion</span>
        </button>
      </div>
    </div>
  );
}
