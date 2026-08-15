import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Mail,
  Trash2,
  Bell,
  Zap,
  Search,
  ChevronDown,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  ShieldCheck,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Backend CATEGORIES keys → display colours for chart + badges
const CATEGORY_META = [
  { key: 'Spam',         label: 'Spam',         color: '#ef4444', badge: 'bg-red-100 text-red-700 border-red-200'         },
  { key: 'Marketing',    label: 'Marketing',    color: '#f59e0b', badge: 'bg-amber-100 text-amber-700 border-amber-200'   },
  { key: 'Newsletters',  label: 'Newsletters',  color: '#0ea5e9', badge: 'bg-sky-100 text-sky-700 border-sky-200'         },
  { key: 'Social Media', label: 'Social',       color: '#ec4899', badge: 'bg-pink-100 text-pink-700 border-pink-200'      },
  { key: 'Automated',    label: 'Automated',    color: '#14b8a6', badge: 'bg-teal-100 text-teal-700 border-teal-200'      },
  { key: 'Financial',    label: 'Financial',    color: '#10b981', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'Work',         label: 'Work',         color: '#3b82f6', badge: 'bg-blue-100 text-blue-700 border-blue-200'      },
  { key: 'Personal',     label: 'Personal',     color: '#8b5cf6', badge: 'bg-violet-100 text-violet-700 border-violet-200'},
  { key: 'Low Priority', label: 'Low Priority', color: '#94a3b8', badge: 'bg-slate-100 text-slate-600 border-slate-200'   },
];

const BADGE_MAP = Object.fromEntries(CATEGORY_META.map((m) => [m.key, m.badge]));

const CATEGORY_OPTIONS = ['All', ...CATEGORY_META.map((m) => m.key)];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flattenClassified(classified) {
  const rows = [];
  for (const [category, emails] of Object.entries(classified || {})) {
    for (const email of emails) {
      rows.push({
        id:       email.id || email.messageId || `${category}-${Math.random().toString(36).slice(2)}`,
        from:     email.from    || '',
        subject:  email.subject || '(no subject)',
        category,
        date:     email.date || email.internalDate || null,
      });
    }
  }
  return rows;
}

function formatSender(from) {
  if (!from) return '—';
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].replace(/"/g, '').trim() : from.split('@')[0];
}

function formatDate(raw) {
  if (!raw) return '—';
  const ms = /^\d+$/.test(String(raw)) ? Number(raw) : Date.parse(raw);
  if (Number.isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0" />
      <div className="flex-1 h-3 rounded bg-gray-200" />
      <div className="flex-[1.5] h-3 rounded bg-gray-200" />
      <div className="w-20 h-5 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="w-16 h-3 rounded bg-gray-200 flex-shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const EmailClassification = () => {
  // ── API state ──────────────────────────────────────────────────────────
  const [scanning,  setScanning]  = useState(false);
  const [loading,   setLoading]   = useState(true);   // initial report load
  const [deleting,  setDeleting]  = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState(null);
  const [actionMsg, setActionMsg] = useState(null); // success feedback
  const [scanned,   setScanned]   = useState(false);
  const [noReport,  setNoReport]  = useState(false);

  // ── Data state ─────────────────────────────────────────────────────────
  const [totalEmails,    setTotalEmails]    = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [allRows,        setAllRows]        = useState([]);

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Filter state ───────────────────────────────────────────────────────
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedCategory,  setSelectedCategory]  = useState('All');
  const [categoryOpen,      setCategoryOpen]       = useState(false);

  // Helper to populate state from a report/scan payload
  function applyData(data) {
    setTotalEmails(data.totalEmails ?? 0);
    setCategoryCounts(data.categoryCounts ?? {});
    setAllRows(flattenClassified(data.classified));
    setScanned(true);
    setNoReport(false);
  }

  // On mount: load stored report — no live Gmail scan.
  useEffect(() => {
    apiService.getEmailReport()
      .then((data) => { applyData(data); })
      .catch((err) => {
        if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no email report'))) {
          setNoReport(true);
        }
        // Any error: just show empty / no-report state, not an error banner
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: chart data ────────────────────────────────────────────────
  const chartData = useMemo(
    () =>
      CATEGORY_META
        .map((m) => ({ name: m.label, value: categoryCounts[m.key] || 0, color: m.color, key: m.key }))
        .filter((d) => d.value > 0),
    [categoryCounts]
  );

  // ── Derived: filtered rows ─────────────────────────────────────────────
  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows.filter((row) => {
      const catMatch = selectedCategory === 'All' || row.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        row.from.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q)
      );
    });
  }, [allRows, searchQuery, selectedCategory]);

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handleAnalyze() {
    setScanning(true);
    setError(null);
    setActionMsg(null);
    setSelectedIds(new Set());
    try {
      const data = await apiService.scanEmails();
      applyData(data);
    } catch (err) {
      setError(err.message || 'Failed to analyse inbox. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  async function handleMassDelete() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setDeleting(true);
    setError(null);
    setActionMsg(null);
    try {
      const result = await apiService.deleteEmails(ids);
      // Remove deleted rows from local state
      setAllRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setTotalEmails((prev) => Math.max(0, prev - (result.deleted ?? ids.length)));
      setSelectedIds(new Set());
      setActionMsg(result.message || `Permanently deleted ${result.deleted ?? ids.length} email(s).`);
    } catch (err) {
      setError(err.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleVerifyDeletion() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setVerifying(true);
    setError(null);
    setActionMsg(null);
    try {
      const result = await apiService.verifyDeletion(ids);
      setActionMsg(
        `Verified ${result.checked} email(s): ${result.deleted} deleted, ${result.stillExist} still exist.`
      );
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  function toggleRow(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleRows.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleRows.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  const hasSelection = selectedIds.size > 0;
  const isBusy = loading || scanning || deleting || verifying;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100/50 backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-900 mb-1"
          >
            Email Classification
          </motion.h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Mail size={14} className="text-blue-500" />
            <span>
              {loading
                ? 'Loading saved report…'
                : scanned
                ? `${totalEmails.toLocaleString()} emails analysed`
                : 'Click Analyze Inbox to start'}
            </span>
          </div>
        </div>

        {/* Analyze Inbox button */}
        <motion.button
          whileHover={{ scale: isBusy ? 1 : 1.04 }}
          whileTap={{ scale: isBusy ? 1 : 0.97 }}
          onClick={handleAnalyze}
          disabled={isBusy}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {scanning ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Zap size={15} />
          )}
          <span>{scanning ? 'Analysing…' : 'Analyze Inbox'}</span>
        </motion.button>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm"
          >
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action success banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm"
          >
            <ShieldCheck size={15} className="mt-0.5 flex-shrink-0" />
            <span>{actionMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Donut chart + legend ───────────────────────────────────────── */}
      {(scanned || scanning) && (
        <div className="flex items-center mb-6">
          {/* Donut */}
          <div className="w-44 h-44 relative flex-shrink-0">
            {scanning ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-400 opacity-50" />
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.length ? chartData : [{ name: 'Empty', value: 1, color: '#e5e7eb' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={74}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                      stroke="white"
                      strokeWidth={2}
                    >
                      {(chartData.length ? chartData : [{ color: '#e5e7eb' }]).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value.toLocaleString(), name]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-900">
                    {totalEmails.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Total</span>
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex-1 ml-6 grid grid-cols-2 gap-2">
            {CATEGORY_META.map((m) => {
              const count = categoryCounts[m.key] || 0;
              const pct   = totalEmails > 0 ? Math.round((count / totalEmails) * 100) : 0;
              return (
                <div
                  key={m.key}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-default"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-xs font-medium text-gray-700 truncate">{m.label}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    {scanning ? (
                      <div className="w-6 h-2 rounded bg-gray-200 animate-pulse" />
                    ) : (
                      <>
                        <span className="text-xs font-bold text-gray-800">{count.toLocaleString()}</span>
                        {totalEmails > 0 && (
                          <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pre-scan empty state ───────────────────────────────────────── */}
      {!scanned && !scanning && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
          {loading ? (
            <>
              <Loader2 size={28} className="animate-spin text-blue-300" />
              <p className="text-sm font-medium text-gray-500">Loading saved report…</p>
            </>
          ) : (
            <>
              <Inbox size={36} strokeWidth={1.5} />
              <p className="text-sm font-medium">
                {noReport ? 'No previous scan available' : 'No emails analysed yet'}
              </p>
              <p className="text-xs text-gray-400">Click <span className="text-indigo-500 font-semibold">Analyze Inbox</span> to begin</p>
            </>
          )}
        </div>
      )}

      {/* ── Search + filter toolbar (shown after scan) ────────────────── */}
      {scanned && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search sender or subject…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition"
            />
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <button
              onClick={() => setCategoryOpen((o) => !o)}
              className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 transition min-w-[130px] justify-between"
            >
              <span>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</span>
              <ChevronDown
                size={12}
                className={`text-gray-400 transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {categoryOpen && (
              <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSelectedCategory(opt); setCategoryOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition hover:bg-gray-50 ${
                      selectedCategory === opt ? 'text-indigo-600 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {opt === 'All' ? 'All Categories' : opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={handleAnalyze}
            disabled={isBusy}
            title="Re-scan inbox"
            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Row count badge */}
          <span className="text-xs text-gray-400 ml-auto">
            {visibleRows.length.toLocaleString()} row{visibleRows.length !== 1 ? 's' : ''}
            {selectedIds.size > 0 && (
              <span className="ml-1 text-indigo-600 font-medium">· {selectedIds.size} selected</span>
            )}
          </span>
        </div>
      )}

      {/* ── Email table (shown after scan) ────────────────────────────── */}
      {scanned && (
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          {/* Column headers */}
          <div className="flex items-center bg-gray-50 px-3 py-2 border-b border-gray-100 gap-3">
            {/* Select-all checkbox */}
            <button
              onClick={toggleSelectAll}
              className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition"
              title={allVisibleSelected ? 'Deselect all' : 'Select all'}
            >
              {allVisibleSelected
                ? <CheckSquare size={14} className="text-indigo-600" />
                : <Square size={14} />}
            </button>
            <span className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sender</span>
            <span className="flex-[1.5] text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-0">Subject</span>
            <span className="w-22 text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">Category</span>
            <span className="w-20 text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">Date</span>
          </div>

          {/* Loading skeleton */}
          {scanning && (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )}

          {/* Empty — no results after filter */}
          {!scanning && visibleRows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <Inbox size={28} strokeWidth={1.5} />
              <p className="text-xs">No emails match your search or filter</p>
            </div>
          )}

          {/* Rows */}
          {!scanning && visibleRows.length > 0 && (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {visibleRows.map((row) => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <div
                    key={row.id}
                    onClick={() => toggleRow(row.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0 text-gray-400">
                      {isSelected
                        ? <CheckSquare size={14} className="text-indigo-600" />
                        : <Square size={14} />}
                    </div>

                    {/* Sender */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {formatSender(row.from)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{row.from}</p>
                    </div>

                    {/* Subject */}
                    <div className="flex-[1.5] min-w-0">
                      <p className="text-xs text-gray-600 truncate">{row.subject}</p>
                    </div>

                    {/* Category badge */}
                    <div className="w-22 flex-shrink-0">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${
                          BADGE_MAP[row.category] || 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {row.category}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="w-20 flex-shrink-0 text-xs text-gray-400">
                      {formatDate(row.date)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Progress bar (scan visual feedback) ───────────────────────── */}
      {scanning && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.5 }}
          className="h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full mb-5"
        />
      )}

      {/* ── Action buttons ─────────────────────────────────────────────── */}
      <div className="flex space-x-3 mt-2">
        {/* Mass Delete */}
        <motion.button
          whileHover={{ scale: hasSelection && !isBusy ? 1.02 : 1 }}
          whileTap={{ scale: hasSelection && !isBusy ? 0.98 : 1 }}
          onClick={handleMassDelete}
          disabled={!hasSelection || isBusy}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-rose-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
        >
          {deleting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          <span>{deleting ? 'Deleting…' : `Mass Delete${hasSelection ? ` (${selectedIds.size})` : ''}`}</span>
        </motion.button>

        {/* Verify Deletion */}
        <motion.button
          whileHover={{ scale: hasSelection && !isBusy ? 1.02 : 1 }}
          whileTap={{ scale: hasSelection && !isBusy ? 0.98 : 1 }}
          onClick={handleVerifyDeletion}
          disabled={!hasSelection || isBusy}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
        >
          {verifying ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ShieldCheck size={15} />
          )}
          <span>{verifying ? 'Verifying…' : 'Verify Deletion'}</span>
        </motion.button>

        {/* Unsubscribe — intentionally disabled */}
        <motion.button
          disabled
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl shadow-md text-sm opacity-60"
          title="Coming soon"
        >
          <Bell size={15} />
          <span>Unsubscribe</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EmailClassification;
