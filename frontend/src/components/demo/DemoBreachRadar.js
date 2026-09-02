import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, Eye,
  Globe, Link, FileText, Clock, UserX, HardDrive, Key,
} from 'lucide-react';
import { demoBreachData } from '../../data/demoData';

/**
 * DemoBreachRadar — identical visual to BreachRadar.js dashboard card
 * but consumes demoBreachData directly. No API calls.
 */

const SEVERITY_META = {
  critical: { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
  high:     { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  medium:   { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  low:      { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
};

const ICON_MAP = {
  globe:        Globe,
  link:         Link,
  'file-lock':  FileText,
  clock:        Clock,
  'user-x':     UserX,
  'hard-drive': HardDrive,
  key:          Key,
};

function AlertIcon({ icon }) {
  const Icon = ICON_MAP[icon] || AlertTriangle;
  return <Icon size={18} />;
}

function ScoreArc({ score }) {
  const r    = 36;
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

const DemoBreachRadar = () => {
  const navigate  = useNavigate();
  const data      = demoBreachData;
  const criticalCount = data.statistics.criticalAlerts;
  const highCount     = data.statistics.highAlerts;
  const activeCount   = criticalCount + highCount;

  const topAlerts = [...data.alerts]
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    })
    .slice(0, 3);

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
            Privacy &amp; Security Radar
          </motion.h3>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            {activeCount > 0 ? (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                {activeCount} active alert{activeCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs font-semibold text-green-600">No critical issues</span>
            )}
            <span className="text-xs text-gray-400">from sample data</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/demo/breach-radar')}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          <Eye size={12} />
          View Details
        </button>
      </div>

      {/* Score + summary */}
      <div className="flex items-center gap-5 mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
        <ScoreArc score={data.score} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-black text-2xl text-gray-900">{data.level}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold">Moderate</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{data.summary}</p>
        </div>
      </div>

      {/* Top alerts */}
      <div className="space-y-3">
        {topAlerts.map((alert, i) => {
          const meta = SEVERITY_META[alert.severity] || SEVERITY_META.low;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-3 p-3 rounded-xl border ${meta.bg} ${meta.border}`}
            >
              <div className={`p-2 rounded-lg ${meta.bg} border ${meta.border} flex-shrink-0`}>
                <AlertIcon icon={alert.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 leading-snug">{alert.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold border capitalize ${meta.bg} ${meta.color} ${meta.border}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{alert.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View all link */}
      <button
        onClick={() => navigate('/demo/breach-radar')}
        className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 py-2.5 rounded-xl transition-colors border border-blue-100"
      >
        View all {data.alerts.length} alerts
        <Shield size={14} />
      </button>
    </motion.div>
  );
};

export default DemoBreachRadar;
