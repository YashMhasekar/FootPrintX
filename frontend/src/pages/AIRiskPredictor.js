import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ArrowLeft, ArrowRight, Star, TrendingUp, Mail,
  HardDrive, Globe, BarChart3, Cpu, Zap,
  Activity, Layers, Eye, Sparkles,
  CalendarDays, Target, LineChart,
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
      <div className="absolute -top-32 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
    </div>
  );
}

// Animated brain icon
function HeroIcon() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-indigo-400/40" />
      <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
        className="absolute inset-0 rounded-full border border-violet-400/20" />
      <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
        <Brain size={52} className="text-white" />
      </motion.div>
    </div>
  );
}

// Prediction concept card
function PredictionCard({ icon: Icon, title, desc, value, trend, gradient, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon size={20} className="text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <TrendingUp size={11} className="text-indigo-400" />
              <span className="text-indigo-300 text-xs font-semibold">{trend}</span>
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-white mb-1">{value}</p>
        <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">{desc}</p>
      </div>
    </motion.div>
  );
}

// Feature card (smaller)
function FeatureCard({ icon: Icon, title, desc, gradient, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="relative group rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Icon size={18} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-sm mb-1.5">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// Timeline node
function TimelineNode({ label, sublabel, icon: Icon, color, delay, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex items-start gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay, type: 'spring', stiffness: 220 }}
          className={`w-10 h-10 rounded-full border-2 ${color} bg-slate-900 flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </motion.div>
        {!isLast && (
          <motion.div initial={{ height: 0 }} animate={inView ? { height: 48 } : {}}
            transition={{ duration: 0.6, delay: delay + 0.3 }}
            className="w-px bg-gradient-to-b from-indigo-500/50 to-transparent" />
        )}
      </div>
      <motion.div initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: delay + 0.1 }} className="pb-6">
        <p className="text-white font-bold text-sm">{label}</p>
        <p className="text-slate-500 text-xs mt-0.5">{sublabel}</p>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AIRiskPredictor() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const predictions = [
    { icon: HardDrive,    title: 'Storage Usage Forecast',  value: 'Storage AI',    trend: 'Forecast',  desc: 'Predicts how your Drive storage will grow over the next 90 days based on your file creation patterns.',      gradient: 'from-indigo-500/20 to-transparent',  delay: 0.1 },
    { icon: Mail,         title: 'Spam Growth Trend',        value: 'Email AI',      trend: 'Trend',     desc: 'Analyses your inbox history to forecast spam volume and suggest proactive filters before your inbox floods.', gradient: 'from-violet-500/20 to-transparent',  delay: 0.15 },
    { icon: Globe,        title: 'Inactive Account Risk',    value: 'Privacy AI',    trend: 'Risk',      desc: 'Identifies website accounts likely to become attack vectors by cross-referencing activity and breach databases.', gradient: 'from-purple-500/20 to-transparent', delay: 0.2 },
    { icon: BarChart3,    title: 'Privacy Score Forecast',   value: 'Wellness AI',   trend: 'Score',     desc: 'Projects your Digital Wellness Score trajectory and shows which modules to optimise for the biggest gain.',   gradient: 'from-indigo-500/20 to-transparent',  delay: 0.25 },
  ];

  const capabilities = [
    { icon: LineChart,    title: 'Behavioural Trend Analysis',  desc: 'Learns your email and storage habits over time to detect anomalies that precede security events.',        gradient: 'from-indigo-500/20 to-transparent',  delay: 0.1 },
    { icon: Target,       title: 'Personalised Risk Scoring',   desc: 'Every user gets a unique risk model tuned to their specific app usage, drive patterns and email volume.',  gradient: 'from-violet-500/20 to-transparent',  delay: 0.15 },
    { icon: CalendarDays, title: 'Digital Hygiene Forecast',    desc: 'Week-by-week projections show when your inbox, storage or privacy score will hit critical thresholds.',    gradient: 'from-purple-500/20 to-transparent',  delay: 0.2 },
    { icon: Activity,     title: 'Historical Pattern Matching', desc: 'Compares your digital habits against anonymised patterns to surface risks you have not noticed yet.',      gradient: 'from-indigo-500/20 to-transparent',  delay: 0.25 },
    { icon: Layers,       title: 'Multi-module Intelligence',   desc: 'Combines signals from Email, Drive, Subscriptions and Website Tracker into a single predictive model.',    gradient: 'from-violet-500/20 to-transparent',  delay: 0.3 },
    { icon: Eye,          title: 'Early Warning System',        desc: 'Surfaces risks 7-30 days before they become measurable problems — giving you time to act proactively.',    gradient: 'from-purple-500/20 to-transparent',  delay: 0.35 },
  ];

  const timeline = [
    { label: 'Today',            sublabel: 'Your current FootPrintX dashboard',            icon: Sparkles,     color: 'border-indigo-400', delay: 0.1 },
    { label: 'Next Week',        sublabel: 'Predicted inbox noise & storage delta',         icon: CalendarDays, color: 'border-violet-400', delay: 0.22 },
    { label: 'Next Month',       sublabel: 'Wellness score trajectory & risk hotspots',     icon: TrendingUp,   color: 'border-purple-400', delay: 0.34 },
    { label: 'Future Protection',sublabel: 'Continuous AI-driven digital hygiene coaching', icon: Zap,          color: 'border-indigo-300', delay: 0.46 },
  ];

  return (
    <div className="min-h-screen bg-[#080c1a] relative overflow-hidden">
      <Orbs />

      {/* Nav */}
      <div className="sticky top-0 z-30 bg-[#080c1a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-indigo-500/30">
            ✦ Premium · Coming Soon
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="text-center mb-24">
          <FadeIn delay={0}>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Star size={12} className="text-indigo-400" />
              <span className="text-indigo-400 text-xs font-semibold uppercase tracking-[0.2em]">Footprintx AI Engine</span>
              <Star size={12} className="text-indigo-400" />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}><HeroIcon /></FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-6xl sm:text-7xl font-black text-white mb-6 leading-none tracking-tight">
              AI Risk
              <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Predictor
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.15}>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Predict tomorrow's digital risks before they become real problems.
              A personal AI engine that learns your digital habits and gives you a clear view of what's coming.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-300 text-sm font-semibold">Currently under active development</span>
            </div>
          </FadeIn>
        </div>

        {/* ── How AI will help ─────────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-10 mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-black text-white mb-5">How the AI works</h2>
                <p className="text-slate-400 leading-relaxed mb-5">
                  The AI Risk Predictor will combine signals from every FootPrintX module — your email classification
                  history, drive usage trends, subscription activity, and website patterns — into a
                  <span className="text-indigo-400 font-semibold"> unified predictive model</span> tailored to you.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Unlike generic security tools, this engine understands your specific digital footprint
                  and tells you not just what's wrong <em>now</em>, but what will be wrong in 7, 14, or 30 days —
                  giving you time to prevent problems rather than react to them.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Mail,     text: 'Email habits — volume, spam ratio, subscription growth',  color: 'text-indigo-400' },
                  { icon: HardDrive,text: 'Drive usage — storage growth, file age, decay patterns',  color: 'text-violet-400' },
                  { icon: Globe,    text: 'Inactive accounts — dormant sites and old credentials',   color: 'text-purple-400' },
                  { icon: Cpu,      text: 'Historical trends — week-over-week behavioural shifts',   color: 'text-indigo-300' },
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

        {/* ── Prediction concept cards ─────────────────────────────────── */}
        <FadeIn delay={0.05}>
          <div className="mb-6">
            <h2 className="text-3xl font-black text-white mb-2">Prediction Concepts</h2>
            <p className="text-slate-500">Four AI-powered forecasts that will ship with this module.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {predictions.map((p, i) => <PredictionCard key={i} {...p} />)}
        </div>

        {/* ── Timeline + capabilities ──────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-16 mb-20">
          {/* Timeline */}
          <div>
            <FadeIn delay={0.05}>
              <h2 className="text-3xl font-black text-white mb-2">Prediction Timeline</h2>
              <p className="text-slate-500 mb-10">From today's snapshot to future-proof protection.</p>
            </FadeIn>
            {timeline.map((t, i) => (
              <TimelineNode key={i} {...t} isLast={i === timeline.length - 1} />
            ))}
          </div>

          {/* Future capabilities */}
          <div>
            <FadeIn delay={0.05}>
              <h2 className="text-3xl font-black text-white mb-2">Future Capabilities</h2>
              <p className="text-slate-500 mb-6">Six intelligence layers coming to the AI engine.</p>
            </FadeIn>
            <div className="grid grid-cols-2 gap-3">
              {capabilities.map((c, i) => <FeatureCard key={i} {...c} />)}
            </div>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div className="text-center rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-14">
            <Brain size={40} className="text-indigo-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">The Future of Digital Intelligence</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
              AI Risk Predictor will transform FootPrintX from a reactive tool into a
              proactive digital coach — always working in the background to keep you one step ahead.
            </p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow">
              Back to Dashboard <ArrowRight size={16} />
            </motion.button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
