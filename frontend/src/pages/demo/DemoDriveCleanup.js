import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HardDrive, ArrowLeft, Trash2, FolderOpen,
  CheckCircle2, BarChart3, Sparkles,
} from 'lucide-react';
import { demoDriveFiles, demoDriveSummary } from '../../data/demoData';

/**
 * DemoDriveCleanup — mirrors DriveCleanup.js / DriveDecay UI.
 * Feeds demoDriveFiles + demoDriveSummary. No API calls.
 * "Delete" removes files from local demo state only.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function decayLabel(score) {
  if (score >= 0.8) return { label: 'High Decay',  badge: 'bg-red-100 text-red-700 border-red-200'       };
  if (score >= 0.5) return { label: 'Med Decay',   badge: 'bg-amber-100 text-amber-700 border-amber-200' };
  return               { label: 'Low Decay',   badge: 'bg-green-100 text-green-700 border-green-200'  };
}

const CATEGORY_COLORS = {
  Documents: '#2DD4BF',
  Media:     '#8B5CF6',
  Archives:  '#F59E0B',
  Folders:   '#64748B',
  Other:     '#F43F5E',
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, description, accentColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100/50"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}18` }}>
          <Icon size={20} style={{ color: accentColor }} />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// File row
// ---------------------------------------------------------------------------
function FileRow({ file, onDelete, isSelected, onToggle }) {
  const { label, badge } = decayLabel(file.decayScore);
  const scorePct = Math.round((file.decayScore ?? 0) * 100);
  const scoreColor = file.decayScore >= 0.7
    ? 'text-red-600 border-red-300'
    : file.decayScore >= 0.4
    ? 'text-amber-600 border-amber-300'
    : 'text-green-600 border-green-300';

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50/50' : ''}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(file.id)}
        className="w-3.5 h-3.5 rounded accent-indigo-600 flex-shrink-0 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-500 truncate">{file.category} · {fmtBytes(file.sizeBytes)}</p>
      </div>
      <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${badge}`}>
        {label}
      </span>
      <div className={`hidden sm:flex w-12 h-12 rounded-full border-2 items-center justify-center font-mono text-xs flex-shrink-0 ${scoreColor}`}>
        {scorePct}%
      </div>
      {file.isJunk && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(file.id)}
          className="flex-shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove from view (demo)"
        >
          <Trash2 size={13} />
        </motion.button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DemoDriveCleanup() {
  const navigate = useNavigate();
  const [files, setFiles]       = useState(demoDriveFiles);
  const [selected, setSelected] = useState(new Set());
  const [actionMsg, setActionMsg] = useState(null);
  const [filter, setFilter]     = useState('All'); // All | Junk | Clean

  const junkFiles  = useMemo(() => files.filter((f) => f.isJunk),  [files]);
  const cleanFiles = useMemo(() => files.filter((f) => !f.isJunk), [files]);
  const junkRatio  = files.length ? Math.round((junkFiles.length / files.length) * 100) : 0;

  const visibleFiles = useMemo(() => {
    if (filter === 'Junk')  return junkFiles;
    if (filter === 'Clean') return cleanFiles;
    return files;
  }, [files, junkFiles, cleanFiles, filter]);

  function toggleSelect(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function deleteFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    flashMsg('File removed from demo view.');
  }

  function bulkDelete() {
    const ids  = [...selected];
    const count = ids.length;
    setFiles((prev) => prev.filter((f) => !selected.has(f.id)));
    setSelected(new Set());
    flashMsg(`Demo: ${count} file${count !== 1 ? 's' : ''} removed from view.`);
  }

  function flashMsg(msg) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  }

  // Summary for chart — category breakdown of remaining files
  const totalBytes = useMemo(
    () => Object.values(demoDriveSummary).reduce((s, v) => s + v.sizeBytes, 0),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-violet-50/30 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/demo')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div className="relative">
                <div className="absolute inset-0 bg-violet-400/20 rounded-2xl blur-xl" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <HardDrive size={22} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-violet-900 to-purple-900 bg-clip-text text-transparent mb-1">
                  Drive Decay Detector
                </h1>
                <p className="text-gray-500 text-sm">AI-powered storage intelligence — Demo Mode sample data</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/80 border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">{files.length} files · {junkFiles.length} flagged</span>
            </div>
          </div>
        </motion.div>

        {/* Action message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 mb-6 text-sm"
            >
              <CheckCircle2 size={14} />
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard icon={BarChart3}   label="Total Files"   value={files.length.toLocaleString()} description="Analysed by ML model"         accentColor="#6366F1" delay={0.1} />
          <StatCard icon={Trash2}      label="Flagged Junk"  value={junkFiles.length.toLocaleString()} description="Recommended for cleanup"  accentColor="#EF4444" delay={0.2} />
          <StatCard icon={CheckCircle2} label="Clean Files"  value={cleanFiles.length.toLocaleString()} description="No action needed"        accentColor="#10B981" delay={0.3} />
          <StatCard icon={Sparkles}    label="Junk Ratio"    value={`${junkRatio}%`}               description="Of total storage scanned"    accentColor="#F59E0B" delay={0.4} />
        </div>

        {/* Chart + file list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Storage breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100/50"
          >
            <div className="flex items-baseline justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Storage by Category</h3>
              <span className="text-sm text-gray-400 font-mono">{fmtBytes(totalBytes)} total</span>
            </div>
            <div className="space-y-3">
              {Object.entries(demoDriveSummary).map(([cat, info]) => {
                const pct = totalBytes > 0 ? (info.sizeBytes / totalBytes) * 100 : 0;
                const color = CATEGORY_COLORS[cat] || '#94A3B8';
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-700">{cat}</span>
                      </div>
                      <span className="text-gray-500 font-mono">{fmtBytes(info.sizeBytes)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* File list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
          >
            {/* List header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex gap-1.5">
                {['All', 'Junk', 'Clean'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      filter === f
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {selected.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={bulkDelete}
                  className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={11} />
                  Delete {selected.size}
                </motion.button>
              )}
            </div>

            <h3 className="text-sm font-semibold text-gray-700 px-4 py-2.5 border-b border-gray-50">
              Files ranked by decay score
            </h3>

            <div className="max-h-[420px] overflow-y-auto">
              <AnimatePresence>
                {visibleFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={deleteFile}
                    isSelected={selected.has(file.id)}
                    onToggle={toggleSelect}
                  />
                ))}
              </AnimatePresence>
              {visibleFiles.length === 0 && (
                <div className="flex flex-col items-center py-10 text-center">
                  <FolderOpen size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-gray-500">No files in this filter</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
