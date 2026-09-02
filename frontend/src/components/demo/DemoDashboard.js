import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DemoHeader from './DemoHeader';
import DemoBreachRadar from './DemoBreachRadar';
import DemoEmailClassification from './DemoEmailClassification';
import MetricCard from '../MetricCard';
import {
  Globe, Mail, FolderOpen, Trash2, Camera, Shield,
  Brain, AlertTriangle, Sparkles, BarChart3,
} from 'lucide-react';
import {
  demoUser, demoRiskScore, demoDashboardMetrics, demoDashboardModuleStats,
} from '../../data/demoData';

/**
 * DemoDashboard — visual twin of Dashboard.js, powered by demo data.
 * No API calls. Reuses MetricCard, ModuleCard, DemoBreachRadar, DemoEmailClassification.
 */
const DemoDashboard = () => {
  const navigate  = useNavigate();
  const modulesRef            = useRef(null);
  const breachRadarRef        = useRef(null);
  const emailClassificationRef = useRef(null);

  const handleModuleScroll = (moduleName) => {
    setTimeout(() => {
      if (moduleName === 'Breach Radar' && breachRadarRef.current) {
        breachRadarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        breachRadarRef.current.classList.add('search-bounce');
        setTimeout(() => breachRadarRef.current?.classList.remove('search-bounce'), 1500);
      } else if (moduleName === 'Email Classification' && emailClassificationRef.current) {
        emailClassificationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailClassificationRef.current.classList.add('search-bounce');
        setTimeout(() => emailClassificationRef.current?.classList.remove('search-bounce'), 1500);
      } else if (modulesRef.current) {
        modulesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Metric cards — same structure as real Dashboard.js
  const metrics = [
    {
      title: 'Email Health',
      value: demoDashboardMetrics.emailHealth.value,
      subtitle: demoDashboardMetrics.emailHealth.subtitle,
      icon: Mail,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      action: 'Manage Inbox',
      status: demoDashboardMetrics.emailHealth.status,
      trend: demoDashboardMetrics.emailHealth.trend,
      trendDirection: demoDashboardMetrics.emailHealth.trendDirection,
      onClick: () => navigate('/demo/email-classification'),
    },
    {
      title: 'Storage Status',
      value: demoDashboardMetrics.storageStatus.value,
      subtitle: demoDashboardMetrics.storageStatus.subtitle,
      icon: FolderOpen,
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      action: 'Clean Storage',
      status: demoDashboardMetrics.storageStatus.status,
      trend: demoDashboardMetrics.storageStatus.trend,
      trendDirection: demoDashboardMetrics.storageStatus.trendDirection,
      onClick: () => navigate('/demo/drive-cleanup'),
    },
    {
      title: 'Digital Wellness',
      value: demoDashboardMetrics.digitalWellness.value,
      subtitle: demoDashboardMetrics.digitalWellness.subtitle,
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      action: 'View Report',
      status: demoDashboardMetrics.digitalWellness.status,
      trend: demoDashboardMetrics.digitalWellness.trend,
      trendDirection: demoDashboardMetrics.digitalWellness.trendDirection,
      onClick: () => navigate('/demo/drive-cleanup'),
    },
  ];

  // Module cards — same visual structure as real Dashboard.js
  const modules = [
    {
      title: 'Website Tracker',
      description: 'View & manage your online accounts',
      icon: Globe,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      stats: demoDashboardModuleStats['Website Tracker'],
      status: 'active',
      onClick: () => navigate('/demo/website-tracker'),
    },
    {
      title: 'Email Subscription Manager',
      description: 'Unsubscribe from unwanted emails',
      icon: Mail,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      stats: demoDashboardModuleStats['Email Subscription Manager'],
      status: 'active',
      onClick: () => navigate('/demo/email-manager'),
    },
    {
      title: 'Drive File Classifier',
      description: 'Classify & clean Google Drive files',
      icon: FolderOpen,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50',
      stats: demoDashboardModuleStats['Drive File Classifier'],
      status: 'active',
      onClick: () => navigate('/demo/drive-classifier'),
    },
    {
      title: 'Drive Decay Detector',
      description: 'Detect and delete unused files',
      icon: Trash2,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
      stats: demoDashboardModuleStats['Drive Decay Detector'],
      status: 'warning',
      onClick: () => navigate('/demo/drive-cleanup'),
    },
    {
      title: 'Photos Scanner',
      description: 'Spot blurry or junk images',
      icon: Camera,
      color: 'text-pink-500',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      stats: demoDashboardModuleStats['Photos Scanner'],
      status: 'active',
      onClick: () => navigate('/demo'),
    },
    {
      title: 'Data Leak Monitor',
      description: 'Detect device breaches & risky file shares',
      icon: Shield,
      color: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
      stats: demoDashboardModuleStats['Data Leak Monitor'],
      status: 'alert',
      onClick: () => navigate('/demo/breach-radar'),
    },
    {
      title: 'AI Risk Predictor',
      description: 'Get early warnings for potential risks',
      icon: Brain,
      color: 'text-indigo-500',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      stats: demoDashboardModuleStats['AI Risk Predictor'],
      status: 'warning',
      onClick: () => navigate('/demo/digital-risk-score'),
    },
    {
      title: 'Instant Leak Alerts',
      description: 'Know if your credentials are exposed',
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      stats: demoDashboardModuleStats['Instant Leak Alerts'],
      status: 'warning',
      onClick: () => navigate('/demo/breach-radar'),
    },
    {
      title: 'Auto Cleanup',
      description: 'One-click removal of approved junk',
      icon: Sparkles,
      color: 'text-cyan-500',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50',
      stats: demoDashboardModuleStats['Auto Cleanup'],
      status: 'ready',
      onClick: () => navigate('/demo/drive-cleanup'),
    },
    {
      title: 'Digital Risk Score',
      description: 'Monitor and improve your privacy index',
      icon: BarChart3,
      color: 'text-emerald-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
      stats: demoDashboardModuleStats['Digital Risk Score'],
      status: 'warning',
      onClick: () => navigate('/demo/digital-risk-score'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
      <DemoHeader onModuleScroll={handleModuleScroll} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 shadow-md ring-2 ring-indigo-200">
              <img src={demoUser.avatar} alt={demoUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Welcome back, {demoUser.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {demoUser.email} &nbsp;·&nbsp;
                <span className="text-indigo-600 font-semibold">Digital Risk Score: {demoRiskScore.overall}/100 — {demoRiskScore.label}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Module cards */}
        <motion.div
          ref={modulesRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 sm:mb-10"
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">Privacy Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="module-card"
              >
                {/* We render our own clickable wrapper since ModuleCard uses internal navigation */}
                <DemoModuleCard {...mod} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Breach Radar */}
        <motion.div
          ref={breachRadarRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <DemoBreachRadar />
        </motion.div>

        {/* Email Classification */}
        <motion.div
          ref={emailClassificationRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <DemoEmailClassification />
        </motion.div>

      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DemoModuleCard — identical visual to ModuleCard.js but onClick is a prop
// (avoids ModuleCard's internal hardcoded useNavigate routes)
// ---------------------------------------------------------------------------
function DemoModuleCard({ title, description, icon: Icon, color, bgColor, stats, status, onClick }) {
  const PREMIUM_TITLES = new Set(['Data Leak Monitor', 'AI Risk Predictor', 'Instant Leak Alerts']);
  const isPremium = PREMIUM_TITLES.has(title);

  const getStatusIndicator = () => {
    const map = {
      active:    { dot: 'bg-green-500',  text: 'text-green-600',  label: 'Active'    },
      warning:   { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Warning'   },
      alert:     { dot: 'bg-red-500',    text: 'text-red-600',    label: 'Alert'     },
      safe:      { dot: 'bg-blue-500',   text: 'text-blue-600',   label: 'Safe'      },
      ready:     { dot: 'bg-cyan-500',   text: 'text-cyan-600',   label: 'Ready'     },
      excellent: { dot: 'bg-emerald-500',text: 'text-emerald-600',label: 'Excellent' },
    };
    const meta = map[status];
    if (!meta) return null;
    return (
      <div className="flex items-center space-x-1.5">
        <div className={`w-2 h-2 ${meta.dot} rounded-full animate-pulse`} />
        <span className={`text-xs ${meta.text} font-semibold`}>{meta.label}</span>
      </div>
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 25px 50px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl border border-gray-100/50 cursor-pointer transition-all duration-300 relative overflow-hidden group"
    >
      {isPremium && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm z-10">
          Premium
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <motion.div
          className={`p-2.5 rounded-xl ${bgColor} shadow-md group-hover:shadow-lg transition-shadow`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </motion.div>
        {getStatusIndicator()}
      </div>
      <h3 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{title}</h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{stats}</span>
        <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
      </div>
    </motion.div>
  );
}

export default DemoDashboard;
