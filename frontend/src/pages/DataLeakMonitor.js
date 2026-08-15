import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, Eye, Lock, AlertTriangle, Search,
  Globe, FileSearch, Zap, CheckCircle2,
  Radio, Activity, Link2, EyeOff, Server, ArrowRight,
  Star, Cpu,
} from 'lucide-react';

// ── Shared helpers ─────────────────────────────────────────────────────────
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


// Floating orb background decoration
function Orbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
    </div>
  );
}

// Animated floating icon ring
function HeroIcon() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      {/* Outer pulse rings */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full border-2 border-orange-400/40"
      />
      <motion.div
        animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
        className="absolute inset-0 rounded-full border border-orange-400/20"
      />
      {/* Icon container */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/40"
      >
        <Shield size={52} className="text-white" />
      </motion.div>
    </div>
  );
}

// Feature card
function FeatureCard({ icon: Icon, title, desc, gradient, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-base mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{desc}</p>
      </div>
    </motion.div>
  );
}

// Roadmap phase
function RoadmapPhase({ phase, title, items, color, delay, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex gap-6">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
          className={`w-10 h-10 rounded-full border-2 ${color} flex items-center justify-center flex-shrink-0 font-bold text-sm text-white bg-slate-900`}
        >
          {phase}
        </motion.div>
        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={inView ? { height: '100%' } : {}}
            transition={{ duration: 0.8, delay: delay + 0.3 }}
            className="w-px bg-gradient-to-b from-orange-500/50 to-transparent flex-1 mt-2"
          />
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: delay + 0.1 }}
        className="pb-10"
      >
        <h4 className="text-white font-bold text-base mb-3">{title}</h4>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 size={13} className="text-orange-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DataLeakMonitor() {
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const features = [
    { icon: Eye,        title: 'Smart Exposure Detection',    desc: 'AI scans your Drive for files accidentally shared with "Anyone with the link" and flags them for review.',           gradient: 'from-orange-500/20 to-transparent', delay: 0.1 },
    { icon: FileSearch, title: 'Shared File Scanner',         desc: 'Crawls your Google Drive to find every file with a public or overly-permissive sharing policy.',                   gradient: 'from-red-500/20 to-transparent',    delay: 0.15 },
    { icon: Link2,      title: 'Public Link Analysis',        desc: 'Identifies drive links that expose sensitive documents, spreadsheets, or personal information to anyone online.',   gradient: 'from-amber-500/20 to-transparent',  delay: 0.2 },
    { icon: Zap,        title: 'AI Leak Detection',           desc: 'Machine learning classifies the sensitivity of exposed content — contracts, IDs, credentials — and prioritises alerts.', gradient: 'from-orange-500/20 to-transparent', delay: 0.25 },
    { icon: EyeOff,     title: 'Privacy Suggestions',         desc: 'Actionable one-click recommendations to revoke public access, move files, or apply viewer-only restrictions.',     gradient: 'from-red-500/20 to-transparent',    delay: 0.3 },
    { icon: Server,     title: 'Privacy-first Architecture',  desc: 'Zero data leaves your Google account. All analysis runs against your own OAuth tokens — nothing is stored externally.', gradient: 'from-amber-500/20 to-transparent', delay: 0.35 },
    { icon: Radio,      title: 'Continuous Monitoring',       desc: 'Scheduled background checks alert you when new files are shared publicly or existing links are widened.',           gradient: 'from-orange-500/20 to-transparent', delay: 0.4 },
    { icon: Activity,   title: 'Enterprise-grade Monitoring', desc: 'Audit log of all sharing changes with timestamps, giving you a full history of your Drive\'s exposure events.',     gradient: 'from-red-500/20 to-transparent',    delay: 0.45 },
  ];

  const roadmap = [
    { phase: '1', title: 'Google Drive Integration',  color: 'border-orange-400', items: ['OAuth Drive metadata access', 'File permission enumeration', 'Sharing policy parser'] },
    { phase: '2', title: 'AI Sensitivity Analysis',   color: 'border-red-400',    items: ['File type classification', 'Content sensitivity scoring', 'Risk level assignment'] },
    { phase: '3', title: 'Continuous Monitoring',     color: 'border-amber-400',  items: ['Scheduled background scans', 'Change detection engine', 'Alert generation pipeline'] },
    { phase: '4', title: 'Real-time Protection',      color: 'border-orange-300', items: ['Instant exposure alerts', 'One-click privacy fixes', 'Full audit history dashboard'] },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] relative overflow-hidden">
      <Orbs />

      {/* Nav bar */}
      <div className="sticky top-0 z-30 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-orange-500/30">
              ✦ Premium · Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="text-center mb-24">
          <FadeIn delay={0}>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Star size={12} className="text-orange-400" />
              <span className="text-orange-400 text-xs font-semibold uppercase tracking-[0.2em]">Footprintx Premium</span>
              <Star size={12} className="text-orange-400" />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}><HeroIcon /></FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-6xl sm:text-7xl font-black text-white mb-6 leading-none tracking-tight">
              Data Leak
              <span className="block bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
                Monitor
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Continuously monitor your digital footprint for accidental exposure.
              Know exactly what you've shared, with whom, and how sensitive it is — before it becomes a problem.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-300 text-sm font-semibold">Coming in a future FootPrintX release</span>
            </div>
          </FadeIn>
        </div>

        {/* ── Why it matters ──────────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-10 mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-black text-white mb-5">Why this matters</h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  The average professional has over 400 Google Drive files. Studies show that nearly
                  <span className="text-orange-400 font-semibold"> 1 in 5 contain a public sharing link</span> that was
                  never intentionally made public — from old job applications to personal financial documents.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Data Leak Monitor will automatically surface every file that may expose your personal
                  information to the internet and give you a clear, prioritised action list to secure it —
                  powered by the same Drive OAuth already used across FootPrintX.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: Globe,      text: 'Detect files shared with "Anyone on the internet"', color: 'text-orange-400' },
                  { icon: Lock,       text: 'Identify sensitive documents with open access',      color: 'text-red-400' },
                  { icon: Search,     text: 'Surface hidden exposure risks in seconds',           color: 'text-amber-400' },
                  { icon: AlertTriangle, text: 'Get instant alerts when new leaks are detected',  color: 'text-orange-300' },
                ].map(({ icon: Icon, text, color }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                    <Icon size={18} className={color} />
                    <span className="text-slate-300 text-sm">{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Feature cards ───────────────────────────────────────────── */}
        <FadeIn delay={0.05}>
          <div className="mb-6">
            <h2 className="text-3xl font-black text-white mb-2">What's Coming</h2>
            <p className="text-slate-500">Eight enterprise-grade capabilities, built privacy-first.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>

        {/* ── Roadmap ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-16 mb-20">
          <div>
            <FadeIn delay={0.05}>
              <h2 className="text-3xl font-black text-white mb-2">Implementation Roadmap</h2>
              <p className="text-slate-500 mb-10">How Data Leak Monitor will be built into FootPrintX.</p>
            </FadeIn>
            {roadmap.map((r, i) => (
              <RoadmapPhase key={i} {...r} delay={0.1 + i * 0.12} isLast={i === roadmap.length - 1} />
            ))}
          </div>
          <FadeIn delay={0.15}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 h-fit">
              <div className="flex items-center gap-2 mb-6">
                <Cpu size={16} className="text-orange-400" />
                <span className="text-white font-bold">Privacy Guarantee</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Data Leak Monitor is designed with a <span className="text-white font-semibold">zero-exfiltration</span> principle.
                All analysis happens by calling the Google Drive API using your own OAuth token.
                FootPrintX never reads, stores, or transmits the contents of your files.
              </p>
              <div className="space-y-3">
                {['No file contents read', 'No external data transfer', 'OAuth-scoped metadata only', 'Fully deletable scan history'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div className="text-center rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/5 p-14">
            <Shield size={40} className="text-orange-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Stay Protected</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
              As FootPrintX evolves, Data Leak Monitor will become a core part of the complete
              Digital Hygiene ecosystem — giving you full visibility over every file you've ever shared.
            </p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow">
              Back to Dashboard <ArrowRight size={16} />
            </motion.button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
