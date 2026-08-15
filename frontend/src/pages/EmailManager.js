import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  RefreshCw,
  AlertCircle,
  Inbox,
  CheckSquare,
  Square,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import SubscriptionRow from '../components/email/SubscriptionRow.js';
import apiService from '../services/api';

/**
 * EmailManager page
 * Lists Gmail subscription senders, supports per-sender and bulk
 * unsubscribe, and persists results via:
 *   POST /api/email/scan
 *   GET  /api/email/subscriptions
 *   POST /api/email/unsubscribe
 *   POST /api/email/unsubscribe/bulk
 *
 * PRESENTATION LAYER ONLY — all logic, state, API calls are unchanged.
 */

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100/50 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-2/5 mb-2" />
        <div className="h-2 bg-gray-100 rounded w-3/5" />
      </div>
      <div className="w-20 h-6 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="w-24 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Premium empty state
// ---------------------------------------------------------------------------
function EmptyState({ category, onRescan }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-16 shadow-xl border border-gray-100/50 flex flex-col items-center text-center"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%)' }}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl flex items-center justify-center">
          <Inbox size={36} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
          <Sparkles size={13} className="text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {category === 'All' ? 'No subscriptions found' : `No ${category} subscriptions`}
      </h3>
      <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
        {category === 'All'
          ? 'Run an inbox scan and we\'ll identify all subscription-style senders across your Gmail.'
          : `No emails in the "${category}" category. Try selecting a different filter.`}
      </p>
      {category === 'All' && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRescan}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <RefreshCw size={15} />
          <span>Scan Inbox</span>
        </motion.button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stat chip displayed next to title
// ---------------------------------------------------------------------------
function StatChip({ label, value, color }) {
  return (
    <div className={`flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border rounded-full px-3 py-1 shadow-sm ${color}`}>
      <span className="text-xs font-semibold">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EmailManager() {
  // ── All state & logic unchanged ──────────────────────────────────────────
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [busyEmail, setBusyEmail] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    loadCached();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCached() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSubscriptions();
      setSubs(data.subscriptions);
      if (!data.subscriptions.length) await runScan();
    } catch (err) {
      setError(err.message || 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const data = await apiService.scanSubscriptions();
      setSubs(data.subscriptions);
    } catch (err) {
      setError(err.message || 'Scan failed.');
    } finally {
      setScanning(false);
    }
  }

  function toggleSelect(senderEmail) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(senderEmail) ? next.delete(senderEmail) : next.add(senderEmail);
      return next;
    });
  }

  function applyResultToSub(result) {
    setSubs((prev) =>
      prev.map((s) =>
        s.senderEmail === result.senderEmail
          ? {
              ...s,
              status: result.unsubscribeSucceeded
                ? 'unsubscribe_sent'
                : result.requiresManualAction
                ? 'manual_pending'
                : result.filterApplied
                ? 'filtered'
                : 'failed',
            }
          : s
      )
    );

    if (result.requiresManualAction && result.manualUrl) {
      window.open(result.manualUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleUnsubscribe(sub) {
    setBusyEmail(sub.senderEmail);
    try {
      const result = await apiService.unsubscribeOne(sub);
      applyResultToSub(result);
    } catch (err) {
      setError(err.message || 'Unsubscribe failed.');
    } finally {
      setBusyEmail(null);
    }
  }

  async function handleBulkUnsubscribe() {
    if (!selected.size) return;
    setBulkBusy(true);
    try {
      const subsToProcess = subs.filter((s) => selected.has(s.senderEmail));
      const { results } = await apiService.unsubscribeBulk(subsToProcess);
      results.forEach(applyResultToSub);
      setSelected(new Set());
    } catch (err) {
      setError(err.message || 'Bulk unsubscribe failed.');
    } finally {
      setBulkBusy(false);
    }
  }

  const categories = useMemo(
    () => ['All', ...new Set(subs.map((s) => s.category))],
    [subs]
  );

  const filtered = useMemo(
    () => (categoryFilter === 'All' ? subs : subs.filter((s) => s.category === categoryFilter)),
    [subs, categoryFilter]
  );

  // Select-all for visible rows
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.senderEmail));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.delete(s.senderEmail));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.add(s.senderEmail));
        return next;
      });
    }
  }

  const isBusy = loading || scanning || bulkBusy;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-teal-50/30 px-6 py-10">
      <div className="max-w-4xl mx-auto">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-xl" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Mail size={24} className="text-white" />
                </div>
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent mb-1"
                >
                  Email Subscription Manager
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="text-gray-500 text-sm leading-relaxed"
                >
                  Identify and remove unwanted email subscriptions with one click.
                </motion.p>
              </div>
            </div>

            {/* Rescan button */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: isBusy ? 1 : 1.04 }}
                whileTap={{ scale: isBusy ? 1 : 0.97 }}
                onClick={runScan}
                disabled={isBusy}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
              >
                {scanning ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                <span>{scanning ? 'Scanning…' : 'Rescan Inbox'}</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Stats row */}
          {!loading && subs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="flex items-center gap-3 mt-5 flex-wrap"
            >
              <StatChip
                label="senders found"
                value={subs.length.toLocaleString()}
                color="border-emerald-200"
              />
              <StatChip
                label="selected"
                value={selected.size.toLocaleString()}
                color="border-blue-200"
              />
              <StatChip
                label="categories"
                value={(categories.length - 1).toString()}
                color="border-violet-200"
              />
            </motion.div>
          )}
        </motion.div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm shadow-sm"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading skeletons ─────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <>
            {/* ── Filter + bulk toolbar ─────────────────────────────── */}
            {subs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="flex items-center justify-between mb-5 gap-3 flex-wrap"
              >
                {/* Category chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-all duration-150 ${
                        categoryFilter === c
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/20'
                          : 'border-gray-200 text-gray-500 bg-white hover:border-emerald-300 hover:text-emerald-700 shadow-sm'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Bulk action row */}
                <div className="flex items-center gap-2">
                  {/* Select All toggle */}
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 hover:border-emerald-300 hover:text-emerald-700 transition shadow-sm"
                  >
                    {allVisibleSelected
                      ? <CheckSquare size={13} className="text-emerald-600" />
                      : <Square size={13} />}
                    <span>{allVisibleSelected ? 'Deselect All' : 'Select All'}</span>
                  </button>

                  {/* Bulk unsubscribe */}
                  <AnimatePresence>
                    {selected.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBulkUnsubscribe}
                        disabled={bulkBusy}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-rose-500 to-red-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-full px-4 py-1.5 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {bulkBusy
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Users size={12} />}
                        <span>
                          {bulkBusy
                            ? 'Working…'
                            : `Unsubscribe ${selected.size}`}
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── Subscription list or empty state ──────────────────── */}
            {filtered.length ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="space-y-2.5"
              >
                {filtered.map((sub, i) => (
                  <motion.div
                    key={sub.senderEmail}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035, duration: 0.3 }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  >
                    <SubscriptionRow
                      sub={sub}
                      selected={selected.has(sub.senderEmail)}
                      onToggleSelect={toggleSelect}
                      onUnsubscribe={handleUnsubscribe}
                      busy={busyEmail === sub.senderEmail}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState category={categoryFilter} onRescan={runScan} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
