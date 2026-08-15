import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, AlertCircle, RefreshCw, FileSearch,
  FileText, Image, Video, Music, File, Archive,
  Code2, Table, Presentation, Filter, Search,
  ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon,
  Layers, HardDrive, Sparkles, CheckCircle2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Documents', 'Images', 'Videos', 'Audio', 'PDFs',
  'Presentations', 'Spreadsheets', 'Archives', 'Code', 'Others',
];

const CATEGORY_META = {
  Documents:     { icon: FileText,      color: '#3B82F6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200'    },
  Images:        { icon: Image,         color: '#EC4899', bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200'    },
  Videos:        { icon: Video,         color: '#8B5CF6', bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200'  },
  Audio:         { icon: Music,         color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200'   },
  PDFs:          { icon: File,          color: '#EF4444', bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200'     },
  Presentations: { icon: Presentation,  color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200'  },
  Spreadsheets:  { icon: Table,         color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  Archives:      { icon: Archive,       color: '#6B7280', bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200'    },
  Code:          { icon: Code2,         color: '#06B6D4', bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200'    },
  Others:        { icon: FolderOpen,    color: '#A78BFA', bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200'  },
};

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtBytes(bytes = 0) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="flex-1">
          <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 animate-pulse border-b border-gray-50">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-2 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="w-16 h-5 bg-gray-100 rounded-full" />
      <div className="w-12 h-3 bg-gray-100 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, description, colorClass, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon size={20} className="opacity-80" />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category badge
// ---------------------------------------------------------------------------
function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Others;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
      <meta.icon size={10} />
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category filter pill
// ---------------------------------------------------------------------------
function FilterPill({ label, active, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150
        ${active
          ? 'text-white border-transparent shadow-md'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      style={active ? { backgroundColor: color, borderColor: color } : {}}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Custom Pie tooltip
// ---------------------------------------------------------------------------
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const meta = CATEGORY_META[name] || CATEGORY_META.Others;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
      <div className={`font-semibold ${meta.text} mb-1`}>{name}</div>
      <div className="text-gray-700">{value.toLocaleString()} files</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Bar tooltip
// ---------------------------------------------------------------------------
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const meta = CATEGORY_META[label] || CATEGORY_META.Others;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
      <div className={`font-semibold ${meta.text} mb-1`}>{label}</div>
      <div className="text-gray-700">{payload[0].value.toLocaleString()} files</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-16 shadow-xl border border-gray-100 flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl flex items-center justify-center">
          <FolderOpen size={36} className="text-violet-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
          <FileSearch size={14} className="text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Drive files found</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
        Connect your Google Drive and we'll classify every file into categories so you can explore your storage at a glance.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        <RefreshCw size={15} />
        Retry Scan
      </motion.button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// File row
// ---------------------------------------------------------------------------
function FileRow({ file, index }) {
  const cat  = file.classifiedCategory || 'Others';
  const meta = CATEGORY_META[cat] || CATEGORY_META.Others;
  const IconComp = meta.icon;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
    >
      {/* Icon + name */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
            <IconComp size={15} className={meta.text} />
          </div>
          <span className="text-sm font-medium text-gray-800 truncate max-w-[260px]" title={file.name}>
            {file.name}
          </span>
        </div>
      </td>
      {/* Category badge */}
      <td className="px-5 py-3 hidden sm:table-cell">
        <CategoryBadge category={cat} />
      </td>
      {/* Size */}
      <td className="px-5 py-3 text-xs text-gray-500 hidden md:table-cell">
        {fmtBytes(file.sizeBytes)}
      </td>
      {/* Modified */}
      <td className="px-5 py-3 text-xs text-gray-400 hidden lg:table-cell">
        {fmtDate(file.modifiedTime)}
      </td>
      {/* Method badge */}
      <td className="px-5 py-3 hidden xl:table-cell">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          file.classificationMethod === 'ai'
            ? 'bg-indigo-50 text-indigo-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {file.classificationMethod === 'ai' ? '✦ AI' : 'MIME'}
        </span>
      </td>
    </motion.tr>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart toggle
// ---------------------------------------------------------------------------
function ChartToggle({ mode, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {[{ val: 'pie', Icon: PieChartIcon }, { val: 'bar', Icon: BarChart3 }].map(({ val, Icon }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            mode === val ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DriveClassifier() {
  const [data, setData]           = useState(null);   // { summary, categoryCounts, classifiedFiles }
  const [loading, setLoading]     = useState(true);
  const [scanning, setScanning]   = useState(false);
  const [error, setError]         = useState(null);
  const [noReport, setNoReport]   = useState(false);
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage]           = useState(1);
  const [chartMode, setChartMode] = useState('pie');

  // ── On mount: load stored report — no Drive API call ─────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadReport() {
      setLoading(true);
      setError(null);
      setNoReport(false);
      try {
        const result = await apiService.getDriveReport();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no drive report'))) {
            setNoReport(true);
          } else {
            setError(err.message || 'Failed to load Drive report.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReport();
    return () => { cancelled = true; };
  }, []);

  // ── Manual classify — only triggered by the Refresh Scan button ──────
  async function runClassify() {
    setScanning(true);
    setError(null);
    setNoReport(false);
    try {
      const result = await apiService.classifyDriveFiles();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to classify Drive files.');
    } finally {
      setScanning(false);
    }
  }

  const isBusy = loading || scanning;

  // ── Derived state ──────────────────────────────────────────────────────
  const allFiles = useMemo(() => data?.classifiedFiles || [], [data]);

  const filtered = useMemo(() => {
    let list = allFiles;
    if (activeCategory !== 'All') {
      list = list.filter((f) => f.classifiedCategory === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [allFiles, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [activeCategory, search]);

  // Chart data from API categoryCounts
  const chartData = useMemo(() => {
    if (!data?.categoryCounts) return [];
    return CATEGORIES
      .map((c) => ({ name: c, value: data.categoryCounts[c] || 0, color: CATEGORY_META[c]?.color || '#A78BFA' }))
      .filter((d) => d.value > 0);
  }, [data]);

  const totalFiles  = data?.summary?.totalFiles || 0;
  const totalBytes  = data?.summary?.totalSizeBytes || 0;
  const aiCount     = allFiles.filter((f) => f.classificationMethod === 'ai').length;
  const activeCategories = chartData.length;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-violet-50/30 px-6 py-10">
      <div className="max-w-7xl mx-auto">

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-400/20 rounded-2xl blur-xl" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Layers size={24} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-violet-900 to-purple-900 bg-clip-text text-transparent mb-1">
                  Drive File Classifier
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Every file in your Google Drive classified into categories using MIME detection and AI.
                </p>
              </div>
            </div>

            {/* Status chip */}
            <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-full px-4 py-2 shadow-md">
              {isBusy ? (
                <>
                  <RefreshCw size={14} className="text-violet-500 animate-spin" />
                  <span className="text-sm font-medium text-gray-600">
                    {loading ? 'Loading report…' : 'Classifying files…'}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">
                    {noReport ? 'No report yet — click Refresh Scan' : `${totalFiles.toLocaleString()} files · ${activeCategories} categories`}
                  </span>
                </>
              )}
            </div>

            {/* Refresh Scan button */}
            <motion.button
              whileHover={{ scale: isBusy ? 1 : 1.04 }}
              whileTap={{ scale: isBusy ? 1 : 0.97 }}
              onClick={runClassify}
              disabled={isBusy}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              {scanning ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {scanning ? 'Scanning…' : 'Refresh Scan'}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Error banner ────────────────────────────────────────────── */}
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

        {/* ── Loading state ───────────────────────────────────────────── */}
        {isBusy ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse h-80">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />
                <div className="flex items-center justify-center h-56">
                  <div className="w-44 h-44 rounded-full border-[14px] border-gray-100" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse h-80">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 animate-pulse">
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
              {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </div>

        ) : noReport ? (
          /* ── No report yet ─────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-16 shadow-xl border border-gray-100 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl flex items-center justify-center mb-6">
              <FolderOpen size={36} className="text-violet-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No previous scan available</h3>
            <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
              Run your first Drive classification scan to see how your files are organised.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={runClassify}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw size={15} />
              Scan Now
            </motion.button>
          </motion.div>
        ) : !allFiles.length ? (
          <EmptyState onRetry={runClassify} />

        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* ── Stat cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={HardDrive}
                label="Total Files"
                value={totalFiles.toLocaleString()}
                description="Across your Drive"
                colorClass="bg-blue-50 text-blue-500"
                delay={0.1}
              />
              <StatCard
                icon={Layers}
                label="Categories"
                value={activeCategories}
                description="Distinct file types found"
                colorClass="bg-violet-50 text-violet-500"
                delay={0.2}
              />
              <StatCard
                icon={CheckCircle2}
                label="Storage Used"
                value={fmtBytes(totalBytes)}
                description="Total Drive storage"
                colorClass="bg-emerald-50 text-emerald-500"
                delay={0.3}
              />
              <StatCard
                icon={Sparkles}
                label="AI Classified"
                value={aiCount.toLocaleString()}
                description="Files resolved by OpenAI"
                colorClass="bg-indigo-50 text-indigo-500"
                delay={0.4}
              />
            </div>

            {/* ── Charts + Category cards grid ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

              {/* Chart panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900 text-base">File Distribution</h2>
                  <ChartToggle mode={chartMode} onChange={setChartMode} />
                </div>

                {chartMode === 'pie' ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        formatter={(value) => (
                          <span className="text-xs text-gray-600">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Category cards grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
                className="grid grid-cols-2 gap-3 content-start"
              >
                {CATEGORIES.map((cat, i) => {
                  const count = data?.categoryCounts?.[cat] || 0;
                  if (count === 0) return null;
                  const meta = CATEGORY_META[cat];
                  const IconComp = meta.icon;
                  return (
                    <motion.button
                      key={cat}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i, duration: 0.3 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all duration-150 ${
                        activeCategory === cat
                          ? `${meta.bg} ${meta.border} shadow-md`
                          : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${meta.bg}`}>
                        <IconComp size={16} className={meta.text} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium mb-0.5">{cat}</p>
                      <p className="text-xl font-bold text-gray-900">{count.toLocaleString()}</p>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* ── File table ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              {/* Table toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter size={14} className="text-gray-400 flex-shrink-0" />
                  <FilterPill
                    label="All"
                    active={activeCategory === 'All'}
                    count={allFiles.length}
                    color="#6366F1"
                    onClick={() => setActiveCategory('All')}
                  />
                  {CATEGORIES.filter((c) => (data?.categoryCounts?.[c] || 0) > 0).map((cat) => (
                    <FilterPill
                      key={cat}
                      label={cat}
                      active={activeCategory === cat}
                      count={data.categoryCounts[cat]}
                      color={CATEGORY_META[cat]?.color || '#A78BFA'}
                      onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
                    />
                  ))}
                </div>

                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl w-52 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition"
                  />
                </div>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileSearch size={36} strokeWidth={1.5} className="mb-3" />
                  <p className="text-sm font-medium">No files match your search</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">File Name</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Size</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Modified</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((file, i) => (
                          <FileRow key={file.id} file={file} index={i} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </>
              )}
            </motion.div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
