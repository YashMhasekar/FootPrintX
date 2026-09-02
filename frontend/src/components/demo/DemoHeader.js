import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Home, ChevronDown, Search,
  Globe, Mail, FolderOpen, Trash2, Camera,
  Shield, Brain, BarChart3, AlertTriangle,
  CheckCircle, Sparkles, Activity, Fingerprint,
  LogOut, X, Play,
} from 'lucide-react';
import { demoUser } from '../../data/demoData';

/**
 * DemoHeader — identical to the real Header.js visually, but:
 * - Shows demo user (Alex Morgan)
 * - Shows a "DEMO MODE" badge in the top bar
 * - Has an "Exit Demo" button instead of Logout
 * - All navigation points to /demo/* routes
 * - No real auth, no API calls
 */
const DemoHeader = ({ onModuleScroll }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen]           = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]             = useState(false);
  const [searchQuery, setSearchQuery]               = useState('');
  const profileRef       = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef        = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current       && !profileRef.current.contains(event.target))       setIsProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (searchRef.current        && !searchRef.current.contains(event.target))        setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search data — same modules as real Header, pointing to demo routes
  const searchData = [
    { type: 'module',  title: 'Website Tracker',             description: 'View & manage your online accounts',          icon: Globe,         color: 'text-blue-600',   route: '/demo/website-tracker'   },
    { type: 'module',  title: 'Email Subscription Manager',  description: 'Unsubscribe from unwanted emails',             icon: Mail,          color: 'text-green-600',  route: '/demo/email-manager'     },
    { type: 'module',  title: 'Drive File Classifier',       description: 'Classify & clean Google Drive files',         icon: FolderOpen,    color: 'text-purple-600', route: '/demo/drive-classifier'  },
    { type: 'module',  title: 'Drive Decay Detector',        description: 'Detect and delete unused files',              icon: Trash2,        color: 'text-red-600',    route: '/demo/drive-cleanup'     },
    { type: 'module',  title: 'Photos Scanner',              description: 'Spot blurry or junk images',                  icon: Camera,        color: 'text-pink-600',   route: '/demo'                   },
    { type: 'module',  title: 'Data Leak Monitor',           description: 'Detect device breaches & risky file shares',  icon: Shield,        color: 'text-orange-600', route: '/demo/breach-radar'      },
    { type: 'module',  title: 'AI Risk Predictor',           description: 'Get early warnings for potential risks',      icon: Brain,         color: 'text-indigo-600', route: '/demo'                   },
    { type: 'module',  title: 'Digital Risk Score',          description: 'Monitor and improve your privacy index',      icon: BarChart3,     color: 'text-emerald-600',route: '/demo/digital-risk-score'},
    { type: 'section', title: 'Breach Radar',                description: 'Monitor data breaches and security alerts',   icon: AlertTriangle, color: 'text-red-600',    route: '/demo/breach-radar'      },
    { type: 'section', title: 'Email Classification',        description: 'Analyze and categorize your emails',          icon: Mail,          color: 'text-blue-600',   route: '/demo/email-classification'},
    { type: 'metric',  title: 'Email Health',                description: 'Monitor your email processing status',        icon: CheckCircle,   color: 'text-green-600',  route: '/demo'                   },
    { type: 'metric',  title: 'Storage Status',              description: 'Check your storage optimization',             icon: BarChart3,     color: 'text-yellow-600', route: '/demo/drive-cleanup'     },
    { type: 'metric',  title: 'Digital Wellness',            description: 'Track your digital wellness metrics',         icon: Activity,      color: 'text-blue-600',   route: '/demo'                   },
  ];

  const filteredResults = searchQuery.trim() === ''
    ? []
    : searchData.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearchSelect = (item) => {
    navigate(item.route);
    if (onModuleScroll) onModuleScroll(item.title);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Demo notifications (static)
  const notifications = [
    {
      type: 'security',
      title: '1 sensitive file shared publicly',
      message: 'Internship_Documents.pdf is publicly accessible',
      time: '2 minutes ago',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      dotColor: 'bg-red-500',
    },
    {
      type: 'success',
      title: 'Drive scan completed',
      message: '892 unused files detected for cleanup',
      time: '1 hour ago',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-200',
      dotColor: 'bg-green-500',
    },
    {
      type: 'info',
      title: 'New email classification ready',
      message: '3,284 emails classified across 9 categories',
      time: '3 hours ago',
      icon: Mail,
      color: 'bg-blue-50 border-blue-200',
      dotColor: 'bg-blue-500',
    },
  ];

  return (
    <header className="relative z-50 border-b border-gray-200 bg-white shadow-sm">
      {/* Demo Mode top-bar indicator */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-1.5 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
        <Play size={11} className="opacity-80" />
        <span>DEMO MODE &nbsp;·&nbsp; SAMPLE DATA &nbsp;·&nbsp; No real account required</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-3">

          {/* Logo */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3 flex-shrink-0">
            <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.02 }}>
              <motion.div
                className="flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Fingerprint className="text-blue-600" size={30} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">FootprintX</span>
                <span className="text-xs text-gray-500 font-medium hidden sm:block">Privacy Intelligence Platform</span>
              </div>
            </motion.div>

            {/* Back to Home */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm"
            >
              <Home size={14} />
              <span className="hidden sm:inline">Home</span>
            </motion.button>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 max-w-md mx-2 sm:mx-6 hidden sm:block"
            ref={searchRef}
          >
            <div className="relative">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 hover:border-blue-300 transition-colors">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search modules, alerts, files…"
                  className="bg-transparent outline-none text-sm w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <AnimatePresence>
                {isSearchOpen && searchQuery.trim() !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-50 max-h-80 overflow-y-auto"
                  >
                    {filteredResults.length > 0 ? (
                      <div className="space-y-1">
                        {filteredResults.map((item) => (
                          <motion.button
                            key={`${item.type}-${item.title}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleSearchSelect(item)}
                            className="w-full flex items-center space-x-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="p-1.5 rounded-lg bg-gray-100">
                              <item.icon size={14} className={item.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            </div>
                            <div className="text-xs text-gray-400 capitalize flex-shrink-0">{item.type}</div>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 text-sm py-3">No results for "{searchQuery}"</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right — notifications + user */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"
          >
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
              >
                <Bell size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border ${n.color}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dotColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 leading-snug">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                          </div>
                          <n.icon size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex-shrink-0">
                  <img src={demoUser.avatar} alt={demoUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-medium text-gray-700 text-sm leading-tight">{demoUser.name}</p>
                  <p className="text-xs text-indigo-500 font-semibold leading-tight">Demo User</p>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50"
                  >
                    {/* Demo user info */}
                    <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg mb-4 border border-indigo-100">
                      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                        <img src={demoUser.avatar} alt={demoUser.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{demoUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{demoUser.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                          <Play size={9} />
                          Demo Account
                        </span>
                      </div>
                    </div>

                    {/* Demo notice */}
                    <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed px-1">
                      You're exploring FootprintX with sample data. Sign up to protect your real account.
                    </p>

                    <div className="border-t border-gray-200 mb-3" />

                    {/* Sign up CTA */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/')}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all mb-2"
                    >
                      <Sparkles size={14} />
                      Sign Up for Free
                    </motion.button>

                    {/* Exit Demo */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/')}
                      className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-red-600 text-sm font-medium"
                    >
                      <LogOut size={15} />
                      <span>Exit Demo</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default DemoHeader;
