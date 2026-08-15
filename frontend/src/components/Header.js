import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Home, 
  Shield, 
  ChevronDown,
  Edit3,
  Lock,
  CreditCard,
  Activity,
  Fingerprint,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Search,
  Globe,
  Mail,
  FolderOpen,
  Trash2,
  Camera,
  Brain,
  BarChart3,
  Zap
} from 'lucide-react';

const Header = ({ user, onLogout, onModuleScroll }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  // Search data - what users can search for
  const searchData = [
    // Dashboard Modules
    {
      type: 'module',
      title: 'Website Tracker',
      description: 'View & manage your online accounts',
      icon: Globe,
      action: () => onModuleScroll && onModuleScroll('Website Tracker'),
      color: 'text-blue-600'
    },
    {
      type: 'module',
      title: 'Email Subscription Manager',
      description: 'Unsubscribe from unwanted emails',
      icon: Mail,
      action: () => onModuleScroll && onModuleScroll('Email Subscription Manager'),
      color: 'text-green-600'
    },
    {
      type: 'module',
      title: 'Drive File Classifier',
      description: 'Classify & clean Google Drive files',
      icon: FolderOpen,
      action: () => onModuleScroll && onModuleScroll('Drive File Classifier'),
      color: 'text-purple-600'
    },
    {
      type: 'module',
      title: 'Drive Decay Detector',
      description: 'Detect and delete unused files',
      icon: Trash2,
      action: () => onModuleScroll && onModuleScroll('Drive Decay Detector'),
      color: 'text-red-600'
    },
    {
      type: 'module',
      title: 'Photos Scanner',
      description: 'Spot blurry or junk images',
      icon: Camera,
      action: () => onModuleScroll && onModuleScroll('Photos Scanner'),
      color: 'text-pink-600'
    },
    {
      type: 'module',
      title: 'Data Leak Monitor',
      description: 'Detect device breaches & risky file shares',
      icon: Shield,
      action: () => onModuleScroll && onModuleScroll('Data Leak Monitor'),
      color: 'text-orange-600'
    },
    {
      type: 'module',
      title: 'AI Risk Predictor',
      description: 'Get early warnings for potential risks',
      icon: Brain,
      action: () => onModuleScroll && onModuleScroll('AI Risk Predictor'),
      color: 'text-indigo-600'
    },
    {
      type: 'module',
      title: 'Instant Leak Alerts',
      description: 'Know if your credentials are exposed',
      icon: AlertTriangle,
      action: () => onModuleScroll && onModuleScroll('Instant Leak Alerts'),
      color: 'text-yellow-600'
    },
    {
      type: 'module',
      title: 'Auto Cleanup',
      description: 'One-click removal of approved junk',
      icon: Sparkles,
      action: () => onModuleScroll && onModuleScroll('Auto Cleanup'),
      color: 'text-cyan-600'
    },
    {
      type: 'module',
      title: 'Digital Risk Score',
      description: 'Monitor and improve your privacy index',
      icon: BarChart3,
      action: () => onModuleScroll && onModuleScroll('Digital Risk Score'),
      color: 'text-emerald-600'
    },
    // Other searchable items
    {
      type: 'section',
      title: 'Breach Radar',
      description: 'Monitor data breaches and security alerts',
      icon: AlertTriangle,
      action: () => onModuleScroll && onModuleScroll('Breach Radar'),
      color: 'text-red-600'
    },
    {
      type: 'section',
      title: 'Email Classification',
      description: 'Analyze and categorize your emails',
      icon: Mail,
      action: () => onModuleScroll && onModuleScroll('Email Classification'),
      color: 'text-blue-600'
    },
    {
      type: 'metric',
      title: 'Email Health',
      description: 'Monitor your email processing status',
      icon: CheckCircle,
      action: () => onModuleScroll && onModuleScroll('Email Health'),
      color: 'text-green-600'
    },
    {
      type: 'metric',
      title: 'Storage Status',
      description: 'Check your storage optimization',
      icon: BarChart3,
      action: () => onModuleScroll && onModuleScroll('Storage Status'),
      color: 'text-yellow-600'
    },
    {
      type: 'metric',
      title: 'Digital Wellness',
      description: 'Track your digital wellness metrics',
      icon: Activity,
      action: () => onModuleScroll && onModuleScroll('Digital Wellness'),
      color: 'text-blue-600'
    }
  ];

  // Filter search results
  const filteredResults = searchQuery.trim() === '' ? [] : searchData.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (item) => {
    if (item.title === 'Website Tracker') {
      navigate('/website-tracker');
    } else {
      item.action();
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const profileMenuItems = [
    {
      icon: User,
      label: 'View Profile',
      action: () => navigate('/profile'),
      color: 'text-blue-600'
    },
    {
      icon: Edit3,
      label: 'Edit Profile',
      action: () => navigate('/profile'),
      color: 'text-green-600'
    },
    {
      icon: Settings,
      label: 'Account Settings',
      action: () => navigate('/profile'),
      color: 'text-purple-600'
    },
    {
      icon: Shield,
      label: 'Privacy Settings',
      action: () => navigate('/profile'),
      color: 'text-orange-600'
    }
  ];

  const notifications = [
    {
      type: 'security',
      title: 'Security alert detected',
      message: 'Suspicious activity found in your account',
      time: '2 minutes ago',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      dotColor: 'bg-red-500'
    },
    {
      type: 'success',
      title: 'Scan completed',
      message: 'Your privacy scan found 3 new issues',
      time: '1 hour ago',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-200',
      dotColor: 'bg-green-500'
    }
  ];

  return (
    <header className="relative z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="flex items-center justify-center"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Fingerprint className="text-blue-600" size={32} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">FootprintX</span>
                <span className="text-xs text-gray-500 font-medium">Privacy Intelligence Platform</span>
              </div>
            </motion.div>
            
            {/* Back to Home */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToHome}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium text-sm"
            >
              <Home size={16} />
              <span>Home</span>
            </motion.button>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 max-w-md mx-8"
            ref={searchRef}
          >
            <div className="relative">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 hover:border-blue-300 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search modules, alerts, files, settings..."
                  className="bg-transparent outline-none text-sm w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchOpen && (searchQuery.trim() !== '' || filteredResults.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 max-h-96 overflow-y-auto"
                  >
                    {filteredResults.length > 0 ? (
                      <div className="space-y-2">
                        {filteredResults.map((item, index) => (
                          <motion.button
                            key={`${item.type}-${item.title}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSearchSelect(item)}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className={`p-2 rounded-lg bg-gray-100`}>
                              <item.icon size={16} className={item.color} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-600">{item.description}</p>
                            </div>
                            <div className="text-xs text-gray-400 capitalize">{item.type}</div>
                          </motion.button>
                        ))}
                      </div>
                    ) : searchQuery.trim() !== '' ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No results found for "{searchQuery}"</p>
                        <p className="text-gray-400 text-xs mt-1">Try searching for modules, alerts, or settings</p>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* User Actions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button 
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${notification.color}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${notification.dotColor}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                          <notification.icon size={16} className="text-gray-400" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-medium text-gray-700">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">Premium Member</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50"
                  >
                    {/* User Info */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User size={24} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                      </div>
                    </div>

                    {/* Profile Menu Items */}
                    <div className="space-y-1">
                      {profileMenuItems.map((item, index) => (
                        <motion.button
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            item.action();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <item.icon size={18} className={item.color} />
                          <span className="text-gray-700 font-medium">{item.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Logout */}
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => {
                        onLogout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
                    >
                      <LogOut size={18} />
                      <span className="font-medium">Logout</span>
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

export default Header;