import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, Mail, HardDrive, Globe, Image,
  TrendingUp, TrendingDown, ExternalLink, CheckCircle2,
  ShieldAlert, BarChart3,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import { demoRiskScore } from '../../data/demoData';

/**
 * DemoDigitalRiskScore — mirrors DigitalRiskScore.js exactly,
 * fed with demoRiskScore. No API calls.
 */

// SkeletonBlock removed — data is always present in demo mode

function ScoreRing({ score, label }) {
  const r    = 64;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color  = score >= 90 ? '#10B981' : score >= 70 ? '#3B82F6' : score >= 50 ? '#F59E0B' : '#EF4444';
  const shadow = score >= 90
    ? '0 0 40px rgba(16,185,129,0.3)'
    : score >= 70
    ? '0 0 40px rgba(59,130,246,0.3)'
    : '0 0 40px rgba(239,68,68,0.3)';

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44" style={{ filter: `drop-shadow(${shadow})` }}>
        <svg className="w-36 h-36 sm:w-44 sm:h-44 -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} stroke="#E5E7EB" strokeWidth="12" fill="none" />
          <motion.circle
            cx="70" cy="70" r={r}
            stroke={color} strokeWidth="12" fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-4xl sm:text-5xl font-black text-gray-900"
          >
            {score}
          </motion.span>
          <span className="text-xs text-gray-400 font-medium">/100</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-3 text-center"
      >
        <span
          className={`text-lg font-bold px-4 py-1.5 rounded-full ${
            score >= 90 ? 'bg-emerald-100 text-emerald-700'
            : score >= 70 ? 'bg-blue-100 text-blue-700'
            : score >= 50 ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          {label}
        </span>
      </motion.div>
    </div>
  );
}

const DIM_META = {
  Email:    { icon: Mail,      color: '#10B981' },
  Storage:  { icon: HardDrive, color: '#F59E0B' },
  Privacy:  { icon: Shield,    color: '#3B82F6' },
  Websites: { icon: Globe,     color: '#8B5CF6' },
  Images:   { icon: Image,     color: '#EC4899' },
};

const SEVERITY_STYLE = {
  high:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700'    },
  medium: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  low:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700'   },
};

export default function DemoDigitalRiskScore() {
  const navigate = useNavigate();
  const { overall, label, dims, factors } = demoRiskScore;

  const radarData = useMemo(
    () => Object.entries(dims).map(([subject, value]) => ({ subject, value })),
    [dims]
  );
  const barData = useMemo(
    () => Object.entries(dims).map(([name, value]) => ({ name, value, fill: DIM_META[name]?.color || '#94A3B8' })),
    [dims]
  );

  const trendIcon = overall >= 70
    ? <TrendingUp size={16} className="text-emerald-500" />
    : <TrendingDown size={16} className="text-red-500" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} /> <span className="hidden xs:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Shield className="text-white" size={16} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Digital Risk Score</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Sample data · Demo Mode</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full flex-shrink-0">
            <Shield size={12} />
            Demo Mode
          </div>
        </motion.div>

        {/* Score ring + radar + bar chart */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

          {/* Score ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100/50 flex flex-col items-center justify-center"
          >
            <ScoreRing score={overall} label={label} />
            <div className="flex items-center gap-1.5 pb-5 text-sm text-gray-500">
              {trendIcon}
              <span>Overall privacy health</span>
            </div>
          </motion.div>

          {/* Radar chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-4 sm:p-6"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Risk Dimensions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(v) => [`${v}/100`]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-4 sm:p-6"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Scores by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip
                  formatter={(v) => [`${v}/100`]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Dimension cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Object.entries(dims).map(([name, value], i) => {
            const meta  = DIM_META[name];
            const Icon  = meta?.icon || BarChart3;
            const color = meta?.color || '#94A3B8';
            const risk  = 100 - value;
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/50 text-center"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="text-2xl font-black text-gray-900 mb-0.5">{value}</div>
                <div className="text-xs text-gray-400 font-medium mb-2">{name}</div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.08 }}
                  />
                </div>
                <div className="text-xs mt-1.5" style={{ color }}>
                  {risk === 0 ? 'No risk' : risk <= 15 ? 'Low risk' : risk <= 35 ? 'Moderate' : 'High risk'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Risk factors */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert size={18} className="text-amber-500" />
            <h3 className="text-base font-bold text-gray-900">Risk Factors</h3>
          </div>
          <div className="space-y-3">
            {factors.map((f, i) => {
              const s = SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.low;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border ${s.bg} ${s.border}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                  <p className={`text-sm flex-1 ${s.text} font-medium`}>{f.text}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 capitalize ${s.badge}`}>
                    {f.severity}
                  </span>
                  <button
                    onClick={() => navigate(f.route)}
                    className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                  >
                    <ExternalLink size={13} />
                  </button>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Risk factors are calculated from your demo data. Real scores update with each scan.
          </div>
        </motion.div>

      </div>
    </div>
  );
}
