import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, ArrowLeft, FileText, Image, Video,
  Music, File, Archive, Code2, Table, Search,
  ChevronLeft, ChevronRight, BarChart3, HardDrive,
  Sparkles, Layers,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { demoDriveClassifierData } from '../../data/demoData';

/**
 * DemoDriveClassifier — mirrors DriveClassifier.js.
 * Consumes demoDriveClassifierData. No API calls.
 */

const CATEGORIES = [
  'Documents', 'Images', 'Videos', 'Audio', 'PDFs',
  'Presentations', 'Spreadsheets', 'Archives', 'Code', 'Others',
];

const CATEGORY_META = {
  Documents:     { icon: FileText,  color: '#3B82F6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200'    },
  Images:        { icon: Image,     color: '#EC4899', bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200'    },
  Videos:        { icon: Video,     color: '#8B5CF6', bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200'  },
  Audio:         { icon: Music,     color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200'   },
  PDFs:          { icon: File,      color: '#EF4444', bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200'     },
  Presentations: { icon: FileText,  color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200'  },
  Spreadsheets:  { icon: Table,     color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  Archives:      { icon: Archive,   color: '#6B7280', bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200'    },
  Code:          { icon: Code2,     color: '#06B6D4', bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200'    },
  Others:        { icon: FolderOpen,color: '#A78BFA', bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200'  },
};

const PAGE_SIZE = 15;

function fmtBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Others;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
      <meta.icon size={10} />
      {category}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, description, colorClass, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
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

export default function DemoDriveClassifier() {
  const navigate  = useNavigate();
  const { summary, classifiedFiles } = demoDriveClassifierData;

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [page,           setPage]           = useState(1);

  const filtered = useMemo(() => {
    let rows = classifiedFiles;
    if (categoryFilter !== 'All') rows = rows.filter((f) => f.classifiedCategory === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((f) => f.name.toLowerCase().includes(q));
    }
    return rows;
  }, [classifiedFiles, categoryFilter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pieData = useMemo(
    () => Object.entries(summary.categoryBreakdown)
      .filter(([, v]) => v.count > 0)
      .map(([name, v]) => ({ name, value: v.count, color: CATEGORY_META[name]?.color || '#94A3B8' })),
    [summary]
  );

  const barData = useMemo(
    () => CATEGORIES
      .map((c) => ({
        name:  c,
        count: summary.categoryBreakdown[c]?.count || 0,
        fill:  CATEGORY_META[c]?.color || '#94A3B8',
      }))
      .filter((d) => d.count > 0),
    [summary]
  );

  function handleCategoryFilter(cat) {
    setCategoryFilter(cat);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/demo')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-xl" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FolderOpen size={22} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-1">
                  Drive File Classifier
                </h1>
                <p className="text-gray-500 text-sm">AI-powered file classification — Demo Mode sample data</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/80 border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">{summary.totalFiles} files · {fmtBytes(summary.totalSizeBytes)}</span>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard icon={BarChart3}   label="Total Files"   value={summary.totalFiles} description="Classified by AI"               colorClass="bg-blue-50 text-blue-600"    delay={0.1} />
          <StatCard icon={HardDrive}   label="Total Size"    value={fmtBytes(summary.totalSizeBytes)} description="Across all categories" colorClass="bg-purple-50 text-purple-600" delay={0.2} />
          <StatCard icon={Layers}      label="Categories"    value={Object.values(summary.categoryBreakdown).filter((v) => v.count > 0).length} description="File types detected" colorClass="bg-emerald-50 text-emerald-600" delay={0.3} />
          <StatCard icon={Sparkles}    label="Largest Cat."  value={Object.entries(summary.categoryBreakdown).sort((a,b) => b[1].count - a[1].count)[0]?.[0] || '—'} description="By file count" colorClass="bg-amber-50 text-amber-600" delay={0.4} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Files by Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} files`, n]} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">File Count per Category</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={22}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <Tooltip formatter={(v, n) => [`${v} files`, n]} contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleCategoryFilter('All')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${categoryFilter === 'All' ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            All ({classifiedFiles.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = summary.categoryBreakdown[cat]?.count || 0;
            if (!count) return null;
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1 ${
                  categoryFilter === cat ? `${meta.bg} ${meta.text} ${meta.border} ring-2 ring-offset-1` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <meta.icon size={10} />
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search + file table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2 flex-1 max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search files…"
                className="bg-transparent text-sm outline-none w-full"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} results</span>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-2 bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>File Name</span>
            <span>Category</span>
            <span>Size</span>
            <span>Modified</span>
          </div>

          <div className="divide-y divide-gray-50 max-h-[460px] overflow-y-auto">
            {pageItems.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <FolderOpen size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-500">No files match</p>
              </div>
            ) : (
              pageItems.map((file, i) => {
                const meta = CATEGORY_META[file.classifiedCategory] || CATEGORY_META.Others;
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                        <meta.icon size={13} className={meta.text} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                    </div>
                    <div className="hidden sm:block">
                      <CategoryBadge category={file.classifiedCategory} />
                    </div>
                    <span className="hidden sm:block text-sm text-gray-500 font-mono">{fmtBytes(file.sizeBytes)}</span>
                    <span className="hidden sm:block text-xs text-gray-400">{fmtDate(file.modifiedTime)}</span>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 disabled:opacity-40 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 disabled:opacity-40 hover:text-gray-900 transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
