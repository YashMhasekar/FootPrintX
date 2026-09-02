import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Mail, Trash2, Bell, Search, ChevronDown,
  CheckSquare, Square, ShieldCheck, Inbox,
} from 'lucide-react';
import { demoEmailData } from '../../data/demoData';

/**
 * DemoEmailClassification — identical to EmailClassification.js visually.
 * Consumes demoEmailData directly. No API calls.
 * Supports: filtering, search, selection, bulk-delete (demo state only).
 */

const CATEGORY_META = [
  { key: 'Spam',         label: 'Spam',         color: '#ef4444', badge: 'bg-red-100 text-red-700 border-red-200'           },
  { key: 'Marketing',    label: 'Marketing',    color: '#f59e0b', badge: 'bg-amber-100 text-amber-700 border-amber-200'     },
  { key: 'Newsletters',  label: 'Newsletters',  color: '#0ea5e9', badge: 'bg-sky-100 text-sky-700 border-sky-200'           },
  { key: 'Social Media', label: 'Social',       color: '#ec4899', badge: 'bg-pink-100 text-pink-700 border-pink-200'        },
  { key: 'Automated',    label: 'Automated',    color: '#14b8a6', badge: 'bg-teal-100 text-teal-700 border-teal-200'        },
  { key: 'Financial',    label: 'Financial',    color: '#10b981', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'},
  { key: 'Work',         label: 'Work',         color: '#3b82f6', badge: 'bg-blue-100 text-blue-700 border-blue-200'        },
  { key: 'Personal',     label: 'Personal',     color: '#8b5cf6', badge: 'bg-violet-100 text-violet-700 border-violet-200'  },
  { key: 'Low Priority', label: 'Low Priority', color: '#94a3b8', badge: 'bg-slate-100 text-slate-600 border-slate-200'     },
];

const BADGE_MAP  = Object.fromEntries(CATEGORY_META.map((m) => [m.key, m.badge]));
const CATEGORY_OPTIONS = ['All', ...CATEGORY_META.map((m) => m.key)];

function flattenClassified(classified) {
  const rows = [];
  for (const [category, emails] of Object.entries(classified || {})) {
    for (const email of emails) {
      rows.push({ id: email.id, from: email.from || '', subject: email.subject || '(no subject)', category, date: email.date || null });
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
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const DemoEmailClassification = () => {
  const [allRows,        setAllRows]        = useState(() => flattenClassified(demoEmailData.classified));
  const [totalEmails,    setTotalEmails]    = useState(demoEmailData.totalEmails);
  const [categoryCounts] = useState(demoEmailData.categoryCounts);

  const [selectedIds,       setSelectedIds]       = useState(new Set());
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedCategory,  setSelectedCategory]  = useState('All');
  const [categoryOpen,      setCategoryOpen]      = useState(false);
  const [actionMsg,         setActionMsg]         = useState(null);

  const chartData = useMemo(
    () => CATEGORY_META
      .map((m) => ({ name: m.label, value: categoryCounts[m.key] || 0, color: m.color, key: m.key }))
      .filter((d) => d.value > 0),
    [categoryCounts]
  );

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows.filter((row) => {
      const catMatch = selectedCategory === 'All' || row.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return row.from.toLowerCase().includes(q) || row.subject.toLowerCase().includes(q);
    });
  }, [allRows, searchQuery, selectedCategory]);

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));

  // Demo: delete selected rows from local state only
  function handleMassDelete() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const deletedCount = ids.length;
    setAllRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setTotalEmails((prev) => Math.max(0, prev - deletedCount));
    setSelectedIds(new Set());
    setActionMsg(`Demo: ${deletedCount} email${deletedCount !== 1 ? 's' : ''} removed from view.`);
    setTimeout(() => setActionMsg(null), 3000);
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => { const n = new Set(prev); visibleRows.forEach((r) => n.delete(r.id)); return n; });
    } else {
      setSelectedIds((prev) => { const n = new Set(prev); visibleRows.forEach((r) => n.add(r.id)); return n; });
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <Mail className="text-white" size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Email Classification</h2>
            <p className="text-xs text-gray-400 hidden sm:block">
              {totalEmails.toLocaleString()} emails · {Object.keys(categoryCounts).length} categories · sample data
            </p>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleMassDelete}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors flex-shrink-0"
          >
            <Trash2 size={12} />
            Delete {selectedIds.size}
          </motion.button>
        )}
      </div>

      {/* Action message */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-green-50 border-b border-green-100 px-5 py-3 text-sm text-green-700"
          >
            <ShieldCheck size={14} />
            {actionMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart + stats */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Pie chart */}
          <div className="w-full sm:w-52 h-36 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} dataKey="value">
                  {chartData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value.toLocaleString()} emails`, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {chartData.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedCategory(selectedCategory === d.key ? 'All' : d.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedCategory === d.key ? 'ring-2 ring-offset-1' : ''
                } ${BADGE_MAP[d.key]}`}
                style={selectedCategory === d.key ? { ringColor: d.color } : {}}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                {d.name}
                <span className="opacity-60">{d.value.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-100 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-1 min-w-0 max-w-xs">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search sender or subject…"
            className="bg-transparent text-sm outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
          >
            {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
            <ChevronDown size={12} className={`transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {categoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 min-w-[160px]"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSelectedCategory(opt); setCategoryOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${selectedCategory === opt ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{visibleRows.length} results</span>
      </div>

      {/* Table header — desktop */}
      <div className="hidden sm:flex items-center gap-3 px-4 sm:px-5 py-2 bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <button onClick={toggleSelectAll} className="w-4 h-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          {allVisibleSelected ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} />}
        </button>
        <span className="flex-1">Sender</span>
        <span className="flex-[1.5]">Subject</span>
        <span className="w-24 flex-shrink-0">Category</span>
        <span className="w-16 flex-shrink-0 text-right">Date</span>
      </div>

      {/* Email rows */}
      <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
        {visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox size={32} className="text-gray-300 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-gray-500 font-medium">No emails match your filter</p>
            <p className="text-xs text-gray-400 mt-1">Try changing the category or search query</p>
          </div>
        ) : (
          visibleRows.map((row) => {
            const isSelected = selectedIds.has(row.id);
            const badgeClass = BADGE_MAP[row.category] || 'bg-gray-100 text-gray-600 border-gray-200';
            return (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-gray-50/80 transition-colors cursor-pointer group ${isSelected ? 'bg-blue-50/50' : ''}`}
                onClick={() => toggleSelect(row.id)}
              >
                {/* Checkbox */}
                <div className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
                  {isSelected ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} />}
                </div>
                {/* Sender — hidden on mobile, first on desktop */}
                <span className="hidden sm:block flex-1 text-sm font-medium text-gray-800 truncate">
                  {formatSender(row.from)}
                </span>
                {/* Subject + mobile sender */}
                <div className="flex-[1.5] min-w-0">
                  <span className="sm:hidden block text-xs font-semibold text-gray-700 truncate mb-0.5">{formatSender(row.from)}</span>
                  <span className="text-sm text-gray-600 truncate block">{row.subject}</span>
                </div>
                {/* Badge */}
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border w-24 justify-center flex-shrink-0 truncate ${badgeClass}`}>
                  {row.category}
                </span>
                {/* Date */}
                <span className="hidden sm:block text-xs text-gray-400 w-16 text-right flex-shrink-0">{formatDate(row.date)}</span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-500">
          {totalEmails.toLocaleString()} total · {allRows.length} loaded
        </p>
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
          <Bell size={11} />
          Demo Mode — changes are local only
        </div>
      </div>
    </div>
  );
};

export default DemoEmailClassification;
