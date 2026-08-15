import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, RefreshCw, AlertCircle, Loader2,
  Mail, HardDrive, Globe, Users, Image, TrendingUp,
  TrendingDown, Brain, ExternalLink, CheckCircle2,
  AlertTriangle, ShieldAlert, BarChart3,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import apiService from '../services/api';

const NA = 'Not analyzed yet';

// ── helpers ────────────────────────────────────────────────────────────────
function clamp(v, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }
function pct(n, d) { return d > 0 ? n / d : 0; }

// ── Risk computation ───────────────────────────────────────────────────────
// Returns { overallRisk 0-100, label, dimensions{}, factors[] }
// Lower score = HIGHER risk (displayed as "Risk Score")
// We invert to show 0=worst 100=best for display.
function computeRisk({ emailData, subsData, websiteData, classifierData, decayFiles }) {
  const factors  = [];
  const dims     = { Email: 100, Storage: 100, Privacy: 100, Websites: 100, Images: 100 };

  // ── Email factors ────────────────────────────────────────────────────
  if (emailData?.totalEmails) {
    const total  = emailData.totalEmails;
    const spam   = emailData.categoryCounts?.Spam        || 0;
    const promo  = emailData.categoryCounts?.Marketing   || 0;
    const low    = emailData.categoryCounts?.['Low Priority'] || 0;

    const spamPct  = pct(spam,  total);
    const promoPct = pct(promo, total);
    const lowPct   = pct(low,   total);

    let emailRisk = 0;
    if (spamPct > 0.10) { emailRisk += 30; factors.push({ text:`Spam makes up ${Math.round(spamPct*100)}% of your inbox`, severity:'high',   route:'/email-manager' }); }
    else if (spamPct > 0) { emailRisk += 10; factors.push({ text:`${spam} spam emails found`, severity:'medium', route:'/email-manager' }); }
    if (promoPct > 0.40) { emailRisk += 20; factors.push({ text:`${Math.round(promoPct*100)}% of emails are promotions — high inbox noise`, severity:'medium', route:'/email-manager' }); }
    if (lowPct   > 0.30) { emailRisk += 15; factors.push({ text:`${Math.round(lowPct*100)}% low-priority emails cluttering your inbox`, severity:'low', route:'/email-manager' }); }
    dims.Email = clamp(100 - emailRisk);
  }

  // ── Storage / Drive factors ──────────────────────────────────────────
  const allFiles  = classifierData?.classifiedFiles || [];
  const junkFiles = (decayFiles || []).filter(f => f.isJunk);
  const totalFiles = classifierData?.summary?.totalFiles || allFiles.length;

  if (totalFiles > 0) {
    let storRisk = 0;
    const junkPct = pct(junkFiles.length, totalFiles);
    if (junkPct > 0.30) { storRisk += 25; factors.push({ text:`${Math.round(junkPct*100)}% of Drive files are unused/decayed`, severity:'high', route:'/drive-cleanup' }); }
    else if (junkFiles.length > 0) { storRisk += 10; factors.push({ text:`${junkFiles.length} junk files found in Drive`, severity:'medium', route:'/drive-cleanup' }); }

    const largeFiles = allFiles.filter(f => (f.sizeBytes||0) > 50*1024*1024);
    if (largeFiles.length > 10) { storRisk += 15; factors.push({ text:`${largeFiles.length} files larger than 50 MB detected`, severity:'medium', route:'/drive-classifier' }); }

    const archives  = allFiles.filter(f => f.classifiedCategory === 'Archives');
    if (archives.length > 20)  { storRisk += 10; factors.push({ text:`${archives.length} archive files — review for old zips`, severity:'low', route:'/drive-classifier' }); }
    dims.Storage = clamp(100 - storRisk);
  }

  // ── Subscription / Privacy factors ──────────────────────────────────
  if (subsData?.subscriptions) {
    const count = subsData.subscriptions.length;
    let privRisk = 0;
    if (count > 50) { privRisk += 30; factors.push({ text:`${count} email subscriptions expose your address widely`, severity:'high',   route:'/email-manager' }); }
    else if (count > 20) { privRisk += 15; factors.push({ text:`${count} active subscriptions — consider unsubscribing from unused ones`, severity:'medium', route:'/email-manager' }); }
    else if (count > 0)  { privRisk += 5;  }
    dims.Privacy = clamp(100 - privRisk);
  }

  // ── Website factors ──────────────────────────────────────────────────
  if (websiteData?.totalWebsites) {
    const inactivePct = pct(websiteData.inactiveCount || 0, websiteData.totalWebsites);
    let webRisk = 0;
    if (inactivePct > 0.50) { webRisk += 25; factors.push({ text:`${Math.round(inactivePct*100)}% of tracked websites are inactive — old accounts`, severity:'high',   route:'/website-tracker' }); }
    else if (websiteData.inactiveCount > 5) { webRisk += 10; factors.push({ text:`${websiteData.inactiveCount} inactive website accounts detected`, severity:'medium', route:'/website-tracker' }); }
    dims.Websites = clamp(100 - webRisk);
  }

  // ── Image / duplicate factors ────────────────────────────────────────
  const IMAGE_MIMES = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/gif','image/bmp']);
  const images = allFiles.filter(f => IMAGE_MIMES.has(f.mimeType));
  if (images.length > 0) {
    const dupCheck = {};
    images.forEach(f => {
      const key = `${(f.name||'').replace(/\.[^.]+$/,'').toLowerCase()}_${f.sizeBytes||0}`;
      dupCheck[key] = (dupCheck[key]||0)+1;
    });
    const dupCount  = Object.values(dupCheck).filter(v=>v>1).reduce((s,v)=>s+(v-1),0);
    const largeImgs = images.filter(f => (f.sizeBytes||0) > 5*1024*1024);
    let imgRisk = 0;
    if (dupCount > 10)     { imgRisk += 20; factors.push({ text:`${dupCount} duplicate images wasting storage`, severity:'medium', route:'/photos-scanner' }); }
    if (largeImgs.length > 10) { imgRisk += 15; factors.push({ text:`${largeImgs.length} large images (>5MB) consuming Drive space`, severity:'low', route:'/photos-scanner' }); }
    dims.Images = clamp(100 - imgRisk);
  }

  // ── Overall ──────────────────────────────────────────────────────────
  const overall = clamp(Math.round(Object.values(dims).reduce((s,v)=>s+v,0) / Object.keys(dims).length));

  if (factors.length === 0 && (emailData || subsData || classifierData || websiteData)) {
    factors.push({ text:'No significant risks detected. Keep running periodic scans.', severity:'low', route:'/dashboard' });
  }

  const label = overall >= 90 ? 'Excellent'
              : overall >= 70 ? 'Good'
              : overall >= 50 ? 'Moderate'
              : 'High Risk';

  return { overall, label, dims, factors: factors.slice(0, 8) };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SkeletonBlock({ h='h-28' }) {
  return <div className={`animate-pulse bg-white/60 rounded-2xl ${h} w-full`}/>;
}

// Large animated score ring
function ScoreRing({ score, label, hasData }) {
  const r = 64, circ = 2 * Math.PI * r;
  const dash = ((hasData ? score : 0) / 100) * circ;
  const color  = score >= 90 ? '#10B981' : score >= 70 ? '#3B82F6' : score >= 50 ? '#F59E0B' : '#EF4444';
  const shadow = score >= 90 ? '0 0 40px rgba(16,185,129,0.3)' : score >= 70 ? '0 0 40px rgba(59,130,246,0.3)' : '0 0 40px rgba(239,68,68,0.3)';

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-44 h-44" style={{ filter: `drop-shadow(${shadow})` }}>
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} stroke="#E5E7EB" strokeWidth="12" fill="none"/>
          <motion.circle cx="70" cy="70" r={r} stroke={color} strokeWidth="12" fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray:`0 ${circ}` }}
            animate={{ strokeDasharray:`${dash} ${circ}` }}
            transition={{ duration:1.5, ease:'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.5, type:'spring' }}
            className="text-5xl font-black text-gray-900">
            {hasData ? score : '—'}
          </motion.span>
          <span className="text-xs text-gray-400 font-medium">/100</span>
        </div>
      </div>
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
        className="mt-3 px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
        style={{ backgroundColor: color }}>
        {hasData ? label : NA}
      </motion.div>
    </div>
  );
}

// Animated counter
function AnimCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let cur = 0; const step = Math.ceil(value / 50);
    const t = setInterval(() => { cur = Math.min(cur+step, value); setDisplay(cur); if (cur>=value) clearInterval(t); }, 20);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display}</span>;
}

function DimCard({ label, score, icon:Icon, hasData }) {
  const color  = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const bgCls  = score >= 70 ? 'bg-emerald-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50';
  const txtCls = score >= 70 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-red-700';
  return (
    <motion.div whileHover={{ y:-3 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 text-center">
      <div className={`w-10 h-10 ${bgCls} rounded-xl flex items-center justify-center mx-auto mb-3`}>
        <Icon size={18} className={txtCls}/>
      </div>
      <p className={`text-3xl font-black ${txtCls}`}>{hasData ? (hasData ? <AnimCounter value={score}/> : score) : '—'}</p>
      <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width:0 }} animate={{ width:`${hasData ? score : 0}%` }} transition={{ duration:1, delay:0.3 }}
          className="h-1.5 rounded-full" style={{ backgroundColor: color }}/>
      </div>
    </motion.div>
  );
}

function FactorCard({ factor, navigate }) {
  const styles = {
    high:   { cls:'bg-red-50 border-red-200',    dot:'bg-red-500',    icon: ShieldAlert,    iconCls:'text-red-500' },
    medium: { cls:'bg-amber-50 border-amber-200', dot:'bg-amber-500',  icon: AlertTriangle,  iconCls:'text-amber-500' },
    low:    { cls:'bg-blue-50 border-blue-200',   dot:'bg-blue-400',   icon: CheckCircle2,   iconCls:'text-blue-400' },
  };
  const s = styles[factor.severity] || styles.low;
  const Icon = s.icon;
  return (
    <div className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${s.cls}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon size={16} className={`mt-0.5 flex-shrink-0 ${s.iconCls}`}/>
        <p className="text-sm text-gray-800 leading-relaxed">{factor.text}</p>
      </div>
      {factor.route && factor.route !== '/dashboard' && (
        <button onClick={() => navigate(factor.route)}
          className="flex items-center gap-1 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
          Fix <ExternalLink size={10}/>
        </button>
      )}
    </div>
  );
}

function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{payload[0].payload.subject}</span>
      <span className="ml-2 text-gray-500">{payload[0].value}/100</span>
    </div>
  );
}
function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="ml-2 text-gray-500">Score: {payload[0].value}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DigitalRiskScore() {
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
      // Load stored reports from MongoDB — no live scans.
      const res = await Promise.allSettled([
        apiService.getEmailReport(),
        apiService.getSubscriptions(),
        apiService.getWebsiteReport(),
        apiService.getDriveReport(),
        apiService.getScoredFiles(),
      ]);
      if (res[0].status === 'fulfilled') setEmailData(res[0].value);
      if (res[1].status === 'fulfilled') setSubsData(res[1].value);
      if (res[2].status === 'fulfilled') setWebsiteData(res[2].value);
      if (res[3].status === 'fulfilled') setClassifierData(res[3].value);
      if (res[4].status === 'fulfilled') setDecayFiles(res[4].value?.files);
      if (res.every(r => r.status === 'rejected'))
        throw new Error('No stored reports found. Please run individual scans first.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Manual rescan — replaces all stored data with fresh live scans.
  async function runFullRescan() {
    setLoading(true); setError(null);
    try {
      const res = await Promise.allSettled([
        apiService.scanEmails(),
        apiService.getSubscriptions(),
        apiService.scanWebsites({ maxMessages: 100 }),
        apiService.classifyDriveFiles(),
        apiService.getScoredFiles(),
      ]);
      if (res[0].status === 'fulfilled') setEmailData(res[0].value);
      if (res[1].status === 'fulfilled') setSubsData(res[1].value);
      if (res[2].status === 'fulfilled') setWebsiteData(res[2].value);
      if (res[3].status === 'fulfilled') setClassifierData(res[3].value);
      if (res[4].status === 'fulfilled') setDecayFiles(res[4].value?.files);
      if (res.every(r => r.status === 'rejected'))
        throw new Error('All data sources failed. Please re-authenticate.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ──────────────────────────────────────────────────────────
  const ctx = useMemo(() => ({ emailData, subsData, websiteData, classifierData, decayFiles }), [emailData, subsData, websiteData, classifierData, decayFiles]);
  const { overall, label, dims, factors } = useMemo(() => computeRisk(ctx), [ctx]);
  const anyData = emailData || subsData || websiteData || classifierData || decayFiles;

  const DIM_META = {
    Email:   { icon: Mail,      color:'#10B981' },
    Storage: { icon: HardDrive, color:'#F59E0B' },
    Privacy: { icon: Shield,    color:'#3B82F6' },
    Websites:{ icon: Globe,     color:'#8B5CF6' },
    Images:  { icon: Image,     color:'#EC4899' },
  };

  const radarData = useMemo(() =>
    Object.entries(dims).map(([subject, value]) => ({ subject, value })),
    [dims]
  );
  const barData = useMemo(() =>
    Object.entries(dims).map(([name, value]) => ({ name, value, fill: DIM_META[name]?.color || '#94A3B8' })),
    [dims] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Stats from raw data
  const totalEmails = emailData?.totalEmails || 0;
  const spamCount   = emailData?.categoryCounts?.Spam || 0;
  const junkFiles   = useMemo(() => (decayFiles||[]).filter(f=>f.isJunk), [decayFiles]);
  const subsCount   = subsData?.subscriptions?.length || 0;
  const inactiveSites = websiteData?.inactiveCount || 0;

  const trendIcon = overall >= 70
    ? <TrendingUp size={16} className="text-emerald-500"/>
    : <TrendingDown size={16} className="text-red-500"/>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18}/> Back
            </button>
            <div className="h-7 w-px bg-gray-200"/>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="text-white" size={18}/>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Digital Risk Score</h1>
                <p className="text-xs text-gray-400">Loaded from stored reports</p>
              </div>
            </div>
          </div>
          <button onClick={runFullRescan} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
            {loading ? 'Analysing…' : 'Rescan'}
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0"/>{error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[...Array(5)].map((_,i)=><SkeletonBlock key={i}/>)}</div>
            <div className="grid lg:grid-cols-2 gap-6">{[...Array(2)].map((_,i)=><SkeletonBlock key={i} h="h-72"/>)}</div>
            <div className="space-y-3">{[...Array(4)].map((_,i)=><SkeletonBlock key={i} h="h-16"/>)}</div>
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>

            {/* Top: score ring + dimension cards */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Score ring panel */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
                <p className="text-sm font-bold text-gray-600 pt-6">Digital Risk Score</p>
                <ScoreRing score={overall} label={label} hasData={!!anyData}/>
                <div className="flex items-center gap-2 pb-6">
                  {trendIcon}
                  <span className="text-xs text-gray-500">{anyData ? `${label} — based on all modules` : NA}</span>
                </div>
              </div>

              {/* Dimension cards */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
                {Object.entries(dims).map(([key, val]) => {
                  const meta = DIM_META[key] || { icon: BarChart3 };
                  return <DimCard key={key} label={key} score={val} icon={meta.icon} hasData={!!anyData}/>;
                })}
              </div>
            </div>

            {/* Stats tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { icon:Mail,        label:'Emails Scanned',    value: totalEmails,     color:'text-green-600',  bg:'bg-green-50'  },
                { icon:ShieldAlert, label:'Spam Detected',     value: spamCount,       color:'text-red-600',    bg:'bg-red-50'    },
                { icon:HardDrive,   label:'Junk Files',        value: junkFiles.length,color:'text-amber-600',  bg:'bg-amber-50'  },
                { icon:Users,       label:'Subscriptions',     value: subsCount,       color:'text-violet-600', bg:'bg-violet-50' },
                { icon:Globe,       label:'Inactive Sites',    value: inactiveSites,   color:'text-indigo-600', bg:'bg-indigo-50' },
              ].map(({ icon:Icon, label:lbl, value, color, bg }) => (
                <motion.div key={lbl} whileHover={{ y:-3 }} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={16} className={color}/>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{anyData ? <AnimCounter value={value}/> : '—'}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{lbl}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={15} className="text-indigo-500"/>
                  <h2 className="text-base font-bold text-gray-800">Risk Dimension Radar</h2>
                </div>
                {anyData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:'#6B7280' }}/>
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:9 }}/>
                      <Radar name="Score" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2}/>
                      <Tooltip content={<RadarTip/>}/>
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-20 text-center">{NA}</p>}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={15} className="text-emerald-500"/>
                  <h2 className="text-base font-bold text-gray-800">Score Breakdown</h2>
                </div>
                {anyData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="name" tick={{ fontSize:11 }}/>
                      <YAxis domain={[0,100]} tick={{ fontSize:10 }}/>
                      <Tooltip content={<BarTip/>}/>
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {barData.map(d => <Cell key={d.name} fill={d.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-20 text-center">{NA}</p>}
              </div>
            </div>

            {/* Risk factors */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex items-center gap-2 mb-5">
                <Shield size={16} className="text-indigo-500"/>
                <h2 className="text-base font-bold text-gray-800">Risk Factors &amp; Improvements</h2>
                <span className="ml-auto text-xs text-gray-400">From your live scan data</span>
              </div>
              {anyData && factors.length > 0 ? (
                <div className="space-y-3">
                  {factors.map((f,i) => <FactorCard key={i} factor={f} navigate={navigate}/>)}
                </div>
              ) : <p className="text-sm text-gray-400">{NA} — click Rescan to analyse all modules.</p>}
            </div>

            {/* Quick action buttons */}
            <div className="grid sm:grid-cols-3 gap-4">
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/auto-cleanup')}
                className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><CheckCircle2 size={20}/><span>Run Auto Cleanup</span></div>
                <ExternalLink size={16}/>
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/email-manager')}
                className="flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><Mail size={20}/><span>Optimize Inbox</span></div>
                <ExternalLink size={16}/>
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => navigate('/drive-cleanup')}
                className="flex items-center justify-between bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-3"><HardDrive size={20}/><span>Optimize Storage</span></div>
                <ExternalLink size={16}/>
              </motion.button>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
