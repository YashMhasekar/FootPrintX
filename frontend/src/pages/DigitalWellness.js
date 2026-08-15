import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, ArrowLeft, RefreshCw, AlertCircle, Sparkles,
  Loader2, Mail, HardDrive, Globe, Users, Shield,
  CheckCircle2, TrendingUp, Zap, Brain, ExternalLink,
  Activity, Star,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import apiService from '../services/api';

const NA = 'Not analyzed yet';

// ─── helpers ──────────────────────────────────────────────────────────────
function fmtBytes(b = 0) {
  if (!b) return '0 B';
  const k = 1024, sz = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sz[i]}`;
}

function clamp(v, min = 0, max = 100) { return Math.min(max, Math.max(min, v)); }

// ─── Wellness score computation ───────────────────────────────────────────
function computeWellness({ emailData, subsData, websiteData, classifierData, decayFiles }) {
  let score = 50; // baseline
  const dims = { Email: 50, Storage: 50, Privacy: 50, Subscriptions: 50, Websites: 50 };

  if (emailData?.totalEmails) {
    const total = emailData.totalEmails;
    const spam  = emailData.categoryCounts?.Spam || 0;
    const good  = (emailData.categoryCounts?.Personal || 0) + (emailData.categoryCounts?.Work || 0);
    dims.Email  = clamp(Math.round(((good - spam * 2) / total) * 100 + 50));
  }

  if (classifierData?.summary || decayFiles) {
    const total = classifierData?.summary?.totalFiles || 0;
    const junk  = (decayFiles || []).filter(f => f.isJunk).length;
    dims.Storage = total ? clamp(Math.round(((total - junk) / total) * 100)) : 50;
  }

  if (subsData?.subscriptions) {
    const count = subsData.subscriptions.length;
    dims.Subscriptions = clamp(count === 0 ? 80 : Math.round(Math.max(20, 80 - count * 1.2)));
  }

  if (websiteData?.totalWebsites) {
    const active = websiteData.activeCount || 0;
    dims.Websites = clamp(Math.round(60 + (active / websiteData.totalWebsites) * 40));
  }

  dims.Privacy = clamp(Math.round((dims.Email + dims.Storage + dims.Subscriptions) / 3));

  score = clamp(Math.round(Object.values(dims).reduce((s, v) => s + v, 0) / Object.keys(dims).length));
  return { score, dims };
}

// ─── Recommendation engine ────────────────────────────────────────────────
function generateRecommendations({ emailData, subsData, websiteData, classifierData, decayFiles }) {
  const recs = [];

  const spam  = emailData?.categoryCounts?.Spam || 0;
  const total = emailData?.totalEmails || 0;
  if (spam > 0) recs.push({ text: `Delete ${spam} spam emails to improve inbox health.`, action: 'Optimize Inbox', route: '/email-manager', priority: 'high' });

  const junkFiles = (decayFiles || []).filter(f => f.isJunk);
  if (junkFiles.length > 0) recs.push({ text: `Remove ${junkFiles.length} junk Drive files to recover storage.`, action: 'Optimize Storage', route: '/drive-cleanup', priority: 'high' });

  if (subsData?.subscriptions?.length > 15) recs.push({ text: `Unsubscribe from ${subsData.subscriptions.length} email lists to reduce inbox noise.`, action: 'Manage Subscriptions', route: '/email-manager', priority: 'medium' });

  if (websiteData?.inactiveCount > 5) recs.push({ text: `You have ${websiteData.inactiveCount} inactive website accounts. Consider reviewing them.`, action: 'Review Sites', route: '/website-tracker', priority: 'medium' });

  if (total > 0 && (emailData?.categoryCounts?.['Low Priority'] || 0) / total > 0.3)
    recs.push({ text: 'Over 30% of your emails are low priority. Run a bulk cleanup.', action: 'Clean Inbox', route: '/email-manager', priority: 'medium' });

  if (recs.length === 0) recs.push({ text: 'All systems look healthy! Run a full scan periodically to stay on top of your digital wellness.', action: 'Run Full Scan', route: '/dashboard', priority: 'low' });

  return recs.slice(0, 6);
}


// ─── sub-components ───────────────────────────────────────────────────────
function SkeletonBlock({ h = 'h-32' }) {
  return <div className={`animate-pulse bg-white/60 rounded-2xl ${h} w-full`} />;
}

// Animated counter
function AnimCounter({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let cur = 0; const step = Math.ceil(value / 40);
    const t = setInterval(() => { cur = Math.min(cur + step, value); setDisplay(cur); if (cur >= value) clearInterval(t); }, 25);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

// Circular wellness score ring
function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Fair' : 'Needs Work';
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="#E5E7EB" strokeWidth="10" fill="none" />
          <motion.circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900">{score}</span>
          <span className="text-xs text-gray-500 font-medium">/100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? NA}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function RecommendationCard({ rec, onAction }) {
  const priorityStyle = {
    high:   'border-red-200 bg-red-50',
    medium: 'border-amber-200 bg-amber-50',
    low:    'border-emerald-200 bg-emerald-50',
  };
  const priorityDot = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
  return (
    <div className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${priorityStyle[rec.priority]}`}>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[rec.priority]}`} />
        <p className="text-sm text-gray-800 leading-relaxed">{rec.text}</p>
      </div>
      <button onClick={() => onAction(rec.route)}
        className="flex items-center gap-1 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
        {rec.action} <ExternalLink size={11} />
      </button>
    </div>
  );
}

function RadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{payload[0].payload.subject}</span>
      <span className="ml-2 text-gray-500">{payload[0].value}</span>
    </div>
  );
}

function BarTooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="ml-2 text-gray-500">Score: {payload[0].value}</span>
    </div>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────
export default function DigitalWellness() {
  const navigate = useNavigate();

  const [emailData,      setEmailData]      = useState(null);
  const [subsData,       setSubsData]       = useState(null);
  const [websiteData,    setWebsiteData]    = useState(null);
  const [classifierData, setClassifierData] = useState(null);
  const [decayFiles,     setDecayFiles]     = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const results = await Promise.allSettled([
        apiService.scanEmails(),
        apiService.getSubscriptions(),
        apiService.scanWebsites({ maxMessages: 100 }),
        apiService.classifyDriveFiles(),
        apiService.getScoredFiles(),
      ]);
      if (results[0].status === 'fulfilled') setEmailData(results[0].value);
      if (results[1].status === 'fulfilled') setSubsData(results[1].value);
      if (results[2].status === 'fulfilled') setWebsiteData(results[2].value);
      if (results[3].status === 'fulfilled') setClassifierData(results[3].value);
      if (results[4].status === 'fulfilled') setDecayFiles(results[4].value?.files);
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) throw new Error('All data sources failed to load. Please re-authenticate.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ───────────────────────────────────────────────────────────
  const ctx = useMemo(() => ({ emailData, subsData, websiteData, classifierData, decayFiles }), [emailData, subsData, websiteData, classifierData, decayFiles]);
  const { score, dims } = useMemo(() => computeWellness(ctx), [ctx]);
  const recommendations  = useMemo(() => generateRecommendations(ctx), [ctx]);

  const radarData = useMemo(() => Object.entries(dims).map(([subject, value]) => ({ subject, value })), [dims]);

  const dimColors = { Email:'#10B981', Storage:'#F59E0B', Privacy:'#3B82F6', Subscriptions:'#8B5CF6', Websites:'#06B6D4' };
  const barData = useMemo(() => Object.entries(dims).map(([name, value]) => ({ name, value, fill: dimColors[name] || '#94A3B8' })), [dims]); // eslint-disable-line react-hooks/exhaustive-deps

  const junkFiles    = useMemo(() => (decayFiles || []).filter(f => f.isJunk), [decayFiles]);
  const junkBytes    = useMemo(() => junkFiles.reduce((s, f) => s + (f.sizeBytes || 0), 0), [junkFiles]);
  const emailsCleaned = (emailData?.categoryCounts?.Spam || 0) + (emailData?.categoryCounts?.['Low Priority'] || 0);

  const anyData = emailData || subsData || websiteData || classifierData || decayFiles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="h-7 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <BarChart3 className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Digital Wellness</h1>
                <p className="text-xs text-gray-400">Full-system health report</p>
              </div>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Scanning all modules…' : 'Run Full Scan'}
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_,i) => <SkeletonBlock key={i} h="h-28" />)}</div>
            <div className="grid lg:grid-cols-2 gap-6">{[...Array(2)].map((_,i) => <SkeletonBlock key={i} h="h-72" />)}</div>
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>

            {/* Top row: score + dimension tiles */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Score card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center">
                <p className="text-sm font-bold text-gray-600 pt-5">Overall Wellness Score</p>
                <ScoreRing score={anyData ? score : 0} />
                <p className="text-xs text-gray-400 pb-5">{anyData ? 'Based on all scanned modules' : NA}</p>
              </div>

              {/* Dimension scores */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
                {Object.entries(dims).map(([key, val]) => {
                  const icons = { Email: Mail, Storage: HardDrive, Privacy: Shield, Subscriptions: Users, Websites: Globe };
                  const Icon = icons[key] || Activity;
                  const c = val >= 70 ? 'text-emerald-600' : val >= 40 ? 'text-amber-600' : 'text-red-600';
                  const bg = val >= 70 ? 'bg-emerald-50' : val >= 40 ? 'bg-amber-50' : 'bg-red-50';
                  return (
                    <motion.div key={key} whileHover={{ y:-2 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${bg}`}>
                        <Icon size={16} className={c} />
                      </div>
                      <p className={`text-2xl font-black ${c}`}>{anyData ? val : '—'}</p>
                      <p className="text-xs text-gray-500 font-medium">{key}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>


            {/* Metric tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <MetricTile icon={Mail}      label="Emails Scanned"       value={emailData?.totalEmails != null ? <AnimCounter value={emailData.totalEmails} /> : NA}         color="text-green-600"  bg="bg-green-50" />
              <MetricTile icon={CheckCircle2} label="Emails Cleanable"  value={emailsCleaned > 0 ? <AnimCounter value={emailsCleaned} /> : NA}                             color="text-blue-600"   bg="bg-blue-50" />
              <MetricTile icon={HardDrive} label="Storage Recoverable"  value={junkBytes > 0 ? fmtBytes(junkBytes) : NA}                                                   color="text-amber-600"  bg="bg-amber-50" />
              <MetricTile icon={Users}     label="Subscriptions Found"  value={subsData?.subscriptions?.length != null ? <AnimCounter value={subsData.subscriptions.length} /> : NA} color="text-violet-600" bg="bg-violet-50" />
              <MetricTile icon={Globe}     label="Websites Tracked"     value={websiteData?.totalWebsites != null ? <AnimCounter value={websiteData.totalWebsites} /> : NA} color="text-cyan-600"   bg="bg-cyan-50" />
              <MetricTile icon={Shield}    label="Risk Alerts"          value={emailData?.categoryCounts?.Spam ? <AnimCounter value={emailData.categoryCounts.Spam} /> : '0'} color="text-red-600"  bg="bg-red-50" sub="spam detected" />
            </div>

            {/* Charts: Radar + Bar */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-4"><Star size={15} className="text-indigo-500" /><h2 className="text-base font-bold text-gray-800">Dimension Radar</h2></div>
                {anyData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="Score" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip content={<RadarTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-20 text-center">{NA}</p>}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-emerald-500" /><h2 className="text-base font-bold text-gray-800">Module Health Scores</h2></div>
                {anyData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize:11 }} />
                      <YAxis domain={[0,100]} tick={{ fontSize:10 }} />
                      <Tooltip content={<BarTooltipCustom />} />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {barData.map(d => <Cell key={d.name} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-20 text-center">{NA}</p>}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex items-center gap-2 mb-5">
                <Brain size={16} className="text-indigo-500" />
                <h2 className="text-base font-bold text-gray-800">Recommendations</h2>
                <span className="ml-auto text-xs text-gray-400">Based on your current data</span>
              </div>
              {anyData ? (
                <div className="space-y-3">
                  {recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} onAction={navigate} />)}
                </div>
              ) : <p className="text-sm text-gray-400">{NA} — run a scan to generate personalised recommendations.</p>}
            </div>

            {/* Quick action buttons */}
            <div className="grid sm:grid-cols-3 gap-4">
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/email-manager')}
                className="flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><Mail size={20} /><span>Optimize Inbox</span></div>
                <ExternalLink size={16} />
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/drive-cleanup')}
                className="flex items-center justify-between bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><HardDrive size={20} /><span>Optimize Storage</span></div>
                <ExternalLink size={16} />
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={load} disabled={loading}
                className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                  <span>{loading ? 'Scanning…' : 'Run Full Scan'}</span>
                </div>
                <Sparkles size={16} />
              </motion.button>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
