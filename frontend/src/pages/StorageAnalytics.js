import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HardDrive, ArrowLeft, RefreshCw, AlertCircle, Sparkles,
  Loader2, Trash2, FileText, Image, Video, Code2,
  Archive, FolderOpen, ExternalLink, TrendingUp,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import apiService from '../services/api';

// ─── palette ──────────────────────────────────────────────────────────────
const TYPE_META = {
  Documents:     { color: '#3B82F6', icon: FileText  },
  Images:        { color: '#EC4899', icon: Image     },
  Videos:        { color: '#8B5CF6', icon: Video     },
  Code:          { color: '#06B6D4', icon: Code2     },
  Archives:      { color: '#6B7280', icon: Archive   },
  Audio:         { color: '#F59E0B', icon: FolderOpen },
  PDFs:          { color: '#EF4444', icon: FileText  },
  Spreadsheets:  { color: '#10B981', icon: FileText  },
  Presentations: { color: '#F97316', icon: FileText  },
  Others:        { color: '#A78BFA', icon: FolderOpen },
};

const NA = 'Not analyzed yet';

// ─── helpers ──────────────────────────────────────────────────────────────
function fmtBytes(b = 0) {
  if (!b) return '0 B';
  const k = 1024, sz = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sz[i]}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function generateStorageInsights(classifierData, decayFiles) {
  const insights = [];
  if (!classifierData && !decayFiles) return insights;

  const total = classifierData?.summary?.totalFiles || 0;
  const used  = classifierData?.summary?.totalSizeBytes || 0;
  const junk  = decayFiles?.filter(f => f.isJunk)?.length || 0;

  if (junk > 0) insights.push({ text: `${junk} junk files identified by the decay model. Deleting them can reclaim significant storage.`, type: 'warning' });
  if (used > 5 * 1024 ** 3) insights.push({ text: `You are using ${fmtBytes(used)} of Drive storage. Consider archiving old files.`, type: 'info' });

  const cats = classifierData?.categoryCounts || {};
  const topCat = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];
  if (topCat) insights.push({ text: `"${topCat[0]}" is your largest file category with ${topCat[1]} files. Review for duplicates.`, type: 'info' });

  const aiCount = (classifierData?.classifiedFiles || []).filter(f => f.classificationMethod === 'ai').length;
  if (aiCount > 0) insights.push({ text: `${aiCount} files were classified using AI because their MIME type was ambiguous.`, type: 'success' });

  if (total > 500) insights.push({ text: `With ${total} files, running periodic cleanups will keep your Drive healthy and fast.`, type: 'success' });
  if (insights.length === 0) insights.push({ text: 'Your Drive looks well organized. Keep running scans to maintain hygiene.', type: 'success' });
  return insights;
}


// ─── reusable sub-components ──────────────────────────────────────────────
function SkeletonBlock({ h = 'h-32' }) {
  return <div className={`animate-pulse bg-white/60 rounded-2xl ${h} w-full`} />;
}

function StatCard({ label, value, sub, icon: Icon, gradient }) {
  return (
    <motion.div whileHover={{ y: -3 }} className={`rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <Icon size={22} className="opacity-80" />
      </div>
      <p className="text-2xl font-bold">{value ?? NA}</p>
      <p className="text-xs font-semibold opacity-80 mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-base font-bold text-gray-800 mb-4">{children}</h2>;
}

function InsightCard({ text, type = 'info' }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    danger:  'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[type]}`}>
      <Sparkles size={13} className="inline mr-1.5 opacity-70" />{text}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{name}</span>
      <span className="ml-2 text-gray-500">{value} files</span>
    </div>
  );
}

function BarTooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="ml-2 text-gray-500">{payload[0].value} files</span>
    </div>
  );
}

// Animated counter
function AnimCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let cur = 0; const step = Math.ceil(value / 40);
    const t = setInterval(() => { cur = Math.min(cur + step, value); setDisplay(cur); if (cur >= value) clearInterval(t); }, 25);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}

// File row for lists
function FileRow({ file, metric, metricLabel }) {
  const cat  = file.classifiedCategory || file.mimeType || 'Others';
  const meta = TYPE_META[cat] || TYPE_META.Others;
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.color + '20' }}>
        <Icon size={14} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate font-medium">{file.name}</p>
        <p className="text-xs text-gray-400 truncate">{cat}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-gray-700">{metric}</p>
        <p className="text-xs text-gray-400">{metricLabel}</p>
      </div>
    </div>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────
export default function StorageAnalytics() {
  const navigate = useNavigate();
  const [classifierData, setClassifierData] = useState(null);
  const [decaySummary,   setDecaySummary]   = useState(null); // eslint-disable-line no-unused-vars
  const [decayFiles,     setDecayFiles]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const results = await Promise.allSettled([
        apiService.classifyDriveFiles(),
        apiService.getDriveSummary(),
        apiService.getScoredFiles(),
      ]);
      if (results[0].status === 'fulfilled') setClassifierData(results[0].value);
      if (results[1].status === 'fulfilled') setDecaySummary(results[1].value?.summary);
      if (results[2].status === 'fulfilled') setDecayFiles(results[2].value?.files);
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) throw new Error(results[0].reason?.message || 'Failed to load storage data');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ───────────────────────────────────────────────────────────
  const allFiles    = useMemo(() => classifierData?.classifiedFiles || [], [classifierData]);
  const catCounts   = useMemo(() => classifierData?.categoryCounts  || {}, [classifierData]);
  const totalFiles  = classifierData?.summary?.totalFiles   || allFiles.length;
  const usedBytes   = classifierData?.summary?.totalSizeBytes || 0;
  const junkFiles   = useMemo(() => (decayFiles || []).filter(f => f.isJunk), [decayFiles]);
  const junkBytes   = useMemo(() => junkFiles.reduce((s, f) => s + (f.sizeBytes || 0), 0), [junkFiles]);

  const pieData = useMemo(() =>
    Object.entries(catCounts).filter(([,v]) => v > 0)
      .map(([name, value]) => ({ name, value, color: TYPE_META[name]?.color || '#A78BFA' })),
    [catCounts]
  );

  const barData = useMemo(() =>
    Object.entries(catCounts).filter(([,v]) => v > 0)
      .sort((a,b) => b[1]-a[1])
      .map(([name, value]) => ({ name, value, fill: TYPE_META[name]?.color || '#A78BFA' })),
    [catCounts]
  );

  const largestFiles = useMemo(() =>
    [...allFiles].sort((a,b) => (b.sizeBytes||0)-(a.sizeBytes||0)).slice(0,8),
    [allFiles]
  );

  const oldestFiles = useMemo(() =>
    [...allFiles].filter(f => f.modifiedTime)
      .sort((a,b) => new Date(a.modifiedTime)-new Date(b.modifiedTime)).slice(0,8),
    [allFiles]
  );

  const insights = useMemo(() => generateStorageInsights(classifierData, decayFiles), [classifierData, decayFiles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50/20 to-amber-50/20 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="h-7 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <HardDrive className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Storage Analytics</h1>
                <p className="text-xs text-gray-400">Drive classifier + decay detector</p>
              </div>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_,i) => <SkeletonBlock key={i} h="h-28" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Files"        value={totalFiles  ? <AnimCounter value={totalFiles}  /> : NA} icon={FolderOpen} gradient="from-blue-500 to-indigo-600" />
              <StatCard label="Used Storage"       value={usedBytes   ? fmtBytes(usedBytes)   : NA} icon={HardDrive}  gradient="from-yellow-500 to-amber-600" />
              <StatCard label="Recoverable"        value={junkBytes   ? fmtBytes(junkBytes)   : NA} icon={Trash2}     gradient="from-red-500 to-rose-600" sub={junkFiles.length ? `${junkFiles.length} junk files` : undefined} />
              <StatCard label="File Categories"    value={pieData.length || NA}                     icon={TrendingUp} gradient="from-violet-500 to-purple-600" />
            </div>


            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Pie – storage by type */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Storage by File Type</SectionTitle>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value">
                        {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-20 text-center">{NA}</p>}
              </div>

              {/* Bar – file count per category */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Files per Category</SectionTitle>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize:10 }} />
                      <Tooltip content={<BarTooltipCustom />} />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {barData.map(d => <Cell key={d.name} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-20 text-center">{NA}</p>}
              </div>
            </div>

            {/* File age / size lists */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Largest Files</SectionTitle>
                {largestFiles.length > 0
                  ? largestFiles.map(f => <FileRow key={f.id} file={f} metric={fmtBytes(f.sizeBytes)} metricLabel="size" />)
                  : <p className="text-sm text-gray-400 py-8 text-center">{NA}</p>}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Oldest Files</SectionTitle>
                {oldestFiles.length > 0
                  ? oldestFiles.map(f => <FileRow key={f.id} file={f} metric={fmtDate(f.modifiedTime)} metricLabel="last modified" />)
                  : <p className="text-sm text-gray-400 py-8 text-center">{NA}</p>}
              </div>
            </div>

            {/* Unused / junk files */}
            {junkFiles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Trash2 size={16} className="text-red-500" />
                  <SectionTitle>Unused / Junk Files ({junkFiles.length})</SectionTitle>
                </div>
                <div className="max-h-72 overflow-y-auto pr-1 space-y-0">
                  {junkFiles.slice(0,20).map(f => <FileRow key={f.id} file={f} metric={fmtBytes(f.sizeBytes)} metricLabel="recoverable" />)}
                  {junkFiles.length > 20 && <p className="text-xs text-gray-400 pt-2 text-center">…and {junkFiles.length - 20} more. Open Drive Decay Detector to manage them.</p>}
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-indigo-500" />
                <SectionTitle>AI Suggestions</SectionTitle>
              </div>
              <div className="space-y-3">
                {insights.length > 0
                  ? insights.map((ins,i) => <InsightCard key={i} text={ins.text} type={ins.type} />)
                  : <p className="text-sm text-gray-400">{NA}</p>}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/drive-classifier')}
                className="flex items-center justify-between bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><FolderOpen size={20} /><span>Open Drive Classifier</span></div>
                <ExternalLink size={16} />
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/drive-cleanup')}
                className="flex items-center justify-between bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><Trash2 size={20} /><span>Open Drive Decay Detector</span></div>
                <ExternalLink size={16} />
              </motion.button>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
