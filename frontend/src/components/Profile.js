import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Globe, HardDrive, Clock, CheckCircle,
  AlertCircle, Loader2, RefreshCw, ArrowLeft, Key, Bell,
  Settings, ExternalLink, Activity, Lock, Eye, EyeOff,
  ChevronRight, Database, Zap, BarChart3, UserCheck,
} from 'lucide-react';
import apiService from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso) {
  if (!iso) return 'Not available';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

function maskId(id) {
  if (!id) return '—';
  return id.slice(0, 4) + '••••••••' + id.slice(-4);
}

function SkeletonBlock({ h = 'h-5', w = 'w-full' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${h} ${w}`} />;
}

// ---------------------------------------------------------------------------
// Score ring (reused from DigitalWellness pattern)
// ---------------------------------------------------------------------------

function ScoreRing({ score, size = 80, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = ((score ?? 0) / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-gray-900 leading-none" style={{ fontSize: size * 0.22 }}>
          {score ?? '—'}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({ label, value, icon: Icon, color, loading }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon size={16} className={color} />
      </div>
      {loading ? (
        <SkeletonBlock h="h-7" w="w-16" />
      ) : (
        <p className={`text-2xl font-black ${color}`}>{value ?? '—'}</p>
      )}
      <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

function Badge({ icon: Icon, label, active }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
      <Icon size={12} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Password change panel
// ---------------------------------------------------------------------------

function PasswordPanel({ profileData }) {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]       = useState({ cur: false, new: false, conf: false });
  const [status, setStatus]   = useState(null); // null | 'loading' | 'ok' | 'err'
  const [msg, setMsg]         = useState('');

  const isGoogle = profileData?.user?.oauthProvider === 'google' && !profileData?.user?.password;

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setStatus('err'); setMsg('Passwords do not match.'); return;
    }
    setStatus('loading');
    try {
      await apiService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setStatus('ok'); setMsg('Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatus('err'); setMsg(err.message || 'Failed to update password.');
    }
  }

  if (isGoogle) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <UserCheck size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Google Account</p>
          <p className="text-xs text-blue-600 mt-0.5">Your account uses Google Sign-In. Password management is handled by Google.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { name: 'currentPassword', label: 'Current Password', showKey: 'cur' },
        { name: 'newPassword',     label: 'New Password',     showKey: 'new' },
        { name: 'confirmPassword', label: 'Confirm Password', showKey: 'conf' },
      ].map(({ name, label, showKey }) => (
        <div key={name}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
          <div className="relative">
            <input
              type={show[showKey] ? 'text' : 'password'}
              value={form[name]}
              onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder={label}
              required
            />
            <button type="button" onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      ))}
      <AnimatePresence>
        {status && status !== 'loading' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`text-xs px-3 py-2 rounded-lg ${status === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
        disabled={status === 'loading'}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md">
        {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
        Update Password
      </motion.button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Profile component
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: User    },
  { id: 'identity',   label: 'Identity',    icon: Shield  },
  { id: 'services',   label: 'Services',    icon: Globe   },
  { id: 'security',   label: 'Security',    icon: Lock    },
  { id: 'preferences',label: 'Preferences', icon: Settings},
];

const Profile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // ── Data state ─────────────────────────────────────────────────────────
  const [profileData,  setProfileData]  = useState(null);
  const [driveData,    setDriveData]    = useState(null);
  const [emailData,    setEmailData]    = useState(null);
  const [websiteData,  setWebsiteData]  = useState(null);
  const [radarData,    setRadarData]    = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats,   setLoadingStats]   = useState(true);
  const [errorProfile,   setErrorProfile]   = useState(null);

  // ── Prefs state (read-only display until backend supports it) ──────────
  const [prefs] = useState({
    theme: 'Light', language: 'English',
    notifications: true, autoCleanup: false,
    aiClassification: true, privacyAlerts: true,
  });

  // ── Load profile ───────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoadingProfile(true); setErrorProfile(null);
    try {
      const data = await apiService.getProfile();
      setProfileData(data);
    } catch (err) {
      setErrorProfile(err.message || 'Failed to load profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // ── Load stats (parallel, non-blocking) ───────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const [drive, email, website, radar] = await Promise.allSettled([
      apiService.getDriveSummary(),
      apiService.scanEmails(),
      apiService.scanWebsites({ maxMessages: 100 }),
      apiService.scanBreachRadar(),
    ]);
    if (drive.status   === 'fulfilled') setDriveData(drive.value);
    if (email.status   === 'fulfilled') setEmailData(email.value);
    if (website.status === 'fulfilled') setWebsiteData(website.value);
    if (radar.status   === 'fulfilled') setRadarData(radar.value);
    setLoadingStats(false);
  }, []);

  useEffect(() => { loadProfile(); loadStats(); }, [loadProfile, loadStats]);

  // ── Derived values ─────────────────────────────────────────────────────
  const dbUser        = profileData?.user ?? {};
  const displayName   = user?.name  || `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim() || 'User';
  const displayEmail  = user?.email || dbUser.email  || '';
  const displayAvatar = user?.avatar|| dbUser.avatar || null;
  const isGoogle      = !!(dbUser.googleId || dbUser.oauthProvider === 'google');
  const tokenOk       = dbUser.tokenStatus === 'valid';

  const totalEmails   = emailData?.totalEmails   ?? null;
  const totalFiles    = driveData?.totalFiles    ?? null;
  const totalSites    = websiteData?.totalWebsites ?? null;
  const secScore      = radarData?.score         ?? null;
  const secAlerts     = radarData?.statistics?.totalAlerts ?? null;

  // Recent activity timeline — real events only, newest first
  const activity = [];
  if (radarData)    activity.push({ icon: Shield,    color: 'text-blue-500',   bg: 'bg-blue-50',   text: 'Privacy & Security Radar scan completed',      sub: `Score: ${radarData.score}/100` });
  if (websiteData)  activity.push({ icon: Globe,     color: 'text-cyan-500',   bg: 'bg-cyan-50',   text: 'Website Tracker scan completed',               sub: `${websiteData.totalWebsites} domains tracked` });
  if (emailData)    activity.push({ icon: Mail,      color: 'text-green-500',  bg: 'bg-green-50',  text: 'Email classification completed',               sub: `${emailData.totalEmails} emails analysed` });
  if (driveData)    activity.push({ icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-50', text: 'Drive summary loaded',                         sub: `${driveData.totalFiles} files found` });
  if (isGoogle)     activity.push({ icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-50', text: 'Google account connected',                     sub: displayEmail });


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <User className="text-white" size={16} />
              </div>
              <span className="text-base font-bold text-gray-900">Account & Identity</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { loadProfile(); loadStats(); }}
              disabled={loadingProfile || loadingStats}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:border-gray-300 transition-all disabled:opacity-40">
              <RefreshCw size={14} className={loadingProfile || loadingStats ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-all">
              Sign Out
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.97) 0%,rgba(239,246,255,0.97) 100%)' }}>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl flex items-center justify-center">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              {isGoogle && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center border border-gray-100">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {loadingProfile ? <SkeletonBlock h="h-8" w="w-48" /> : (
                  <h1 className="text-3xl font-black text-gray-900">{displayName}</h1>
                )}
                {isGoogle && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                    <CheckCircle size={12} /> Google Verified
                  </span>
                )}
              </div>

              {loadingProfile ? <SkeletonBlock h="h-4" w="w-64" /> : (
                <p className="text-gray-500 text-sm mb-4">{displayEmail}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <Badge icon={UserCheck}  label="Google Connected"         active={isGoogle} />
                <Badge icon={HardDrive}  label="Drive Connected"          active={tokenOk}  />
                <Badge icon={Mail}       label="Gmail Connected"          active={tokenOk}  />
                <Badge icon={Globe}      label="Website Tracker Active"   active={!!websiteData} />
                <Badge icon={Shield}     label="Privacy Monitoring Enabled" active={!!radarData} />
              </div>

              {/* Account meta */}
              {loadingProfile ? <SkeletonBlock h="h-4" w="w-80" /> : (
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Member since {fmtDate(dbUser.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity size={12} /> Last login {timeAgo(dbUser.lastLogin)}
                  </span>
                  {dbUser.tokenStatus && (
                    <span className={`flex items-center gap-1.5 ${tokenOk ? 'text-green-600' : 'text-yellow-600'}`}>
                      <Zap size={12} /> Token {dbUser.tokenStatus}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Security score ring */}
            {(secScore !== null || loadingStats) && (
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {loadingStats ? (
                  <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse" />
                ) : (
                  <ScoreRing score={secScore} size={80} stroke={8} />
                )}
                <span className="text-xs text-gray-500 font-medium">Security Score</span>
              </div>
            )}
          </div>
        </motion.div>


        {/* Error banner */}
        <AnimatePresence>
          {errorProfile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {errorProfile}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW tab ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6">

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatTile label="Total Emails"     value={totalEmails?.toLocaleString()}          icon={Mail}      color="text-green-600"   loading={loadingStats} />
              <StatTile label="Drive Files"      value={totalFiles?.toLocaleString()}           icon={HardDrive} color="text-purple-600"  loading={loadingStats} />
              <StatTile label="Websites Tracked" value={totalSites?.toLocaleString()}           icon={Globe}     color="text-cyan-600"    loading={loadingStats} />
              <StatTile label="Security Score"   value={secScore !== null ? `${secScore}/100` : null} icon={Shield} color="text-blue-600" loading={loadingStats} />
              <StatTile label="Security Alerts"  value={secAlerts?.toLocaleString()}            icon={AlertCircle} color="text-orange-600" loading={loadingStats} />
              <StatTile label="Dormant Accounts" value={radarData?.statistics?.dormantAccounts?.toLocaleString()} icon={Database} color="text-indigo-600" loading={loadingStats} />
            </div>

            {/* Empty state — no data yet */}
            {!loadingStats && !driveData && !emailData && !websiteData && !radarData && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center gap-4 shadow-sm">
                <BarChart3 size={40} className="text-gray-300" strokeWidth={1.5} />
                <p className="text-base font-semibold text-gray-600">No analysis available yet</p>
                <p className="text-sm text-gray-400 text-center max-w-xs">Run a scan to populate your statistics and activity timeline.</p>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {[
                    { label: 'Analyze Emails', route: '/email-manager',   color: 'from-green-500 to-emerald-600' },
                    { label: 'Scan Drive',     route: '/drive-classifier', color: 'from-purple-500 to-violet-600' },
                    { label: 'Track Websites', route: '/website-tracker',  color: 'from-cyan-500 to-blue-600'    },
                  ].map(({ label, route, color }) => (
                    <motion.button key={label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(route)}
                      className={`flex items-center gap-2 bg-gradient-to-r ${color} text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md`}>
                      {label} <ExternalLink size={13} />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            {activity.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> Recent Activity
                </h2>
                <div className="space-y-3">
                  {activity.map((ev, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className={`w-9 h-9 rounded-xl ${ev.bg} flex items-center justify-center flex-shrink-0`}>
                        <ev.icon size={16} className={ev.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{ev.text}</p>
                        <p className="text-xs text-gray-500">{ev.sub}</p>
                      </div>
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── IDENTITY tab ─────────────────────────────────────────────── */}
        {activeTab === 'identity' && (
          <motion.div key="identity" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Personal Information
              </h2>

              {loadingProfile ? (
                <div className="space-y-4">{[...Array(5)].map((_, i) => <SkeletonBlock key={i} />)}</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { label: 'First Name',         value: dbUser.firstName },
                    { label: 'Last Name',          value: dbUser.lastName  },
                    { label: 'Email Address',      value: displayEmail     },
                    { label: 'Google Account ID',  value: dbUser.googleId ? maskId(dbUser.googleId) : null },
                    { label: 'Account Created',    value: fmtDate(dbUser.createdAt) },
                    { label: 'Last Login',         value: fmtDateShort(dbUser.lastLogin) },
                    { label: 'Auth Provider',      value: dbUser.oauthProvider ? dbUser.oauthProvider.charAt(0).toUpperCase() + dbUser.oauthProvider.slice(1) : null },
                    { label: 'Email Verified',     value: dbUser.email ? 'Yes' : null },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value || 'Not provided'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Digital Identity Card */}
            <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 shadow-xl text-white">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Digital Identity</p>
                    <p className="text-sm font-bold">FootprintX Card</p>
                  </div>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-semibold">Active</span>
              </div>

              {loadingProfile ? (
                <div className="space-y-3">
                  <SkeletonBlock h="h-7" w="w-48" />
                  <SkeletonBlock h="h-4" w="w-64" />
                </div>
              ) : (
                <>
                  <p className="text-xl font-black mb-1">{displayName}</p>
                  <p className="text-sm text-gray-300 mb-5">{displayEmail}</p>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Member Since', value: fmtDateShort(dbUser.createdAt) },
                  { label: 'Auth',         value: isGoogle ? 'Google OAuth' : 'Email/Password' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-bold">{loadingProfile ? '—' : value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {isGoogle  && <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full">Google Connected</span>}
                {tokenOk   && <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded-full">Drive Active</span>}
                {tokenOk   && <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded-full">Gmail Active</span>}
                {!!radarData  && <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">Privacy Monitoring</span>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SERVICES tab ─────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <motion.div key="services" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Connected services */}
            {[
              {
                icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100',
                label: 'Google Drive', status: tokenOk,
                stats: [
                  { label: 'Files analysed', value: driveData?.totalFiles?.toLocaleString()    ?? '—' },
                  { label: 'Last scan',      value: driveData ? 'This session' : 'Not scanned' },
                ],
                route: '/drive-classifier', btnLabel: 'Open Drive Classifier',
              },
              {
                icon: Mail, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100',
                label: 'Gmail', status: tokenOk,
                stats: [
                  { label: 'Emails analysed', value: emailData?.totalEmails?.toLocaleString()   ?? '—' },
                  { label: 'Last scan',        value: emailData ? 'This session' : 'Not scanned' },
                ],
                route: '/email-manager', btnLabel: 'Open Email Manager',
              },
              {
                icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100',
                label: 'Website Tracker', status: !!websiteData || tokenOk,
                stats: [
                  { label: 'Domains tracked', value: websiteData?.totalWebsites?.toLocaleString() ?? '—' },
                  { label: 'Active accounts', value: websiteData?.activeCount?.toLocaleString()   ?? '—' },
                  { label: 'Last scan',       value: websiteData ? 'This session' : 'Not scanned' },
                ],
                route: '/website-tracker', btnLabel: 'Open Website Tracker',
              },
              {
                icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
                label: 'Privacy & Security Radar', status: !!radarData,
                stats: [
                  { label: 'Security score',  value: radarData ? `${radarData.score}/100` : '—' },
                  { label: 'Total alerts',    value: radarData?.statistics?.totalAlerts?.toLocaleString() ?? '—' },
                  { label: 'Last scan',       value: radarData ? 'This session' : 'Not scanned' },
                ],
                route: '/breach-radar', btnLabel: 'Open Security Radar',
              },
            ].map(({ icon: Icon, color, bg, border, label, status, stats, route, btnLabel }) => (
              <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-6`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center border ${border}`}>
                      <Icon size={22} className={color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{label}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {status ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 mt-1">
                        {stats.map(s => (
                          <span key={s.label} className="text-xs text-gray-500">{s.label}: <strong className="text-gray-700">{loadingStats ? '…' : s.value}</strong></span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(route)}
                    className={`flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md`}>
                    {btnLabel} <ChevronRight size={13} />
                  </motion.button>
                </div>
              </div>
            ))}

            {/* Privacy overview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" /> Privacy Overview
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  { label: 'Privacy Score',   score: secScore,  color: '#3B82F6' },
                  { label: 'Security Score',  score: secScore,  color: '#10B981' },
                  { label: 'Overall Health',  score: secScore !== null ? Math.min(100, Math.round(secScore * 0.9 + 10)) : null, color: '#8B5CF6' },
                ].map(({ label, score }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    {loadingStats ? (
                      <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
                    ) : (
                      <ScoreRing score={score ?? 0} size={64} stroke={7} />
                    )}
                    <p className="text-xs text-gray-500 font-medium text-center">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SECURITY tab ─────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-5">

            {/* Security summary */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loadingProfile ? [...Array(4)].map((_, i) => <SkeletonBlock key={i} h="h-24" />) : [
                { label: 'Last Login',    value: timeAgo(dbUser.lastLogin),  icon: Clock,    color: 'text-blue-600'   },
                { label: 'Token Status',  value: dbUser.tokenStatus || '—',  icon: Zap,      color: tokenOk ? 'text-green-600' : 'text-yellow-600' },
                { label: 'Auth Method',   value: isGoogle ? 'Google OAuth' : 'Password',    icon: Key,      color: 'text-indigo-600' },
                { label: 'Email Verified',value: dbUser.email ? 'Verified' : '—',            icon: CheckCircle, color: 'text-green-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`w-9 h-9 rounded-xl ${color.replace('text-','bg-').replace('600','100')} flex items-center justify-center mb-3`}>
                    <Icon size={16} className={color} />
                  </div>
                  <p className="text-base font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Security radar summary */}
            {radarData && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Shield size={16} className="text-blue-500" /> Security Radar Summary
                  </h2>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/breach-radar')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    View full report <ExternalLink size={12} />
                  </motion.button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Score',           value: `${radarData.score}/100`,                                          color: 'text-blue-600'   },
                    { label: 'Level',           value: radarData.level,                                                   color: 'text-indigo-600' },
                    { label: 'Critical Alerts', value: radarData.statistics?.criticalAlerts ?? 0,                         color: 'text-red-600'    },
                    { label: 'Public Files',    value: radarData.statistics?.publicFiles ?? 0,                            color: 'text-orange-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                      <p className={`text-xl font-black ${color}`}>{value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-4 italic">{radarData.summary}</p>
              </div>
            )}

            {/* Password change */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Key size={16} className="text-gray-600" /> Change Password
              </h2>
              <PasswordPanel profileData={profileData} />
            </div>
          </motion.div>
        )}

        {/* ── PREFERENCES tab ──────────────────────────────────────────── */}
        {activeTab === 'preferences' && (
          <motion.div key="preferences" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Settings size={16} className="text-gray-600" /> Account Preferences
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Theme',               value: prefs.theme,             icon: Bell,    toggle: false },
                  { label: 'Language',             value: prefs.language,          icon: Globe,   toggle: false },
                  { label: 'Notifications',        value: prefs.notifications,     icon: Bell,    toggle: true  },
                  { label: 'Auto Cleanup',         value: prefs.autoCleanup,       icon: Zap,     toggle: true  },
                  { label: 'AI Classification',    value: prefs.aiClassification,  icon: Database,toggle: true  },
                  { label: 'Privacy Alerts',       value: prefs.privacyAlerts,     icon: Shield,  toggle: true  },
                ].map(({ label, value, icon: Icon, toggle }) => (
                  <div key={label}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                        <Icon size={14} className="text-gray-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                    </div>
                    {toggle ? (
                      <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${value ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">{value}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">Preference management will be available in a future update.</p>
            </div>

          </motion.div>
        )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Profile;
