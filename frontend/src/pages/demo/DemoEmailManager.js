import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail, ArrowLeft, Inbox, CheckSquare,
  Square, Sparkles, SlidersHorizontal, CheckCircle2,
} from 'lucide-react';
import { demoSubscriptions } from '../../data/demoData';

/**
 * DemoEmailManager — mirrors EmailManager.js.
 * Consumes demoSubscriptions. Unsubscribe updates local state only.
 */

const CATEGORY_OPTIONS = ['All', 'Marketing', 'Newsletter', 'Social', 'Updates'];

const CATEGORY_BADGE = {
  Marketing:  'bg-amber-100 text-amber-700 border-amber-200',
  Newsletter: 'bg-sky-100 text-sky-700 border-sky-200',
  Social:     'bg-pink-100 text-pink-700 border-pink-200',
  Updates:    'bg-teal-100 text-teal-700 border-teal-200',
};

function StatChip({ label, value, color }) {
  return (
    <div className={`flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border rounded-full px-3 py-1 shadow-sm ${color}`}>
      <span className="text-xs font-semibold">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function SubscriptionRow({ sub, selected, onToggle, onUnsubscribe, unsubscribed }) {
  const badge = CATEGORY_BADGE[sub.category] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-md border transition-all ${
        unsubscribed ? 'opacity-50 border-gray-100' : 'border-gray-100/50 hover:shadow-lg'
      } ${selected ? 'ring-2 ring-indigo-300 border-indigo-200' : ''}`}
    >
      <button onClick={() => onToggle(sub.email)} className="flex-shrink-0 text-gray-400 hover:text-indigo-500 transition-colors">
        {selected ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} />}
      </button>

      <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Mail size={15} className="text-indigo-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{sub.sender}</p>
        <p className="text-xs text-gray-500 truncate">{sub.email}</p>
      </div>

      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${badge}`}>
          {sub.category}
        </span>
        <span className="text-xs text-gray-400">{sub.count} emails</span>
      </div>

      {unsubscribed ? (
        <span className="text-xs font-semibold text-emerald-600 flex-shrink-0 flex items-center gap-1">
          <CheckCircle2 size={13} /> Done
        </span>
      ) : (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onUnsubscribe(sub.email)}
          disabled={!sub.canUnsubscribe}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
            sub.canUnsubscribe
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
          }`}
        >
          {sub.canUnsubscribe ? 'Unsubscribe' : 'Auto'}
        </motion.button>
      )}
    </motion.div>
  );
}

export default function DemoEmailManager() {
  const navigate = useNavigate();
  const subs = demoSubscriptions.subscriptions;
  const [unsubscribed, setUnsubscribed] = useState(new Set());
  const [selected, setSelected]       = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [actionMsg, setActionMsg]     = useState(null);

  const filteredSubs = useMemo(() => {
    if (categoryFilter === 'All') return subs;
    return subs.filter((s) => s.category === categoryFilter);
  }, [subs, categoryFilter]);

  function toggleSelect(email) {
    setSelected((prev) => { const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n; });
  }

  function toggleSelectAll() {
    const all = filteredSubs.every((s) => selected.has(s.email));
    if (all) {
      setSelected((prev) => { const n = new Set(prev); filteredSubs.forEach((s) => n.delete(s.email)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); filteredSubs.forEach((s) => n.add(s.email)); return n; });
    }
  }

  function handleUnsubscribe(email) {
    setUnsubscribed((prev) => new Set([...prev, email]));
    flashMsg('Demo: unsubscribed from sender (local state only).');
  }

  function handleBulkUnsubscribe() {
    const eligible = filteredSubs.filter((s) => selected.has(s.email) && s.canUnsubscribe);
    eligible.forEach((s) => setUnsubscribed((prev) => new Set([...prev, s.email])));
    setSelected(new Set());
    flashMsg(`Demo: unsubscribed from ${eligible.length} sender${eligible.length !== 1 ? 's' : ''}.`);
  }

  function flashMsg(msg) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  }

  const allSelected = filteredSubs.length > 0 && filteredSubs.every((s) => selected.has(s.email));
  const unsubCount  = unsubscribed.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-teal-50/30 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/demo')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-xl" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail size={22} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent mb-1">
                  Email Subscription Manager
                </h1>
                <p className="text-gray-500 text-sm">Manage newsletter & marketing subscriptions — Demo Mode</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatChip label="total"       value={subs.length}    color="border-gray-200"    />
              <StatChip label="unsubscribed" value={unsubCount}    color="border-emerald-200 text-emerald-700" />
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
              <Sparkles size={14} />
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter + bulk actions */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setCategoryFilter(opt)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  categoryFilter === opt
                    ? 'bg-emerald-600 text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt}
                {opt !== 'All' && (
                  <span className="ml-1 opacity-60">
                    ({subs.filter((s) => s.category === opt).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBulkUnsubscribe}
              className="ml-auto flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow hover:bg-red-600 transition-colors"
            >
              Unsubscribe {selected.size} selected
            </motion.button>
          )}
        </div>

        {/* Select all */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            {allSelected ? <CheckSquare size={14} className="text-indigo-500" /> : <Square size={14} />}
            Select all
          </button>
          <span className="text-xs text-gray-400 ml-1">({filteredSubs.length} shown)</span>
        </div>

        {/* Subscription rows */}
        <div className="space-y-2">
          <AnimatePresence>
            {filteredSubs.map((sub) => (
              <SubscriptionRow
                key={sub.email}
                sub={sub}
                selected={selected.has(sub.email)}
                onToggle={toggleSelect}
                onUnsubscribe={handleUnsubscribe}
                unsubscribed={unsubscribed.has(sub.email)}
              />
            ))}
          </AnimatePresence>
          {filteredSubs.length === 0 && (
            <div className="flex flex-col items-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Inbox size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No subscriptions in this category</p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-gray-400 mt-6">
          Demo Mode — unsubscribe actions only affect this session's local state.
        </p>
      </div>
    </div>
  );
}
