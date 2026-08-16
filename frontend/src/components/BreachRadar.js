import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, Eye, Globe, Link, FileText,
  Clock, UserX, HardDrive, Key, CheckCircle, Loader2,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_META = {
  critical: { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
  high:     { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  medium:   { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  low:      { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
};

const ICON_MAP = {
  globe:       Globe,
  link:        Link,
  'file-lock': FileText,
  clock:       Clock,
  'user-x':    UserX,
  'hard-drive': HardDrive,
  key:         Key,
};

function AlertIcon({ icon }) {
  const Icon = ICON_MAP[icon] || AlertTriangle;
  return <Icon size={18} />;
}

function ScoreArc({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? '#10B981' : score >= 70 ? '#3B82F6' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} stroke="#E5E7EB" strokeWidth="7" fill="none" />
        <motion.circle
          cx="40" cy="40" r={r}
          stroke={color} strokeWidth="7" fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-gray-900 leading-none">{score}</span>
        <span className="text-xs text-gray-400 font-medium leading-none mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component — dashboard card
// ---------------------------------------------------------------------------

const BreachRadar = () => {
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [scanning,  setScanning]  = useState(false);
  const [error,     setError]     = useState(null);
  const [data,      setData]      = useState(null);
  const [noReport,  setNoReport]  = useState(false);

  // On mount: load stored report — no live scan.
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoReport(false);
    try {
      const result = await apiService.getBreachReport();
      setData(result);
    } catch (err) {
      // 404 means no scan has been run yet — show "no report" state
      if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no breach report'))) {
        setNoReport(true);
      } else {
        setError(err.message || 'Failed to load report.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual rescan — only triggered by the refresh button.
  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setNoReport(false);
    try {
      const result = await apiService.scanBreachRadar();
      setData(result);
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  const isBusy = loading || scanning;

  const topAlerts = data?.alerts
    ? [...data.alerts]
        .sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
        })
        .slice(0, 3)
    : [];

  const criticalCount = data?.statistics?.criticalAlerts ?? 0;
  const highCount     = data?.statistics?.highAlerts ?? 0;
  const activeCount   = criticalCount + highCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 sm:p-8 shadow-xl border border-gray-100/50 backdrop-blur-sm"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 leading-tight"
          >
            Privacy & Security Radar
          </motion.h3>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
            {isBusy ? (
              <div className="flex items-center space-x-2">
                <Loader2 size={12} className="animate-spin text-blue-500" />
                <span className="text-xs sm:text-sm text-gray-500">{loading ? 'Loading report…' : 'Scanning…'}</span>
              </div>
            ) : error ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500">Failed to load</span>
              </div>
            ) : noReport ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-400">No scan yet</span>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0 ${activeCount > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className={`text-xs sm:text-sm font-semibold ${activeCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {activeCount > 0 ? `${activeCount} Active Alert${activeCount > 1 ? 's' : ''}` : 'All Clear'}
                  </span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block" />
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Stored report</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runScan}
            disabled={isBusy}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Run fresh scan"
          >
            <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/breach-radar')}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm min-h-[36px]"
          >
            <Eye size={14} />
            <span>View All</span>
          </motion.button>
        </div>
      </div>

      {/* Error state */}
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

      {/* No report yet */}
      {noReport && !isBusy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400"
        >
          <Shield size={36} strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-600">No previous scan available</p>
          <p className="text-xs text-gray-400 text-center">Click the refresh button above to run your first scan</p>
        </motion.div>
      )}

      {/* Score + summary row */}
      {(isBusy || data) && !noReport && (
        <div className="flex items-center gap-3 sm:gap-6 mb-5 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-2xl">
          {isBusy ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          ) : (
            <ScoreArc score={data?.score ?? 0} />
          )}
          <div className="flex-1 min-w-0">
            {isBusy ? (
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-base sm:text-lg font-bold ${
                    data?.score >= 85 ? 'text-green-600' :
                    data?.score >= 70 ? 'text-blue-600' :
                    data?.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{data?.level}</span>
                  {data?.score >= 85 && <CheckCircle size={15} className="text-green-500 flex-shrink-0" />}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed break-words">{data?.summary}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-3">
        {isBusy ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))
        ) : topAlerts.length === 0 && !error && !noReport ? (
          /* Empty / healthy state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 text-center"
          >
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <h4 className="font-bold text-green-900 text-base mb-1">Excellent!</h4>
            <p className="text-sm text-green-700">No significant privacy risks detected. Your digital footprint looks healthy.</p>
          </motion.div>
        ) : (
          topAlerts.map((alert, index) => {
            const meta = SEVERITY_META[alert.severity] || SEVERITY_META.low;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`p-3 sm:p-4 rounded-xl border ${meta.bg} ${meta.border} hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <motion.div
                      className={`p-2 sm:p-2.5 rounded-xl ${meta.bg} border ${meta.border} shadow-sm group-hover:shadow-md transition-all flex-shrink-0`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <span className={meta.color}>
                        <AlertIcon icon={alert.icon} />
                      </span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{alert.title}</h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize ${meta.bg} ${meta.color} border ${meta.border}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 break-words">{alert.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Stats row */}
      {data && !isBusy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-3"
        >
          {[
            { label: 'Public Files',     value: data.statistics?.publicFiles ?? 0,      color: 'text-red-600'    },
            { label: 'Shared Files',     value: data.statistics?.sharedFiles ?? 0,      color: 'text-orange-600' },
            { label: 'Dormant Accounts', value: data.statistics?.dormantAccounts ?? 0,  color: 'text-yellow-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2.5 sm:p-3 text-center border border-gray-100">
              <p className={`text-lg sm:text-xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default BreachRadar;
