import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, RefreshCw, AlertCircle, Loader2,
  Mail, Users, HardDrive, Image,
  CheckCircle2, XCircle, AlertTriangle, Play, X,
  ChevronRight, ToggleLeft, ToggleRight, BarChart3,
} from 'lucide-react';
import apiService from '../services/api';

const NA = 'Not analyzed yet';

// ── helpers ────────────────────────────────────────────────────────────────
function fmtBytes(b = 0) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

// ── Build recommendation list from raw module data ─────────────────────────
function buildActions(emailData, subsData, driveDecay, classifierData) {
  const actions = [];

  // ── Email Classification ──────────────────────────────────────────────
  const spam   = emailData?.classified?.Spam || [];
  const mkt    = emailData?.classified?.Marketing || [];
  const low    = emailData?.classified?.['Low Priority'] || [];
  const news   = emailData?.classified?.Newsletters || [];

  if (spam.length > 0) actions.push({
    id: 'email_spam', module: 'Email Classification', icon: Mail,
    label: `Delete ${spam.length} spam emails`,
    description: 'Permanently removes all emails classified as spam.',
    count: spam.length, category: 'Email',
    color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
    emailIds: spam.map(e => e.id).filter(Boolean),
    action: async () => {
      const ids = spam.map(e => e.id).filter(Boolean);
      if (ids.length) return apiService.trashEmails(ids);
      return { trashed: 0 };
    },
  });

  if (mkt.length > 0) actions.push({
    id: 'email_marketing', module: 'Email Classification', icon: Mail,
    label: `Trash ${mkt.length} marketing emails`,
    description: 'Moves all marketing and promotional emails to trash.',
    count: mkt.length, category: 'Email',
    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200',
    action: async () => {
      const ids = mkt.map(e => e.id).filter(Boolean);
      if (ids.length) return apiService.trashEmails(ids);
      return { trashed: 0 };
    },
  });

  if (low.length > 0) actions.push({
    id: 'email_low', module: 'Email Classification', icon: Mail,
    label: `Archive ${low.length} low-priority emails`,
    description: 'Moves low-priority and automated emails to trash.',
    count: low.length, category: 'Email',
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    action: async () => {
      const ids = low.map(e => e.id).filter(Boolean);
      if (ids.length) return apiService.trashEmails(ids);
      return { trashed: 0 };
    },
  });

  if (news.length > 0) actions.push({
    id: 'email_news', module: 'Email Classification', icon: Mail,
    label: `Trash ${news.length} newsletter emails`,
    description: 'Cleans up newsletter clutter from your inbox.',
    count: news.length, category: 'Email',
    color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200',
    action: async () => {
      const ids = news.map(e => e.id).filter(Boolean);
      if (ids.length) return apiService.trashEmails(ids);
      return { trashed: 0 };
    },
  });

  // ── Subscription Manager ──────────────────────────────────────────────
  const inactiveSubs = (subsData?.subscriptions || []).filter(s =>
    ['unsubscribed','inactive','manual_pending'].includes(s.status) === false &&
    s.emailCount <= 1
  );
  if (inactiveSubs.length > 0) actions.push({
    id: 'subs_inactive', module: 'Subscription Manager', icon: Users,
    label: `Unsubscribe from ${inactiveSubs.length} low-activity senders`,
    description: 'Senders with 1 or fewer emails — likely inactive or one-time.',
    count: inactiveSubs.length, category: 'Subscriptions',
    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',
    action: async () => {
      const results = await apiService.unsubscribeBulk(inactiveSubs);
      return results;
    },
  });

  // ── Drive Decay Detector ──────────────────────────────────────────────
  const junkFiles = (driveDecay || []).filter(f => f.isJunk);
  const junkBytes = junkFiles.reduce((s, f) => s + (f.sizeBytes || 0), 0);
  if (junkFiles.length > 0) actions.push({
    id: 'drive_junk', module: 'Drive Decay Detector', icon: HardDrive,
    label: `Delete ${junkFiles.length} unused Drive files`,
    description: `Recovers ${fmtBytes(junkBytes)} of storage from files flagged as decayed or unused.`,
    count: junkFiles.length, category: 'Storage', bytes: junkBytes,
    color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
    action: async () => ({ note: 'Open Drive Decay Detector to delete files.' }),
  });

  // ── Drive File Classifier ─────────────────────────────────────────────
  const allClassified = classifierData?.classifiedFiles || [];
  const archives = allClassified.filter(f => f.classifiedCategory === 'Archives');
  const large    = allClassified.filter(f => (f.sizeBytes || 0) > 50 * 1024 * 1024);

  if (archives.length > 0) actions.push({
    id: 'drive_archives', module: 'Drive File Classifier', icon: HardDrive,
    label: `Review ${archives.length} archive files`,
    description: 'Archive files (.zip, .tar, etc.) often accumulate unused. Review and remove stale ones.',
    count: archives.length, category: 'Storage',
    color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200',
    action: async () => ({ note: 'Open Drive Classifier to manage archive files.' }),
  });

  if (large.length > 0) actions.push({
    id: 'drive_large', module: 'Drive File Classifier', icon: HardDrive,
    label: `Review ${large.length} large files (>50 MB)`,
    description: `These files take up significant storage. Review each before deleting.`,
    count: large.length, category: 'Storage',
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
    action: async () => ({ note: 'Open Drive Classifier to review large files.' }),
  });

  // ── Photos ────────────────────────────────────────────────────────────
  const IMAGE_MIMES = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/gif','image/bmp']);
  const images = allClassified.filter(f => IMAGE_MIMES.has(f.mimeType));
  const dupCheck = {};
  images.forEach(f => {
    const key = `${(f.name||'').replace(/\.[^.]+$/,'').toLowerCase()}_${f.sizeBytes||0}`;
    dupCheck[key] = (dupCheck[key]||0)+1;
  });
  const dupCount = Object.values(dupCheck).filter(v => v > 1).reduce((s,v) => s+(v-1), 0);
  const largeImgs = images.filter(f => (f.sizeBytes||0) > 5*1024*1024);

  if (dupCount > 0) actions.push({
    id: 'photos_dups', module: 'Photos Scanner', icon: Image,
    label: `Remove ${dupCount} duplicate image candidates`,
    description: 'Images with the same name and file size — likely duplicates.',
    count: dupCount, category: 'Photos',
    color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200',
    action: async () => ({ note: 'Open Photos Scanner to review and delete duplicates.' }),
  });

  if (largeImgs.length > 0) actions.push({
    id: 'photos_large', module: 'Photos Scanner', icon: Image,
    label: `Review ${largeImgs.length} large images (>5 MB)`,
    description: 'Large images often have smaller compressed versions. Review before removing.',
    count: largeImgs.length, category: 'Photos',
    color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200',
    action: async () => ({ note: 'Open Photos Scanner to review large images.' }),
  });

  return actions;
}

// ── potential savings summary ──────────────────────────────────────────────
function buildSummary(actions) {
  const s = { emailCount:0, storageBytes:0, subsCount:0, photosCount:0 };
  actions.forEach(a => {
    if (a.category === 'Email')         s.emailCount   += a.count;
    if (a.category === 'Storage')       s.storageBytes += a.bytes || 0;
    if (a.category === 'Subscriptions') s.subsCount    += a.count;
    if (a.category === 'Photos')        s.photosCount  += a.count;
  });
  return s;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SkeletonBlock({ h='h-24' }) {
  return <div className={`animate-pulse bg-white/60 rounded-2xl ${h} w-full`}/>;
}

function SummaryCard({ icon:Icon, label, value, gradient }) {
  return (
    <motion.div whileHover={{ y:-3 }} className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
      <Icon size={22} className="opacity-80 mb-3"/>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold opacity-80 mt-0.5">{label}</p>
    </motion.div>
  );
}

function ActionRow({ action, enabled, onToggle }) {
  const Icon = action.icon;
  return (
    <motion.div whileHover={{ y:-1 }}
      className={`rounded-2xl border p-4 flex items-start gap-4 transition-all duration-150 ${
        enabled ? `${action.bg} ${action.border}` : 'bg-gray-50 border-gray-200 opacity-60'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${enabled ? action.bg : 'bg-gray-100'}`}>
        <Icon size={16} className={enabled ? action.color : 'text-gray-400'}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{action.label}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${action.bg} ${action.color}`}>
            {action.module}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.description}</p>
      </div>
      <button onClick={() => onToggle(action.id)}
        className="flex-shrink-0 mt-0.5"
        title={enabled ? 'Disable this action' : 'Enable this action'}>
        {enabled
          ? <ToggleRight size={28} className="text-emerald-500"/>
          : <ToggleLeft  size={28} className="text-gray-300"/>}
      </button>
    </motion.div>
  );
}

// Confirmation dialog
function ConfirmDialog({ actions, onConfirm, onCancel }) {
  const enabled = actions.filter(a => a._enabled);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-500"/>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Confirm Auto Cleanup</h3>
            <p className="text-xs text-gray-500">This will execute {enabled.length} action{enabled.length!==1?'s':''}</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-5">
          {enabled.map(a => (
            <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">
              <ChevronRight size={13} className="text-gray-400 flex-shrink-0"/>
              {a.label}
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 mb-5">
          <AlertTriangle size={12} className="inline mr-1.5"/>
          Trashed emails can be recovered from Gmail Trash within 30 days. Drive actions will require manual confirmation in the respective tools.
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            Run Cleanup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Progress / results dialog
function ProgressDialog({ results, running, onClose }) {
  const done   = results.filter(r => r.status === 'done').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const total  = results.length;
  const pct    = total ? Math.round((done + failed) / total * 100) : 0;

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
            {running ? <Loader2 size={20} className="text-cyan-500 animate-spin"/> : <CheckCircle2 size={20} className="text-emerald-500"/>}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{running ? 'Running Cleanup…' : 'Cleanup Complete'}</h3>
            <p className="text-xs text-gray-500">{done} done · {failed} failed · {total} total</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <motion.div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
            animate={{ width: `${pct}%` }} transition={{ duration:0.4 }}/>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
          {results.map(r => (
            <div key={r.id} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
              r.status === 'done'    ? 'bg-emerald-50 text-emerald-800' :
              r.status === 'failed' ? 'bg-red-50 text-red-800' :
              r.status === 'running'? 'bg-blue-50 text-blue-800' :
              'bg-gray-50 text-gray-500'
            }`}>
              {r.status === 'done'    && <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-500"/>}
              {r.status === 'failed'  && <XCircle      size={14} className="mt-0.5 flex-shrink-0 text-red-500"/>}
              {r.status === 'running' && <Loader2      size={14} className="mt-0.5 flex-shrink-0 animate-spin text-blue-500"/>}
              {r.status === 'pending' && <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded-full border-2 border-gray-300"/>}
              <div className="min-w-0">
                <p className="font-medium">{r.label}</p>
                {r.note && <p className="text-xs opacity-70 mt-0.5">{r.note}</p>}
                {r.error && <p className="text-xs opacity-70 mt-0.5">{r.error}</p>}
              </div>
            </div>
          ))}
        </div>

        {!running && (
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            Done
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AutoCleanup() {
  const navigate = useNavigate();

  const [emailData,      setEmailData]      = useState(null);
  const [subsData,       setSubsData]       = useState(null);
  const [driveDecay,     setDriveDecay]     = useState(null);
  const [classifierData, setClassifierData] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const [enabled,  setEnabled]  = useState({});        // actionId → bool
  const [confirm,  setConfirm]  = useState(false);
  const [results,  setResults]  = useState(null);      // null | array
  const [running,  setRunning]  = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      // Load stored reports from MongoDB — no live scans on mount.
      const res = await Promise.allSettled([
        apiService.getEmailReport(),
        apiService.getSubscriptions(),
        apiService.getScoredFiles(),
        apiService.getDriveReport(),
      ]);
      if (res[0].status === 'fulfilled') setEmailData(res[0].value);
      if (res[1].status === 'fulfilled') setSubsData(res[1].value);
      if (res[2].status === 'fulfilled') setDriveDecay(res[2].value?.files);
      if (res[3].status === 'fulfilled') setClassifierData(res[3].value);
      const allFailed = res.every(r => r.status === 'rejected');
      if (allFailed) throw new Error('No stored reports found. Run individual module scans first.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Manual refresh — triggers live scans to refresh all module data.
  async function runRefresh() {
    setLoading(true); setError(null);
    try {
      const res = await Promise.allSettled([
        apiService.scanEmails(),
        apiService.getSubscriptions(),
        apiService.getScoredFiles(),
        apiService.classifyDriveFiles(),
      ]);
      if (res[0].status === 'fulfilled') setEmailData(res[0].value);
      if (res[1].status === 'fulfilled') setSubsData(res[1].value);
      if (res[2].status === 'fulfilled') setDriveDecay(res[2].value?.files);
      if (res[3].status === 'fulfilled') setClassifierData(res[3].value);
      const allFailed = res.every(r => r.status === 'rejected');
      if (allFailed) throw new Error('All data sources failed. Please re-authenticate.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build actions whenever data changes; default all enabled
  const actions = useMemo(
    () => buildActions(emailData, subsData, driveDecay, classifierData),
    [emailData, subsData, driveDecay, classifierData]
  );
  useEffect(() => {
    const init = {};
    actions.forEach(a => { init[a.id] = true; });
    setEnabled(init);
  }, [actions]);

  const enabledActions = useMemo(() => actions.filter(a => enabled[a.id]), [actions, enabled]);
  const summary        = useMemo(() => buildSummary(enabledActions), [enabledActions]);
  const anyData        = emailData || subsData || driveDecay || classifierData;

  function toggleAction(id) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Sequential execution
  async function runCleanup() {
    setConfirm(false);
    const toRun = actions.filter(a => enabled[a.id]);
    const initial = toRun.map(a => ({ id:a.id, label:a.label, status:'pending', note:null, error:null }));
    setResults(initial);
    setRunning(true);

    for (let i = 0; i < toRun.length; i++) {
      const action = toRun[i];
      setResults(prev => prev.map(r => r.id === action.id ? { ...r, status:'running' } : r));
      try {
        const res = await action.action();
        setResults(prev => prev.map(r => r.id === action.id
          ? { ...r, status:'done', note: res?.note || (res?.trashed != null ? `${res.trashed} emails trashed` : null) }
          : r));
      } catch (e) {
        setResults(prev => prev.map(r => r.id === action.id
          ? { ...r, status:'failed', error: e.message }
          : r));
      }
    }
    setRunning(false);
  }

  // Group actions by category for display
  const byCategory = useMemo(() => {
    const g = {};
    actions.forEach(a => {
      if (!g[a.category]) g[a.category] = [];
      g[a.category].push(a);
    });
    return g;
  }, [actions]);

  const catMeta = {
    Email:         { icon: Mail,      gradient:'from-green-500 to-emerald-600' },
    Subscriptions: { icon: Users,     gradient:'from-violet-500 to-purple-600' },
    Storage:       { icon: HardDrive, gradient:'from-yellow-500 to-amber-600'  },
    Photos:        { icon: Image,     gradient:'from-pink-500 to-rose-600'     },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50/20 to-blue-50/20 px-6 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18}/> Back
            </button>
            <div className="h-7 w-px bg-gray-200"/>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="text-white" size={18}/>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Auto Cleanup</h1>
                <p className="text-xs text-gray-400">Loaded from stored reports · Refresh to rescan</p>
              </div>
            </div>
          </div>
          <button onClick={runRefresh} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
            {loading ? 'Scanning…' : 'Refresh'}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><SkeletonBlock key={i} h="h-28"/>)}</div>
            {[...Array(5)].map((_,i)=><SkeletonBlock key={i} h="h-16"/>)}
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>

            {/* Potential savings */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard icon={Mail}      label="Emails to Clean"       value={anyData ? summary.emailCount   : NA} gradient="from-green-500 to-emerald-600"/>
              <SummaryCard icon={HardDrive} label="Storage Recoverable"   value={anyData ? fmtBytes(summary.storageBytes) : NA} gradient="from-yellow-500 to-amber-600"/>
              <SummaryCard icon={Users}     label="Subs to Remove"        value={anyData ? summary.subsCount    : NA} gradient="from-violet-500 to-purple-600"/>
              <SummaryCard icon={Image}     label="Photos to Review"      value={anyData ? summary.photosCount  : NA} gradient="from-pink-500 to-rose-600"/>
            </div>

            {/* No recommendations */}
            {actions.length === 0 && anyData && (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-8">
                <CheckCircle2 size={40} className="text-emerald-400 mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Your digital space looks clean!</h3>
                <p className="text-sm text-gray-500">No cleanup actions detected from any module. Run individual scans to update.</p>
              </div>
            )}

            {/* No data yet */}
            {!anyData && (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-8">
                <BarChart3 size={40} className="text-gray-300 mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{NA}</h3>
                <p className="text-sm text-gray-500">Click Refresh to scan all modules and generate cleanup recommendations.</p>
              </div>
            )}

            {/* Action groups */}
            {Object.entries(byCategory).map(([cat, catActions]) => {
              const meta = catMeta[cat] || { icon: Sparkles, gradient:'from-gray-500 to-slate-600' };
              const CatIcon = meta.icon;
              return (
                <div key={cat} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${meta.gradient}`}>
                      <CatIcon size={13} className="text-white"/>
                    </div>
                    <h2 className="text-base font-bold text-gray-800">{cat}</h2>
                    <span className="text-xs text-gray-400 ml-1">({catActions.length} action{catActions.length!==1?'s':''})</span>
                  </div>
                  <div className="space-y-3">
                    {catActions.map(a => (
                      <ActionRow key={a.id} action={a} enabled={!!enabled[a.id]} onToggle={toggleAction}/>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Run button */}
            {actions.length > 0 && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="sticky bottom-6">
                <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{enabledActions.length} action{enabledActions.length!==1?'s':''} selected</p>
                    <p className="text-xs text-gray-500">Toggle individual items above to customise</p>
                  </div>
                  <motion.button whileHover={{ scale: enabledActions.length ? 1.03 : 1 }}
                    whileTap={{ scale: enabledActions.length ? 0.97 : 1 }}
                    disabled={enabledActions.length === 0}
                    onClick={() => setConfirm(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                    <Play size={16}/> Run Auto Cleanup
                  </motion.button>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </div>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            actions={actions.map(a => ({ ...a, _enabled: !!enabled[a.id] }))}
            onConfirm={runCleanup}
            onCancel={() => setConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Progress dialog */}
      <AnimatePresence>
        {results && (
          <ProgressDialog
            results={results}
            running={running}
            onClose={() => setResults(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
