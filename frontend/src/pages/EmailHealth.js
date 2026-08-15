import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail, ArrowLeft, RefreshCw, AlertCircle, Sparkles,
  Users, Inbox,
  Loader2, CheckCircle2, ShieldAlert, Brain,
  ExternalLink,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import apiService from '../services/api';

// ─── colour palette ───────────────────────────────────────────────────────
const CAT_COLORS = {
  Personal:     '#10B981',
  Work:         '#3B82F6',
  Financial:    '#F59E0B',
  'Social Media':'#8B5CF6',
  Newsletters:  '#06B6D4',
  Marketing:    '#F97316',
  Automated:    '#6B7280',
  Spam:         '#EF4444',
  'Low Priority':'#A78BFA',
};

const NA = 'Not analyzed yet';

// ─── helpers ──────────────────────────────────────────────────────────────
function pct(num, total) {
  if (!total) return '0%';
  return `${Math.round((num / total) * 100)}%`;
}

function healthScore(classified) {
  if (!classified) return null;
  const total = Object.values(classified).reduce((s, a) => s + a.length, 0);
  if (!total) return null;
  const good  = (classified.Personal?.length || 0) + (classified.Work?.length || 0) + (classified.Financial?.length || 0);
  const bad   = (classified.Spam?.length || 0) + (classified['Low Priority']?.length || 0);
  return Math.max(0, Math.min(100, Math.round(((good * 1.5 - bad * 0.5) / total) * 100)));
}

// ─── sub-components ───────────────────────────────────────────────────────
function SkeletonBlock({ h = 'h-32' }) {
  return <div className={`animate-pulse bg-white/60 rounded-2xl ${h} w-full`} />;
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? NA}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
      <Brain size={13} className="inline mr-1.5 opacity-70" />
      {text}
    </div>
  );
}

// Custom tooltip for donut
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{name}</span>
      <span className="ml-2 text-gray-500">{value} emails</span>
    </div>
  );
}


// ─── AI insight generator (pure, no extra API) ────────────────────────────
function generateInsights(classified, subs) {
  const insights = [];
  if (!classified) return insights;

  const total   = Object.values(classified).reduce((s, a) => s + a.length, 0);
  const spam    = classified.Spam?.length || 0;
  const low     = classified['Low Priority']?.length || 0;
  const promo   = classified.Marketing?.length || 0;
  const work    = classified.Work?.length || 0;
  const personal = classified.Personal?.length || 0;

  if (spam > 0)  insights.push({ text: `${spam} spam emails detected (${pct(spam, total)}). Consider running a bulk delete.`, type: 'danger' });
  if (low > total * 0.3) insights.push({ text: `${pct(low, total)} of your inbox is low-priority clutter. Cleaning it could save significant storage.`, type: 'warning' });
  if (promo > total * 0.4) insights.push({ text: `Marketing emails make up ${pct(promo, total)} of your inbox. Use Subscription Manager to unsubscribe.`, type: 'warning' });
  if (work > total * 0.3)  insights.push({ text: `${pct(work, total)} of emails are work-related — your inbox looks professionally active.`, type: 'success' });
  if (personal > 0)        insights.push({ text: `${personal} personal emails found. These are safe to keep.`, type: 'success' });
  if (subs?.length > 20)   insights.push({ text: `You have ${subs.length} active subscriptions. Bulk-unsubscribing can reduce inbox noise significantly.`, type: 'info' });
  if (insights.length === 0) insights.push({ text: 'Your inbox looks healthy! Keep running periodic scans to maintain good email hygiene.', type: 'success' });

  return insights;
}

// ─── Top senders / domains derived from classified data ───────────────────
function topSenders(classified, limit = 8) {
  const freq = {};
  Object.values(classified || {}).flat().forEach((email) => {
    if (!email?.from) return;
    const key = email.from.replace(/.*<(.+)>/, '$1').toLowerCase().trim();
    freq[key] = (freq[key] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([address, count]) => ({ address, count }));
}

function topDomains(classified, limit = 8) {
  const freq = {};
  Object.values(classified || {}).flat().forEach((email) => {
    if (!email?.from) return;
    const addr = email.from.replace(/.*<(.+)>/, '$1').toLowerCase().trim();
    const domain = addr.split('@')[1] || addr;
    if (!domain) return;
    const parts = domain.split('.');
    const key = parts.length >= 2 ? parts.slice(-2).join('.') : domain;
    freq[key] = (freq[key] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([domain, count]) => ({ domain, count }));
}

// ─── Animated counter ─────────────────────────────────────────────────────
function AnimCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}


// ─── Main page ────────────────────────────────────────────────────────────
export default function EmailHealth() {
  const navigate = useNavigate();
  const [emailData, setEmailData]   = useState(null);  // from /api/email-classification/scan
  const [subsData,  setSubsData]    = useState(null);  // from /api/email/subscriptions
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [em, su] = await Promise.allSettled([
        apiService.scanEmails(),
        apiService.getSubscriptions(),
      ]);
      if (em.status === 'fulfilled') setEmailData(em.value);
      if (su.status === 'fulfilled') setSubsData(su.value);
      if (em.status === 'rejected' && su.status === 'rejected') {
        throw new Error(em.reason?.message || 'Failed to load email data');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ───────────────────────────────────────────────────────────
  const classified  = emailData?.classified || null;
  const catCounts   = emailData?.categoryCounts || null;
  const total       = emailData?.totalEmails ?? null;
  const subs        = subsData?.subscriptions || null;
  const score       = healthScore(classified);
  const insights    = useMemo(() => generateInsights(classified, subs), [classified, subs]);

  const donutData = useMemo(() => {
    if (!catCounts) return [];
    return Object.entries(catCounts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#94A3B8' }));
  }, [catCounts]);

  const senders = useMemo(() => topSenders(classified), [classified]);
  const domains  = useMemo(() => topDomains(classified), [classified]);

  const scoreColor = score == null ? 'text-gray-400' : score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'; // eslint-disable-line no-unused-vars
  const scoreBg    = score == null ? 'from-gray-100 to-gray-200' : score >= 70 ? 'from-emerald-400 to-green-500' : score >= 40 ? 'from-amber-400 to-yellow-500' : 'from-red-400 to-rose-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/20 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="h-7 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <Mail className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Email Health</h1>
                <p className="text-xs text-gray-400">Live Gmail analytics dashboard</p>
              </div>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_, i) => <SkeletonBlock key={i} h="h-28" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Score + stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {/* Health score */}
              <motion.div whileHover={{ y: -3 }} className={`col-span-2 lg:col-span-1 rounded-2xl p-5 bg-gradient-to-br ${scoreBg} text-white shadow-lg flex flex-col items-center justify-center`}>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Health Score</p>
                <p className="text-5xl font-black">{score ?? '—'}</p>
                <p className="text-xs opacity-70 mt-1">{score == null ? NA : score >= 70 ? 'Excellent' : score >= 40 ? 'Fair' : 'Needs attention'}</p>
              </motion.div>
              <StatCard label="Emails Scanned"   value={total != null ? <AnimCounter value={total} /> : NA} icon={Inbox}       color="bg-blue-500" />
              <StatCard label="Subscriptions"    value={subs  != null ? <AnimCounter value={subs.length} /> : NA} icon={Users}  color="bg-violet-500" />
              <StatCard label="Spam Detected"    value={catCounts ? `${pct(catCounts.Spam||0, total)}` : NA}    icon={ShieldAlert} color="bg-red-500" />
              <StatCard label="Important Emails" value={catCounts ? pct((catCounts.Personal||0)+(catCounts.Work||0)+(catCounts.Financial||0), total) : NA} icon={CheckCircle2} color="bg-emerald-500" />
            </div>


            {/* Category breakdown row */}
            {catCounts && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                {Object.entries(catCounts).filter(([,v])=>v>0).map(([cat, count]) => (
                  <div key={cat} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[cat] || '#94A3B8' }} />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{cat}</p>
                      <p className="text-sm font-bold text-gray-900">{count} <span className="text-xs font-normal text-gray-400">({pct(count, total)})</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Donut chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Category Distribution</SectionTitle>
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value">
                        {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                      <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-16 text-center">{NA}</p>}
              </div>

              {/* Category area chart */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Emails by Category (Area)</SectionTitle>
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={donutData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="emailGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<DonutTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#emailGrad)" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-16 text-center">{NA}</p>}
              </div>
            </div>

            {/* Top senders + domains */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Top Senders</SectionTitle>
                {senders.length > 0 ? (
                  <div className="space-y-2">
                    {senders.map(({ address, count }, i) => (
                      <div key={address} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{address}</p>
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(count / senders[0].count) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 py-8 text-center">{NA}</p>}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <SectionTitle>Top Domains</SectionTitle>
                {domains.length > 0 ? (
                  <div className="space-y-2">
                    {domains.map(({ domain, count }, i) => (
                      <div key={domain} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4 rounded" onError={(e) => { e.currentTarget.style.display='none'; }} />
                            <p className="text-sm text-gray-700 truncate">{domain}</p>
                          </div>
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(count / domains[0].count) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 py-8 text-center">{NA}</p>}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-indigo-500" />
                <SectionTitle>AI Insights</SectionTitle>
              </div>
              <div className="space-y-3">
                {insights.length > 0
                  ? insights.map((ins, i) => <InsightCard key={i} text={ins.text} type={ins.type} />)
                  : <p className="text-sm text-gray-400">{NA}</p>}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/email-manager')}
                className="flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><Mail size={20} /><span>Email Subscription Manager</span></div>
                <ExternalLink size={16} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/email-classifier')}
                className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><Brain size={20} /><span>Email Classification</span></div>
                <ExternalLink size={16} />
              </motion.button>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
