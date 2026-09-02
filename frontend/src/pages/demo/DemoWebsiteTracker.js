import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Globe, ArrowLeft,
  AlertTriangle, CheckCircle, Clock, Trash2,
} from 'lucide-react';
import { demoWebsiteData } from '../../data/demoData';

/**
 * DemoWebsiteTracker — mirrors WebsiteTracker.js visually.
 * Consumes demoWebsiteData. No API calls.
 */

export default function DemoWebsiteTracker() {
  const navigate = useNavigate();
  const [sites, setSites] = useState(demoWebsiteData.websites);
  const [filter, setFilter] = useState('All');
  const [actionMsg, setActionMsg] = useState(null);

  const visible = filter === 'All'
    ? sites
    : sites.filter((s) => s.status === filter.toLowerCase());

  function removeSite(domain) {
    setSites((prev) => prev.filter((s) => s.domain !== domain));
    setActionMsg(`Demo: ${domain} removed from view.`);
    setTimeout(() => setActionMsg(null), 3000);
  }

  const activeCount   = sites.filter((s) => s.status === 'active').length;
  const inactiveCount = sites.filter((s) => s.status === 'inactive').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-4 flex-wrap">
            <button onClick={() => navigate('/demo')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors mt-1">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-xl" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Globe size={22} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-1">
                Website Tracker
              </h1>
              <p className="text-gray-500 text-sm">Online accounts &amp; digital presence — Demo Mode sample data</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Tracked', value: sites.length,   color: 'bg-blue-50 border-blue-200',    icon: Globe,        text: 'text-blue-600'    },
            { label: 'Active',        value: activeCount,    color: 'bg-green-50 border-green-200',  icon: CheckCircle,  text: 'text-green-600'   },
            { label: 'Inactive',      value: inactiveCount,  color: 'bg-red-50 border-red-200',      icon: AlertTriangle, text: 'text-red-600'    },
          ].map(({ label, value, color, icon: Icon, text }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-4 border shadow-sm text-center ${color}`}
            >
              <Icon size={18} className={`${text} mx-auto mb-1.5`} />
              <div className={`text-2xl font-black ${text}`}>{value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Action message */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 mb-4 text-sm"
            >
              <CheckCircle size={14} />
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['All', 'Active', 'Inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filter === f ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Site list */}
        <div className="space-y-2">
          <AnimatePresence>
            {visible.map((site) => (
              <motion.div
                key={site.domain}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100/50 hover:shadow-lg transition-all group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe size={16} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{site.domain}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">{site.category}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      Last visited: {site.lastVisited}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                    site.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {site.status === 'active' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                    {site.status === 'active' ? 'Active' : 'Inactive'}
                  </span>

                  <button
                    onClick={() => removeSite(site.domain)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove (demo)"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {visible.length === 0 && (
            <div className="flex flex-col items-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <Globe size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No sites in this filter</p>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          Demo Mode — showing {demoWebsiteData.totalWebsites} total accounts tracked (10 shown above). Removals are local only.
        </p>
      </div>
    </div>
  );
}
