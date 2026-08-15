import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Star, Bell,
  Lock, Mail, Key, Shield, Eye, Zap, CheckCircle2,
  ShieldAlert, RefreshCw, Clock, XCircle, Info,
  Sparkles, Globe, Database,
} from 'lucide-react';

// ── Shared animation wrappers ─────────────────────────────────────────────
function FadeIn({ children, delay = 0, y = 24 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Floating orbs
function Orbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-2/3 -left-32 w-80 h-80 bg-red-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '5s' }} />
    </div>
  );
}

// Animated bell icon
function HeroIcon() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-yellow-400/40" />
      <motion.div animate={{ scale: [1, 1.9, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.7 }}
        className="absolute inset-0 rounded-full border border-red-400/20" />
      {/* Bell swing animation */}
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 8, 0], y: [-4, 4, -4] }}
        transition={{ rotate: { duration: 0.8, repeat: Infinity, repeatDelay: 2 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40"
      >
        <Bell size={52} className="text-white" />
      </motion.div>
    </div>
  );
}

// Feature card
function FeatureCard({ icon: Icon, title, desc, gradient, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative group rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">{desc}</p>
      </div>
    </motion.div>
  );
}

// Mock notification card — clearly labelled PREVIEW
function MockAlert({ icon: Icon, iconBg, title, body, time, severity, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400 + index * 350);
    return () => clearTimeout(t);
  }, [index]);

  const severityStyle = {
    critical: 'border-red-500/40 bg-red-500/10',
    warning:  'border-yellow-500/40 bg-yellow-500/10',
    info:     'border-blue-500/40 bg-blue-500/10',
    success:  'border-emerald-500/40 bg-emerald-500/10',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-xl border p-4 flex items-start gap-3 ${severityStyle[severity]}`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">{title}</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{body}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-slate-500 text-xs">{time}</span>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${severity === 'critical' ? 'bg-red-400' : severity === 'warning' ? 'bg-yellow-400' : severity === 'info' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Roadmap phase
function Phase({ num, title, items, color, delay, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex gap-5">
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
          className={`w-9 h-9 rounded-full border-2 ${color} bg-slate-900 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>{num}</motion.div>
        {!isLast && (
          <motion.div initial={{ height: 0 }} animate={inView ? { height: '100%' } : {}} transition={{ duration: 0.8, delay: delay + 0.3 }}
            className="w-px bg-gradient-to-b from-yellow-500/50 to-transparent flex-1 mt-2" />
        )}
      </div>
      <motion.div initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: delay + 0.1 }} className="pb-8">
        <h4 className="text-white font-bold text-sm mb-2.5">{title}</h4>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 size={12} className="text-yellow-400 flex-shrink-0" />{item}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function InstantLeakAlerts() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const features = [
    { icon: Key,          title: 'Credential Monitoring',       desc: 'Watches for your email addresses in known data breach databases and alerts you the moment a match is found.',                gradient: 'from-yellow-500/20 to-transparent', delay: 0.1 },
    { icon: ShieldAlert,  title: 'Compromised Account Alerts',  desc: 'Detects when an account linked to your email has been compromised and surfaces immediate remediation steps.',            gradient: 'from-red-500/20 to-transparent',    delay: 0.15 },
    { icon: Mail,         title: 'Email Breach Notifications',  desc: 'Instant push alerts whenever your email address appears in a newly published data breach or credential dump.',           gradient: 'from-amber-500/20 to-transparent',  delay: 0.2 },
    { icon: RefreshCw,    title: 'Password Reuse Detection',    desc: 'Identifies patterns suggesting password reuse across multiple services, a leading cause of account takeover attacks.',   gradient: 'from-yellow-500/20 to-transparent', delay: 0.25 },
    { icon: Database,     title: 'Dark Web Monitoring',         desc: 'Passive monitoring of dark web forums and paste sites for your personal identifiers — without ever visiting them.',      gradient: 'from-red-500/20 to-transparent',    delay: 0.3 },
    { icon: Shield,       title: 'Security Recommendations',    desc: 'Every alert comes with a ranked action list — change password, revoke access, or enable 2FA — tailored to the threat.',  gradient: 'from-amber-500/20 to-transparent',  delay: 0.35 },
    { icon: Globe,        title: 'Privacy-first Architecture',  desc: 'All breach lookups use k-anonymity hashing. Your credentials are never transmitted — only a safe hash prefix is checked.', gradient: 'from-yellow-500/20 to-transparent', delay: 0.4 },
    { icon: Sparkles,     title: 'AI-powered Triage',           desc: 'Machine learning ranks alerts by severity and relevance, surfacing only what actually needs your attention.',            gradient: 'from-red-500/20 to-transparent',    delay: 0.45 },
  ];

  const mockAlerts = [
    { icon: XCircle,      iconBg: 'bg-red-500',     title: 'Credential Leak Detected',     body: 'Your email was found in a data breach from a third-party service. Immediate action recommended.', time: 'Just now',  severity: 'critical' },
    { icon: AlertTriangle,iconBg: 'bg-yellow-500',  title: 'Password Reuse Warning',        body: 'The same password pattern detected across 3 tracked services. Update credentials immediately.',    time: '2 min ago', severity: 'warning'  },
    { icon: Mail,         iconBg: 'bg-orange-500',  title: 'Email Found in Breach',         body: 'A newly published breach database includes your email address from a shopping platform.',          time: '5 min ago', severity: 'warning'  },
    { icon: ShieldAlert,  iconBg: 'bg-red-600',     title: 'Immediate Action Required',     body: 'High-severity credential exposure detected. Rotate passwords for affected services now.',          time: '8 min ago', severity: 'critical' },
    { icon: Info,         iconBg: 'bg-blue-500',    title: 'Security Recommendation',       body: 'Enable two-factor authentication on 4 services to reduce your attack surface by 94%.',            time: '12 min ago',severity: 'info'     },
    { icon: CheckCircle2, iconBg: 'bg-emerald-500', title: 'Identity Scan Complete',        body: 'Daily scan completed. 1 new finding. Previous 5 alerts have been resolved or acknowledged.',      time: '1 hr ago',  severity: 'success'  },
  ];

  const roadmap = [
    { num: '1', title: 'Breach Database Integration',  color: 'border-yellow-400', items: ['HaveIBeenPwned API integration', 'k-anonymity hashing for privacy', 'Scheduled daily checks'],        delay: 0.1 },
    { num: '2', title: 'AI Alert Classification',      color: 'border-red-400',    items: ['Severity scoring engine', 'Duplicate suppression', 'Context-aware triage'],                           delay: 0.22 },
    { num: '3', title: 'Real-time Notification Engine',color: 'border-amber-400',  items: ['In-app push alerts', 'Email digest option', 'Action tracking'],                                        delay: 0.34 },
    { num: '4', title: 'Full Identity Protection',     color: 'border-yellow-300', items: ['Dark web passive monitoring', 'Cross-service correlation', 'Automated remediation guidance'],         delay: 0.46 },
  ];

  return (
    <div className="min-h-screen bg-[#0d0a00] relative overflow-hidden">
      <Orbs />

      {/* Nav */}
      <div className="sticky top-0 z-30 bg-[#0d0a00]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-red-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-yellow-500/30">
            ✦ Premium · Coming Soon
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="text-center mb-24">
          <FadeIn delay={0}>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Star size={12} className="text-yellow-400" />
              <span className="text-yellow-400 text-xs font-semibold uppercase tracking-[0.2em]">Footprintx Security</span>
              <Star size={12} className="text-yellow-400" />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}><HeroIcon /></FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-6xl sm:text-7xl font-black text-white mb-6 leading-none tracking-tight">
              Instant Leak
              <span className="block bg-gradient-to-r from-yellow-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
                Alerts
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Receive immediate notifications when your digital identity may be at risk.
              Know within minutes — not months — that your credentials have been exposed.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 text-sm font-semibold">Available in a future FootPrintX update</span>
            </div>
          </FadeIn>
        </div>

        {/* ── Why it matters ──────────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-10 mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-black text-white mb-5">The problem with today's alerts</h2>
                <p className="text-slate-400 leading-relaxed mb-5">
                  Most people discover a data breach <span className="text-yellow-400 font-semibold">months after it happens</span>,
                  long after attackers have already exploited the exposed credentials. The window between breach and discovery
                  is where the real damage occurs.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Instant Leak Alerts will close that window. By continuously scanning known breach databases using
                  privacy-safe k-anonymity hashing, FootPrintX will surface exposure events within minutes of
                  their public disclosure — and tell you exactly what to do.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Clock,    text: 'Average breach discovery time today: 197 days',         color: 'text-red-400' },
                  { icon: Zap,      text: 'FootPrintX target: alert within minutes of disclosure',  color: 'text-yellow-400' },
                  { icon: Lock,     text: 'k-anonymity ensures your password is never transmitted', color: 'text-emerald-400' },
                  { icon: Eye,      text: 'Covers email, credentials and personal identifiers',     color: 'text-amber-400' },
                ].map(({ icon: Icon, text, color }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                    <Icon size={16} className={color} />
                    <span className="text-slate-300 text-sm">{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Mock notification preview ────────────────────────────────── */}
        <FadeIn delay={0.05}>
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-3xl font-black text-white mb-1">Notification Center Preview</h2>
              <p className="text-slate-500 text-sm">These are example alerts — not live data.</p>
            </div>
            {/* Prominent PREVIEW badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-yellow-500/50 bg-yellow-500/10">
              <Eye size={14} className="text-yellow-400" />
              <span className="text-yellow-300 text-xs font-bold uppercase tracking-widest">Preview Only — Not Real Alerts</span>
            </div>
          </div>
        </FadeIn>

        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-sm p-6 mb-20">
          {/* Fake window chrome */}
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-slate-600 text-xs font-mono">FootPrintX — Alert Center (Preview)</span>
            <Bell size={13} className="ml-auto text-yellow-400" />
          </div>
          <div className="space-y-3">
            {mockAlerts.map((alert, i) => (
              <MockAlert key={i} {...alert} index={i} />
            ))}
          </div>
        </div>

        {/* ── Feature grid ────────────────────────────────────────────── */}
        <FadeIn delay={0.05}>
          <div className="mb-6">
            <h2 className="text-3xl font-black text-white mb-2">What's Coming</h2>
            <p className="text-slate-500">Eight security layers — all privacy-first.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>

        {/* ── Roadmap ─────────────────────────────────────────────────── */}
        <FadeIn delay={0.05}>
          <h2 className="text-3xl font-black text-white mb-2">Implementation Roadmap</h2>
          <p className="text-slate-500 mb-10">How Instant Leak Alerts will be built into FootPrintX.</p>
        </FadeIn>
        <div className="grid lg:grid-cols-2 gap-10 mb-20">
          {roadmap.map((r, i) => (
            <Phase key={i} {...r} isLast={false} />
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div className="text-center rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-red-500/5 p-14">
            <Bell size={40} className="text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Your Identity. Defended.</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Instant Leak Alerts will complete FootPrintX's vision of a fully proactive digital hygiene
              platform — closing the gap between exposure and awareness, permanently.
            </p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-red-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-shadow">
              Back to Dashboard <ArrowRight size={16} />
            </motion.button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
