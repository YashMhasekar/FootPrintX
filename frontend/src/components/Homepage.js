import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BarChart3, 
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Users,
  Award,
  Database,
  Cpu,
  Fingerprint,
  Lock,
  Play,
  Target,
  Clock,
  Bell,
  Sparkles,
  TrendingUp,
  User,
  LogOut
} from 'lucide-react';
import AuthModal from './AuthModal';

const Homepage = ({ onLogin, isLoggedIn, user }) => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Core features with professional cybersecurity design
  const features = [
    {
      icon: Search,
      title: 'AI-Powered Detection',
      description: 'Scan 15+ billion breach records instantly with 99.9% accuracy. Never miss a threat.',
      color: 'from-blue-600 to-indigo-700',
      accent: 'text-blue-700',
      delay: 0.1
    },
    {
      icon: Shield,
      title: 'Real-Time Defense',
      description: 'Automatic threat blocking and instant alerts within 30 seconds of detection.',
      color: 'from-red-600 to-rose-700',
      accent: 'text-red-700',
      delay: 0.2
    },
    {
      icon: BarChart3,
      title: 'Privacy Intelligence',
      description: 'Advanced analytics reveal your complete digital footprint and risk exposure.',
      color: 'from-slate-600 to-gray-700',
      accent: 'text-slate-700',
      delay: 0.3
    },
    {
      icon: Cpu,
      title: 'Smart Automation',
      description: 'ML-powered cleanup removes 12GB+ of risky data automatically.',
      color: 'from-teal-600 to-cyan-700',
      accent: 'text-teal-700',
      delay: 0.4
    }
  ];

  const stats = [
    { number: '2.4M+', label: 'Users Protected', icon: Users, color: 'from-blue-600 to-indigo-700', bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50' },
    { number: '99.9%', label: 'Detection Rate', icon: Target, color: 'from-red-600 to-rose-700', bgColor: 'bg-gradient-to-br from-red-50 to-rose-50' },
    { number: '15B+', label: 'Records Monitored', icon: Database, color: 'from-slate-600 to-gray-700', bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50' },
    { number: '<30s', label: 'Response Time', icon: Zap, color: 'from-teal-600 to-cyan-700', bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50' }
  ];

  const benefits = [
    { text: 'Military-grade encryption', icon: Shield },
    { text: 'GDPR compliant', icon: CheckCircle },
    { text: 'Zero-knowledge architecture', icon: Lock },
    { text: 'Real-time monitoring', icon: Clock },
    { text: 'Instant alerts', icon: Bell }
  ];

  const testimonials = [
    {
      quote: "FootprintX helped me secure my digital life in just minutes. The insights were eye-opening.",
      author: "Sanika Mane",
      role: "Privacy Advocate",
      avatar: "SM"
    },
    {
      quote: "Finally found a privacy tool that actually works. Clean interface and powerful protection.",
      author: "Shraddha Patil",
      role: "Security Consultant",
      avatar: "SP"
    },
    {
      quote: "Best privacy scanner I've used. Discovered breaches I didn't even know about.",
      author: "Sayali Khatkar",
      role: "Tech Professional",
      avatar: "SK"
    }
  ];

  // Auto-rotate features and mouse tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [features.length]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    // Reload the page to reset the state
    window.location.reload();
  };

  const handleAuthModalOpen = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Dynamic Background with Mouse Interaction */}
      <div 
        className="fixed inset-0"
        style={{
          background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.06), transparent 70%)`
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-slate-50/15" />
      


      {/* Navigation */}
      <nav className="relative z-50 border-b border-gray-300/30 backdrop-blur-xl bg-white/95 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <motion.div 
                className="flex items-center justify-center"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Fingerprint className="text-blue-600" size={44} />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">FootprintX</span>
                <span className="text-xs text-gray-500 font-medium mt-1">Privacy Intelligence Platform</span>
              </div>
            </motion.div>

            {/* Navigation Menu */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:flex items-center space-x-10"
            >
              <div className="flex items-center space-x-8">
                <button 
                  onClick={() => navigate('/features')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <Shield size={18} />
                  <span>Features</span>
                </button>
                <button 
                  onClick={() => navigate('/security')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <Lock size={18} />
                  <span>Security</span>
                </button>
                <button 
                  onClick={() => navigate('/about')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <Users size={18} />
                  <span>About</span>
                </button>
              </div>
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              {isLoggedIn ? (
                <>
                  {/* Enhanced User Info Display */}
                  <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-200/50 shadow-lg">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-white" />
                      )}
                    </div>
                    
                    {/* User Details */}
                    <div className="flex flex-col">
                      <span className="text-gray-800 font-semibold text-sm">
                        {user?.name || user?.firstName || 'User'}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {user?.email || 'user@example.com'}
                      </span>
                    </div>
                  </div>

                  {/* Go to Dashboard Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToDashboard}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <BarChart3 size={16} />
                    <span>Dashboard</span>
                  </motion.button>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </motion.button>
                </>
              ) : (
                <>
                  {/* Demo Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200 px-6 py-3 rounded-xl hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
                  >
                    <Play size={16} />
                    <span>Live Demo</span>
                  </motion.button>

                  {/* Sign In Button */}
                  <motion.button
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.25)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAuthModalOpen}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className="relative bg-white hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-xl font-semibold flex items-center space-x-3 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 text-gray-700 group-hover:text-blue-700">Sign In</span>
                    <ArrowRight className="relative z-10 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-transform duration-300" size={16} />
                  </motion.button>

                  {/* Sign Up Button */}
                  <motion.button
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.25)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAuthModalOpen}
                    className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" size={16} />
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center">
        {/* Full Screen Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/homeimage.png')"
            }}
          />
          {/* Minimal overlay for better text visibility only */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Content positioned above the image */}
        <div className="relative z-10 text-center px-6 py-20 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8"
          >
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight drop-shadow-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              {isLoggedIn ? (
                <>
                  <span className="text-white drop-shadow-lg bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    Welcome back, {user?.name || user?.firstName || 'User'}! 👋
                  </span>
                  <br />
                  <span className="text-white drop-shadow-lg font-extrabold">
                    Your Privacy is Protected
                  </span>
                </>
              ) : (
                <>
                  <span className="text-white drop-shadow-lg bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    Secure Your Digital Privacy
                  </span>
                  <br />
                  <span className="text-white drop-shadow-lg font-extrabold">
                    Effortlessly & Intelligently
                  </span>
                </>
              )}
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-white max-w-4xl mx-auto leading-relaxed mb-12 drop-shadow-lg font-medium text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              {isLoggedIn ? (
                <>
                  Great to see you again! Your digital footprint is being monitored and protected 24/7. 
                  <span className="text-blue-200 font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                    {" "}Check your dashboard for the latest security insights and privacy recommendations.
                  </span>
                </>
              ) : (
                <>
                  AI-powered privacy protection that 
                  <span className="text-blue-200 font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                    {" "}blocks threats instantly, cleans your digital footprint, and gives you complete control.
                  </span>
                </>
              )}
            </motion.p>
          </motion.div>

          {/* User Status Badge - Only when logged in */}
          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="w-full max-w-md mx-auto mb-8 text-center"
            >
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm border border-white/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Logged in as: {user?.email || 'user@example.com'}</span>
              </div>
            </motion.div>
          )}
          
          {/* Action Buttons Container - Always centered with consistent spacing */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full"
          >
            {isLoggedIn ? (
              <>
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoToDashboard}
                  className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-12 py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-4 shadow-2xl border-0 group overflow-hidden min-w-[320px] hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 text-lg">🚀 Go to Dashboard</span>
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <ArrowRight size={24} />
                  </motion.div>
                </motion.button>
                
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.5)"
                  }}
                  onClick={() => navigate('/features')}
                  className="border-2 border-white/40 text-white hover:text-white px-12 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 flex items-center justify-center space-x-4 backdrop-blur-md bg-white/10 shadow-xl min-w-[280px] hover:bg-white/20"
                >
                  <Shield size={24} className="text-white" />
                  <span>View Features</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAuthModalOpen}
                  className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-12 py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-4 shadow-2xl border-0 group overflow-hidden min-w-[320px] hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 text-lg">🚀 Start Free Analysis</span>
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <ArrowRight size={24} />
                  </motion.div>
                </motion.button>
                
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.5)"
                  }}
                  className="border-2 border-white/40 text-white hover:text-white px-12 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 flex items-center justify-center space-x-4 backdrop-blur-md bg-white/10 shadow-xl min-w-[280px] hover:bg-white/20"
                >
                  <Play size={24} className="text-white" />
                  <span>Watch Demo</span>
                </motion.button>
              </>
            )}
          </motion.div>
        </div>
      </section>



      {/* Stats Section */}
      <section className="relative z-10 py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              className="inline-flex items-center bg-blue-500/20 backdrop-blur-md text-blue-200 px-6 py-3 rounded-full text-sm font-medium mb-8 border border-blue-400/30"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 40px rgba(59, 130, 246, 0.5)",
                  "0 0 20px rgba(59, 130, 246, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <TrendingUp className="mr-3" size={18} />
              Global Impact & Trust
            </motion.div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Protecting Digital Lives
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent"> Worldwide</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join millions who've reclaimed their digital privacy with our advanced AI protection. 
              <span className="font-semibold text-blue-200"> Trusted by security professionals globally.</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -15,
                  boxShadow: "0 30px 60px rgba(59, 130, 246, 0.4)"
                }}
                className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 group"
              >
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500`}
                  animate={{ 
                    rotateY: [0, 360],
                    boxShadow: [
                      "0 0 20px rgba(255, 255, 255, 0.2)",
                      "0 0 40px rgba(255, 255, 255, 0.4)",
                      "0 0 20px rgba(255, 255, 255, 0.2)"
                    ]
                  }}
                  transition={{ 
                    rotateY: { duration: 6, repeat: Infinity, delay: index * 0.8 },
                    boxShadow: { duration: 4, repeat: Infinity, delay: index * 0.5 }
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <stat.icon className="text-white" size={32} />
                </motion.div>
                <motion.div 
                  className="text-5xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    textShadow: [
                      "0 0 10px rgba(255, 255, 255, 0.5)",
                      "0 0 20px rgba(255, 255, 255, 0.8)",
                      "0 0 10px rgba(255, 255, 255, 0.5)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-blue-200 font-semibold text-lg group-hover:text-blue-100 transition-colors duration-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition Section - Lower */}
      <section className="relative z-10 py-8 bg-gradient-to-b from-slate-800 via-slate-100 to-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center bg-blue-100 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-blue-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="mr-2" size={16} />
              Advanced AI Technology
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Complete Privacy 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Arsenal</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Every tool you need to dominate digital privacy with enterprise-grade security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: feature.delay }}
                whileHover={{ 
                  y: -12,
                  scale: 1.03,
                  boxShadow: "0 25px 50px rgba(99, 102, 241, 0.2)"
                }}
                className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/60 shadow-xl hover:border-blue-300/80 transition-all duration-500 group overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-500"></div>
                
                {/* Accent border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <motion.div 
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {React.createElement(feature.icon, { 
                      className: "text-white", 
                      size: 28 
                    })}
                  </motion.div>
                  <h3 className={`text-xl font-bold mb-4 ${feature.accent} group-hover:text-blue-700 transition-colors duration-300`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-gray-50 via-blue-50/40 to-indigo-50/40 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                className="inline-flex items-center bg-blue-100 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-blue-200"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Shield className="mr-2" size={16} />
                Enterprise-Grade Security
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 leading-tight">
                Advanced 
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Security</span>
                <br />
                <span className="text-gray-700">That Scales</span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Professional privacy protection that scales with your needs.
                Built for users who value their digital security and demand enterprise-grade protection.
              </p>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ x: 8, scale: 1.02 }}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-white/70 border border-blue-100/60 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl group"
                  >
                    <motion.div
                      className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <benefit.icon className="text-white" size={20} />
                    </motion.div>
                    <span className="text-gray-700 font-semibold text-lg group-hover:text-gray-800 transition-colors duration-300">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 border border-gray-200/60 shadow-2xl relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20"></div>
                
                {/* Accent border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-6 mb-8">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl"
                      animate={{ 
                        boxShadow: [
                          "0 0 20px rgba(34, 197, 94, 0.3)",
                          "0 0 30px rgba(34, 197, 94, 0.5)",
                          "0 0 20px rgba(34, 197, 94, 0.3)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <TrendingUp className="text-white" size={28} />
                    </motion.div>
                    <div>
                      <motion.div 
                        className="text-4xl font-bold text-gray-800 mb-2"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        87/100
                      </motion.div>
                      <div className="text-blue-600 font-semibold text-lg">Privacy Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-emerald-50/80 rounded-xl border border-emerald-200/60 backdrop-blur-sm">
                      <span className="text-gray-700 font-medium">Data Exposure Risk</span>
                      <span className="text-emerald-600 font-bold text-lg">Low</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50/80 rounded-xl border border-blue-200/60 backdrop-blur-sm">
                      <span className="text-gray-700 font-medium">Account Security</span>
                      <span className="text-blue-600 font-bold text-lg">Excellent</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-amber-50/80 rounded-xl border border-amber-200/60 backdrop-blur-sm">
                      <span className="text-gray-700 font-medium">Digital Footprint</span>
                      <span className="text-amber-600 font-bold text-lg">Moderate</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-flex items-center bg-blue-100 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-blue-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Users className="mr-2" size={16} />
              Trusted by Professionals
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Trusted by
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Security Professionals</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real feedback from privacy-focused users and security experts worldwide
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ 
                  y: -15,
                  scale: 1.02,
                  boxShadow: "0 30px 60px rgba(99, 102, 241, 0.2), 0 20px 40px rgba(59, 130, 246, 0.15)"
                }}
                className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-xl rounded-3xl p-10 border border-blue-200/40 shadow-2xl overflow-hidden group"
              >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2359130f6' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
                
                {/* Accent Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
                
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/30 group-hover:to-indigo-50/20 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.3 + 0.5 }}
                  >
                    <div className="flex items-start space-x-3 mb-6">
                      <div className="text-blue-400 text-5xl leading-none font-serif">"</div>
                      <p className="text-gray-700 text-lg leading-relaxed font-medium pt-2">
                        {testimonial.quote}
                      </p>
                      <div className="text-blue-400 text-5xl leading-none self-end font-serif">"</div>
                    </div>
                  </motion.div>
                  
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-xl"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <div className="font-bold text-gray-800 text-lg mb-1">{testimonial.author}</div>
                      <div className="text-indigo-600 font-semibold text-base bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
                
                {/* Subtle Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-300/20 via-indigo-300/20 to-purple-300/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/footerimage.png')"
            }}
          />
          {/* Minimal overlay for better text visibility only */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="rounded-3xl p-16 backdrop-blur-sm bg-white/5 border border-white/20"
          >
            <motion.div
              className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-white/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="mr-2" size={16} />
              Ready to Get Started?
            </motion.div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 drop-shadow-2xl leading-tight">
              {isLoggedIn ? 'Ready to Continue?' : 'Ready to Take Control?'}
            </h2>
            <p className="text-xl text-white mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-medium">
              {isLoggedIn 
                ? `Welcome back, ${user?.name || 'User'}! Continue managing your digital privacy and security.`
                : 'Join 2.4M+ users who\'ve secured their digital privacy. Start your free scan now and discover what\'s hiding in your digital footprint.'
              }
            </p>
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 50px rgba(255, 255, 255, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={isLoggedIn ? handleGoToDashboard : handleAuthModalOpen}
              className="bg-white text-blue-700 px-16 py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-4 mx-auto shadow-2xl hover:bg-blue-50 transition-all duration-300 border-2 border-white/20 hover:border-white/40"
            >
              <span>{isLoggedIn ? 'Go to Dashboard' : 'Start Free Scan'}</span>
              <ArrowRight size={28} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2359130f6' fill-opacity='0.1'%3E%3Cpath d='M0 60L60 0H0V60ZM60 60V0H0L60 60Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        {/* Gradient Border Top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            {/* Logo Section */}
            <motion.div 
              className="flex flex-col items-center md:items-start space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Fingerprint className="text-white" size={28} />
                </motion.div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    FootprintX
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Privacy Intelligence Platform</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed text-center md:text-left max-w-sm">
                Empowering individuals and organizations to take control of their digital privacy with cutting-edge AI technology.
              </p>
            </motion.div>
            
            {/* Mission Statement */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Mission</h3>
              <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                To provide enterprise-grade privacy protection that's accessible to everyone, 
                ensuring digital security without compromising user experience.
              </p>
            </motion.div>
            
            {/* Copyright & Contact */}
            <motion.div 
              className="text-center md:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="text-gray-600 text-sm mb-4">
                © 2024 FootprintX. All rights reserved.
              </div>
              <div className="text-blue-600 font-semibold text-base mb-4">
                🌍 Protecting digital privacy worldwide
              </div>
              <div className="flex justify-center md:justify-end space-x-4 items-center">
                <motion.div 
                  className="w-3 h-3 bg-green-500 rounded-full animate-pulse"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-green-600 text-sm font-medium">AI Systems Online</span>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom Section */}
          <motion.div 
            className="mt-16 pt-8 border-t border-gray-200/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-500 text-sm">
                Built with ❤️ for digital privacy advocates
              </div>
              <div className="flex space-x-8 text-sm text-gray-500">
                <span className="hover:text-blue-600 transition-colors cursor-pointer font-medium">Privacy Policy</span>
                <span className="hover:text-blue-600 transition-colors cursor-pointer font-medium">Terms of Service</span>
                <span className="hover:text-blue-600 transition-colors cursor-pointer font-medium">Contact</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Subtle Glow Effects */}
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        onLogin={onLogin}
      />
    </div>
  );
};

export default Homepage;