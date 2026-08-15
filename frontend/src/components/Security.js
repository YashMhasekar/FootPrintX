import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Eye, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Fingerprint,
  Brain,
  Database,
  Cpu,
  TrendingUp,
  Heart,
  Star,
  Clock,
  Bell,
  Sparkles,
  AlertTriangle,
  Key,
  Server,
  Globe,
  Users,
  Target,
  BarChart3,
  Settings,
  Monitor
} from 'lucide-react';

const Security = () => {
  const securityFeatures = [
    {
      title: "Zero-Knowledge Architecture",
      description: "Your data never leaves your device. We use end-to-end encryption that even we can't access.",
      icon: Lock,
      color: "text-green-600",
      bgColor: "bg-green-50",
      benefits: [
        "End-to-end encryption",
        "Local data processing",
        "No data storage on servers",
        "Complete privacy control"
      ]
    },
    {
      title: "Military-Grade Encryption",
      description: "AES-256 encryption with RSA-4096 keys ensures your data is protected at the highest level.",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      benefits: [
        "AES-256 encryption",
        "RSA-4096 key pairs",
        "256-bit security",
        "Industry-standard protocols"
      ]
    },
    {
      title: "Real-Time Threat Detection",
      description: "AI-powered monitoring that detects and blocks threats within 30 seconds of detection.",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      benefits: [
        "AI threat detection",
        "30-second response time",
        "Proactive monitoring",
        "Instant alerts"
      ]
    },
    {
      title: "Secure Data Transmission",
      description: "All data transmission is secured with TLS 1.3 and certificate pinning for maximum security.",
      icon: Globe,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      benefits: [
        "TLS 1.3 encryption",
        "Certificate pinning",
        "Secure channels",
        "Data integrity"
      ]
    }
  ];

  const securityProtocols = [
    {
      title: "Multi-Factor Authentication",
      description: "Advanced MFA with biometric, hardware key, and app-based authentication options",
      icon: Key,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      status: "Active"
    },
    {
      title: "Regular Security Audits",
      description: "Third-party security audits conducted quarterly to ensure compliance and best practices",
      icon: Monitor,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      status: "Quarterly"
    },
    {
      title: "Incident Response",
      description: "24/7 security monitoring with automated incident response and manual escalation",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "24/7"
    },
    {
      title: "Data Backup & Recovery",
      description: "Automated encrypted backups with point-in-time recovery capabilities",
      icon: Database,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      status: "Automated"
    }
  ];

  const compliance = [
    {
      title: "GDPR Compliant",
      description: "Full compliance with European data protection regulations",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "SOC 2 Type II",
      description: "Service Organization Control 2 certification for security controls",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "ISO 27001",
      description: "International standard for information security management",
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "HIPAA Ready",
      description: "Health Insurance Portability and Accountability Act compliance",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    }
  ];

  const threatProtection = [
    {
      title: "Malware Detection",
      description: "Advanced AI algorithms detect and block malware, ransomware, and other threats",
      icon: Cpu,
      color: "text-red-500",
      bgColor: "bg-red-50",
      accuracy: "99.9%"
    },
    {
      title: "Phishing Protection",
      description: "Real-time phishing detection with URL analysis and email scanning",
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      accuracy: "99.7%"
    },
    {
      title: "Data Breach Monitoring",
      description: "Continuous monitoring of 15+ billion records for credential exposure",
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      accuracy: "99.9%"
    },
    {
      title: "Network Security",
      description: "Advanced firewall and intrusion detection systems",
      icon: Server,
      color: "text-green-500",
      bgColor: "bg-green-50",
      accuracy: "99.8%"
    }
  ];

  const securityStats = [
    {
      number: "99.9%",
      label: "Threat Detection Rate",
      description: "Industry-leading accuracy",
      icon: Target,
      color: "text-green-600"
    },
    {
      number: "<30s",
      label: "Response Time",
      description: "Lightning-fast alerts",
      icon: Zap,
      color: "text-blue-600"
    },
    {
      number: "15B+",
      label: "Records Monitored",
      description: "Comprehensive coverage",
      icon: Database,
      color: "text-purple-600"
    },
    {
      number: "0",
      label: "Security Breaches",
      description: "Zero incidents to date",
      icon: Shield,
      color: "text-red-600"
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
                <Shield className="text-blue-600" size={42} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Security Center
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
              <span className="text-gray-800">Enterprise-Grade</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 bg-clip-text text-transparent">
                Security Protection
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Your digital security is our top priority. We employ military-grade encryption, 
              zero-knowledge architecture, and AI-powered threat detection to keep you safe.
            </motion.p>
          </motion.div>

          {/* Security Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {securityStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={stat.color} size={32} />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-700 mb-2">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="relative z-10 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Advanced Security Features
          </motion.h2>
          
          <div className="space-y-12">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
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
                        <feature.icon className={feature.color} size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{feature.title}</h3>
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
                          <feature.icon className={feature.color} size={40} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h4>
                        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                          <div className="text-sm text-gray-600">Security Feature</div>
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

      {/* Security Protocols */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Security Protocols & Standards
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityProtocols.map((protocol, index) => (
              <motion.div
                key={protocol.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-16 h-16 ${protocol.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                  <protocol.icon className={protocol.color} size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{protocol.title}</h3>
                <p className="text-gray-600 mb-4">{protocol.description}</p>
                <div className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {protocol.status}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Compliance & Certifications
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {compliance.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 text-center"
              >
                <div className={`w-16 h-16 ${item.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={item.color} size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Threat Protection */}
      <section className="relative z-10 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Threat Protection & Detection
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {threatProtection.map((threat, index) => (
              <motion.div
                key={threat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-16 h-16 ${threat.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                  <threat.icon className={threat.color} size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{threat.title}</h3>
                <p className="text-gray-600 mb-4">{threat.description}</p>
                <div className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {threat.accuracy} Accuracy
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
              Your Security is Our Priority
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience enterprise-grade security with military-grade encryption, 
              zero-knowledge architecture, and AI-powered threat detection.
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
              <Shield className="relative z-10" size={24} />
              <span className="relative z-10">🚀 Start Securing Your Data</span>
              <ArrowRight className="relative z-10" size={22} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Security; 