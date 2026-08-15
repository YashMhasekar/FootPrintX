import React from 'react';
import { motion } from 'framer-motion';
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
  ArrowRight,
  CheckCircle,
  Zap,
  Lock,
  Eye,
  Smartphone,
  Database,
  Cpu,
  Target,
  TrendingUp
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      id: 1,
      title: "Website Tracker",
      description: "Comprehensive monitoring and management of your online accounts across the web",
      icon: Globe,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      benefits: [
        "Track 142+ online accounts automatically",
        "Monitor account activity and security",
        "Get alerts for suspicious logins",
        "Centralized account management"
      ],
      stats: "142 accounts tracked"
    },
    {
      id: 2,
      title: "Email Subscription Manager",
      description: "Intelligent email management to declutter your inbox and reduce digital noise",
      icon: Mail,
      color: "text-green-500",
      bgColor: "bg-green-50",
      benefits: [
        "Identify 38+ unwanted subscriptions",
        "One-click unsubscribe functionality",
        "Smart email categorization",
        "Reduce inbox clutter by 60%"
      ],
      stats: "38 subscriptions found"
    },
    {
      id: 3,
      title: "Drive File Classifier",
      description: "AI-powered organization and classification of your Google Drive files",
      icon: FolderOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      benefits: [
        "Analyze 1,247+ files automatically",
        "Smart categorization by type and content",
        "Identify duplicate and redundant files",
        "Optimize storage space usage"
      ],
      stats: "1,247 files analyzed"
    },
    {
      id: 4,
      title: "Drive Decay Detector",
      description: "Detect and remove unused, outdated, and unnecessary files from your storage",
      icon: Trash2,
      color: "text-red-500",
      bgColor: "bg-red-50",
      benefits: [
        "Find 892+ unused files",
        "Identify outdated documents",
        "Safe deletion recommendations",
        "Free up valuable storage space"
      ],
      stats: "892 unused files"
    },
    {
      id: 5,
      title: "Photos Scanner",
      description: "Advanced image analysis to identify and clean up blurry or junk photos",
      icon: Camera,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      benefits: [
        "Detect 156+ low-quality images",
        "Identify blurry and duplicate photos",
        "Smart photo organization",
        "Preserve precious memories"
      ],
      stats: "156 junk photos found"
    },
    {
      id: 6,
      title: "Data Leak Monitor",
      description: "Real-time monitoring for data breaches and risky file sharing activities",
      icon: Shield,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      benefits: [
        "Monitor 3+ active security alerts",
        "Detect unauthorized file sharing",
        "Real-time breach notifications",
        "Proactive security measures"
      ],
      stats: "3 alerts active"
    },
    {
      id: 7,
      title: "AI Risk Predictor",
      description: "Advanced AI algorithms to predict and warn about potential security risks",
      icon: Brain,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      benefits: [
        "Predict potential security threats",
        "Early warning system",
        "Risk assessment scoring",
        "Preventive action recommendations"
      ],
      stats: "Low risk detected"
    },
    {
      id: 8,
      title: "Instant Leak Alerts",
      description: "Immediate notifications when your credentials are exposed in data breaches",
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      benefits: [
        "Real-time breach monitoring",
        "Instant credential exposure alerts",
        "Password security recommendations",
        "Proactive account protection"
      ],
      stats: "No breaches found"
    },
    {
      id: 9,
      title: "Auto Cleanup",
      description: "One-click automated cleanup of approved junk files and unnecessary data",
      icon: Sparkles,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      benefits: [
        "Automated cleanup processes",
        "Safe deletion protocols",
        "Bulk operation support",
        "Time-saving automation"
      ],
      stats: "Ready to clean"
    },
    {
      id: 10,
      title: "Digital Risk Score",
      description: "Comprehensive privacy index monitoring and improvement recommendations",
      icon: BarChart3,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      benefits: [
        "87/100 Excellent privacy score",
        "Detailed risk assessment",
        "Improvement recommendations",
        "Progress tracking over time"
      ],
      stats: "87/100 Excellent"
    }
  ];

  const categories = [
    {
      title: "Account Management",
      description: "Comprehensive tools for managing your online presence",
      features: [1, 2],
      icon: Globe,
      color: "text-blue-600"
    },
    {
      title: "Storage Optimization",
      description: "Intelligent file management and cleanup solutions",
      features: [3, 4, 5],
      icon: FolderOpen,
      color: "text-purple-600"
    },
    {
      title: "Security & Monitoring",
      description: "Advanced security features and real-time monitoring",
      features: [6, 7, 8],
      icon: Shield,
      color: "text-orange-600"
    },
    {
      title: "Automation & Analytics",
      description: "Smart automation and comprehensive analytics",
      features: [9, 10],
      icon: Sparkles,
      color: "text-cyan-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <motion.div 
        className="relative z-10 border-b border-gray-300/30 backdrop-blur-xl bg-white/95 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center justify-center">
                <Globe className="text-blue-600" size={42} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  FootprintX Features
                </span>
                <span className="text-xs text-gray-500 font-medium mt-1">Privacy Intelligence Platform</span>
              </div>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => window.history.back()}
              className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-semibold flex items-center space-x-3 shadow-md border-2 border-gray-200 hover:border-blue-300 transition-all duration-300"
            >
              <ArrowRight className="rotate-180" size={20} />
              <span>Back to Home</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <span className="text-gray-800">Comprehensive</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 bg-clip-text text-transparent">
                Privacy Intelligence
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Discover our complete suite of AI-powered tools designed to protect your digital privacy, 
              optimize your storage, and provide comprehensive security monitoring.
            </motion.p>
          </motion.div>

          {/* Feature Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <category.icon className={category.color} size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            All Features
          </motion.h2>
          
          <div className="space-y-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Left Side - Content */}
                  <div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <feature.icon className={`${feature.color}`} size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{feature.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600 font-semibold">{feature.stats}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.div
                          key={benefitIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 + benefitIndex * 0.1 }}
                          className="flex items-center space-x-3"
                        >
                          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                          <span className="text-gray-700">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Side - Visual */}
                  <div className="relative">
                    <div className={`${feature.bgColor} rounded-2xl p-8 h-full flex flex-col justify-center`}>
                      <div className="text-center">
                        <div className={`w-20 h-20 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <feature.icon className={`${feature.color}`} size={40} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h4>
                        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                          <div className="text-2xl font-bold text-gray-800">{feature.stats}</div>
                          <div className="text-sm text-gray-600">Current Status</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Ready to Secure Your Digital Privacy?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join millions of users who trust FootprintX to protect their digital lives with 
              cutting-edge AI technology and comprehensive privacy tools.
            </p>
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl border-0 group overflow-hidden mx-auto"
            >
              <Zap className="relative z-10" size={24} />
              <span className="relative z-10">🚀 Start Free Analysis</span>
              <ArrowRight className="relative z-10" size={22} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Features; 