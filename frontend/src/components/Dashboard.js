import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import MetricCard from './MetricCard';
import ModuleCard from './ModuleCard';
import BreachRadar from './BreachRadar';
import EmailClassification from './EmailClassification';
import apiService from '../services/api';
import { 
  Globe, 
  Mail, 
  FolderOpen, 
  Trash2, 
  Camera, 
  Shield, 
  Brain, 
  AlertTriangle, 
  Sparkles, 
  BarChart3,
  Loader2,
  CheckCircle,
  Zap,
  Database,
  Cpu,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Star
} from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [radarAlertCount, setRadarAlertCount] = useState(null);
  const modulesRef = useRef(null);
  const breachRadarRef = useRef(null);
  const emailClassificationRef = useRef(null);

  // Load stored breach report for the Data Leak Monitor module card badge.
  // Uses GET /report (no scan) so the dashboard loads instantly.
  useEffect(() => {
    apiService.getBreachReport()
      .then((result) => {
        const count = (result?.statistics?.criticalAlerts ?? 0) + (result?.statistics?.highAlerts ?? 0);
        setRadarAlertCount(count);
      })
      .catch(() => { /* silently ignore — badge stays null if no report yet */ });
  }, []);

  useEffect(() => {
    // Simulate loading with progress updates - faster for under 2 seconds
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 20 + 10; // Faster progress
      });
    }, 100); // Faster interval

    // Complete loading after 1.8 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  // Handle module scroll from search
  const handleModuleScroll = (moduleName) => {
    // Add a small delay to ensure the component is rendered
    setTimeout(() => {
      if (moduleName === 'Breach Radar' && breachRadarRef.current) {
        breachRadarRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add bounce effect
        breachRadarRef.current.classList.add('search-bounce');
        setTimeout(() => {
          breachRadarRef.current.classList.remove('search-bounce');
        }, 1500);
      } else if (moduleName === 'Email Classification' && emailClassificationRef.current) {
        emailClassificationRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add bounce effect
        emailClassificationRef.current.classList.add('search-bounce');
        setTimeout(() => {
          emailClassificationRef.current.classList.remove('search-bounce');
        }, 1500);
      } else if (modulesRef.current) {
        // Scroll to modules section
        modulesRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Find and highlight the specific module
        const moduleElements = modulesRef.current.querySelectorAll('.module-card');
        moduleElements.forEach((element, index) => {
          if (modules[index] && modules[index].title === moduleName) {
            // Add bounce effect to the specific module
            element.classList.add('search-bounce');
            setTimeout(() => {
              element.classList.remove('search-bounce');
            }, 1500);
          }
        });
      }
    }, 100);
  };

  const metrics = [
    {
      title: 'Email Health',
      value: '2,847',
      subtitle: 'Emails processed',
      icon: Mail,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      action: 'Manage Inbox',
      status: 'healthy',
      trend: '+12%',
      trendDirection: 'up',
      onClick: () => navigate('/email-health'),
    },
    {
      title: 'Storage Status',
      value: '78%',
      subtitle: 'Storage optimized',
      icon: FolderOpen,
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      action: 'Clean Storage',
      status: 'warning',
      trend: '-5%',
      trendDirection: 'down',
      onClick: () => navigate('/storage-analytics'),
    },
    {
      title: 'Digital Wellness',
      value: '12.4 GB',
      subtitle: 'Space freed this month',
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      action: 'View Report',
      status: 'excellent',
      trend: '+8.2 GB',
      trendDirection: 'up',
      onClick: () => navigate('/digital-wellness'),
    }
  ];

  const modules = [
    {
      title: 'Website Tracker',
      description: 'View & manage your online accounts',
      icon: Globe,
      color: 'text-blue-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      stats: '142 accounts tracked',
      status: 'active'
    },
    {
      title: 'Email Subscription Manager',
      description: 'Unsubscribe from unwanted emails',
      icon: Mail,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      stats: '38 subscriptions found',
      status: 'active'
    },
    {
      title: 'Drive File Classifier',
      description: 'Classify & clean Google Drive files',
      icon: FolderOpen,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50',
      stats: '1,247 files analyzed',
      status: 'active'
    },
    {
      title: 'Drive Decay Detector',
      description: 'Detect and delete unused files',
      icon: Trash2,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
      stats: '892 unused files',
      status: 'warning'
    },
    {
      title: 'Photos Scanner',
      description: 'Spot blurry or junk images',
      icon: Camera,
      color: 'text-pink-500',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      stats: '156 junk photos found',
      status: 'active'
    },
    {
      title: 'Data Leak Monitor',
      description: 'Detect device breaches & risky file shares',
      icon: Shield,
      color: 'text-orange-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
      stats: radarAlertCount === null
        ? 'Scanning…'
        : radarAlertCount === 0
        ? 'No active alerts'
        : `${radarAlertCount} alert${radarAlertCount > 1 ? 's' : ''} active`,
      status: radarAlertCount === null ? 'active' : radarAlertCount === 0 ? 'safe' : 'alert'
    },
    {
      title: 'AI Risk Predictor',
      description: 'Get early warnings for potential risks',
      icon: Brain,
      color: 'text-indigo-500',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      stats: 'Low risk detected',
      status: 'safe'
    },
    {
      title: 'Instant Leak Alerts',
      description: 'Know if your credentials are exposed',
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      stats: 'No breaches found',
      status: 'safe'
    },
    {
      title: 'Auto Cleanup',
      description: 'One-click removal of approved junk',
      icon: Sparkles,
      color: 'text-cyan-500',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50',
      stats: 'Ready to clean',
      status: 'ready'
    },
    {
      title: 'Digital Risk Score',
      description: 'Monitor and improve your privacy index',
      icon: BarChart3,
      color: 'text-emerald-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
      stats: '87/100 Excellent',
      status: 'excellent'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Circular Loading Design - Enhanced */}
        <div className="text-center relative z-10">
          {/* Circular Progress Ring */}
          <div className="relative w-40 h-40 mx-auto">
            {/* Background Circle */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-blue-500"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 339.292", strokeDashoffset: "0" }}
                animate={{ 
                  strokeDasharray: `${(loadingProgress / 100) * 339.292} 339.292`,
                  strokeDashoffset: "0"
                }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            
            {/* Center Content - Logo and Percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Logo */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-2"
              >
                <Shield className="text-white" size={20} />
              </motion.div>
              
              {/* Percentage */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <span className="text-lg font-bold text-blue-600">
                  {Math.round(loadingProgress)}%
                </span>
              </motion.div>
            </div>
          </div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <motion.h2 
              className="text-xl font-semibold text-gray-800 mb-2"
            >
              Loading Dashboard
            </motion.h2>
            <motion.p 
              className="text-gray-500 text-sm"
            >
              Preparing your privacy control center...
            </motion.p>
          </motion.div>

          {/* Subtle Animated Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center space-x-2 mt-6"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-blue-400 rounded-full"
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      <Header user={user} onLogout={onLogout} onModuleScroll={handleModuleScroll} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2"
              >
                Welcome back, {user?.name || 'User'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 text-lg"
              >
                Your unified control center to manage digital hygiene and privacy.
              </motion.p>
            </div>
            
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">System Healthy</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50">
                <Clock size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Last updated: 2 min ago</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Metrics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Modules Section */}
        <motion.div
          ref={modulesRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Your Digital Tools
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="text-gray-600"
              >
                Comprehensive privacy and security tools at your fingertips
              </motion.p>
            </div>
            
            {/* View All Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <span>View All</span>
              <TrendingUp size={16} />
            </motion.button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="h-full"
              >
                <ModuleCard {...module} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="grid lg:grid-cols-2 gap-8"
        >
          <div ref={breachRadarRef}>
            <BreachRadar />
          </div>
          <div ref={emailClassificationRef}>
            <EmailClassification />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;