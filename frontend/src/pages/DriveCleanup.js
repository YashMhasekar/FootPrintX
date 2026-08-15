import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  AlertCircle,
  FolderOpen,
  RefreshCw,
  Trash2,
  FileSearch,
  Sparkles,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import StorageChart from '../components/drive/StorageChart.js';
import FileList from '../components/drive/FileList.js';
import apiService from '../services/api';

/**
 * DriveCleanup page
 * Displays a storage breakdown chart and a list of files scored by the
 * ML decay model. Fetches data from:
 *   GET /api/drive/summary
 *   GET /api/drive/files
 *
 * PRESENTATION LAYER ONLY — all logic, state, API calls are unchanged.
 */

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="flex-1">
          <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50 animate-pulse h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="w-44 h-44 rounded-full border-[14px] border-gray-100" />
      </div>
    </div>
  );
}

function SkeletonFileRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-2 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex-shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, description, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-l-4 ${accent} border border-gray-100/50`}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent.replace('border-', 'bg-').replace('-500', '-50')}`}>
          <Icon size={20} className={accent.replace('border-l-4 border-', 'text-').replace('border-', 'text-')} />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Premium empty state
// ---------------------------------------------------------------------------
function EmptyState({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-16 shadow-xl border border-gray-100/50 flex flex-col items-center text-center"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%)' }}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl flex items-center justify-center">
          <FolderOpen size={36} className="text-violet-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
          <FileSearch size={14} className="text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Drive data yet</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
        Connect your Google Drive account so we can scan your files, rank them by decay score, and help you reclaim storage.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <RefreshCw size={15} />
        <span>Retry Scan</span>
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DriveCleanup() {
  // ── All state & logic unchanged ──────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, filesRes] = await Promise.all([
          apiService.getDriveSummary(),
          apiService.getScoredFiles(),
        ]);
        if (cancelled) return;
        setSummary(summaryRes.summary);
        setFiles(filesRes.files);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load Drive data. Try reconnecting your account.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const junkCount = files.filter((f) => f.isJunk).length;
  const cleanCount = files.length - junkCount;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-violet-50/30 px-6 py-10">
      <div className="max-w-6xl mx-auto">

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
                <div className="absolute inset-0 bg-violet-400/20 rounded-2xl blur-xl" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <HardDrive size={24} className="text-white" />
                </div>
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-violet-900 to-purple-900 bg-clip-text text-transparent mb-1"
                >
                  Drive Decay Detector
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="text-gray-500 text-sm leading-relaxed"
                >
                  AI-powered storage intelligence that identifies stale, duplicate,
                  and low-value files so you can reclaim storage safely.
                </motion.p>
              </div>
            </div>

            {/* Status chip */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-full px-4 py-2 shadow-md"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="text-violet-500 animate-spin" />
                  <span className="text-sm font-medium text-gray-600">Scanning Drive…</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">
                    {files.length} files · {junkCount} flagged
                  </span>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-8 text-sm shadow-sm"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-6">
            {/* Skeleton summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            {/* Skeleton chart + list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100/50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <SkeletonFileRow key={i} />)}
                </div>
              </div>
            </div>
          </div>
        ) : !files.length ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <EmptyState onRetry={() => window.location.reload()} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* ── Summary stat cards ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={BarChart3}
                label="Total Files"
                value={files.length.toLocaleString()}
                description="Analysed by ML model"
                accent="border-blue-500"
                delay={0.1}
              />
              <StatCard
                icon={Trash2}
                label="Flagged Junk"
                value={junkCount.toLocaleString()}
                description="Recommended for cleanup"
                accent="border-rose-500"
                delay={0.2}
              />
              <StatCard
                icon={CheckCircle2}
                label="Clean Files"
                value={cleanCount.toLocaleString()}
                description="No action needed"
                accent="border-emerald-500"
                delay={0.3}
              />
              <StatCard
                icon={Sparkles}
                label="Junk Ratio"
                value={files.length ? `${Math.round((junkCount / files.length) * 100)}%` : '—'}
                description="Of total storage scanned"
                accent="border-amber-500"
                delay={0.4}
              />
            </div>

            {/* ── Chart + file list ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
              >
                <StorageChart summary={summary} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
              >
                <FileList files={files} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
