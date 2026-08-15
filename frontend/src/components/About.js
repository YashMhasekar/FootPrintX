import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Target, 
  Users, 
  Globe, 
  Lock, 
  Eye, 
  Zap, 
  Award, 
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
  Sparkles
} from 'lucide-react';

const About = () => {
  const mission = {
    title: "Our Mission",
    description: "To democratize digital privacy protection by making advanced AI-powered security tools accessible to everyone, everywhere.",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  };

  const vision = {
    title: "Our Vision",
    description: "A world where every individual has complete control over their digital footprint and privacy, protected by intelligent, automated systems.",
    icon: Eye,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  };

  const values = [
    {
      title: "Privacy First",
      description: "Your data belongs to you. We believe in zero-knowledge architecture and complete transparency.",
      icon: Lock,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "AI-Powered Intelligence",
      description: "Leveraging cutting-edge artificial intelligence to provide proactive protection and insights.",
      icon: Brain,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "User Empowerment",
      description: "Giving you the tools and knowledge to take control of your digital life.",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Continuous Innovation",
      description: "Constantly evolving our technology to stay ahead of emerging threats.",
      icon: Sparkles,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50"
    }
  ];

  const howItHelps = [
    {
      title: "Comprehensive Protection",
      description: "Protect your digital identity across 15+ billion breach records with 99.9% accuracy",
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-50",
      benefits: [
        "Real-time breach monitoring",
        "Instant threat detection",
        "Proactive security alerts",
        "Comprehensive risk assessment"
      ]
    },
    {
      title: "Intelligent Automation",
      description: "AI-powered tools that automatically clean, organize, and secure your digital life",
      icon: Cpu,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      benefits: [
        "Automated file cleanup",
        "Smart email management",
        "Intelligent storage optimization",
        "One-click security fixes"
      ]
    },
    {
      title: "Privacy Intelligence",
      description: "Advanced analytics and insights to understand and improve your digital privacy score",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50",
      benefits: [
        "Privacy score tracking",
        "Detailed risk analysis",
        "Personalized recommendations",
        "Progress monitoring"
      ]
    },
    {
      title: "User-Friendly Experience",
      description: "Complex security made simple with intuitive interfaces and guided workflows",
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      benefits: [
        "Intuitive dashboard",
        "Guided setup process",
        "Clear visualizations",
        "24/7 support"
      ]
    }
  ];

  const stats = [
    {
      number: "2.4M+",
      label: "Users Protected",
      description: "Trusted by millions worldwide",
      icon: Users,
      color: "text-blue-600"
    },
    {
      number: "99.9%",
      label: "Detection Rate",
      description: "Industry-leading accuracy",
      icon: Target,
      color: "text-green-600"
    },
    {
      number: "15B+",
      label: "Records Monitored",
      description: "Comprehensive coverage",
      icon: Database,
      color: "text-purple-600"
    },
    {
      number: "<30s",
      label: "Response Time",
      description: "Lightning-fast alerts",
      icon: Zap,
      color: "text-orange-600"
    }
  ];

  const team = [
    {
      name: "Privacy Advocates",
      role: "Core Team",
      description: "Experts in cybersecurity, AI, and user privacy",
      avatar: "PA",
      color: "from-blue-500 to-indigo-500"
    },
    {
      name: "AI Researchers",
      role: "Technology",
      description: "Pioneering machine learning for privacy protection",
      avatar: "AR",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Security Engineers",
      role: "Infrastructure",
      description: "Building robust, scalable security systems",
      avatar: "SE",
      color: "from-green-500 to-teal-500"
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
                <Fingerprint className="text-blue-600" size={42} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  About FootprintX
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
              <span className="text-gray-800">Protecting Digital</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 bg-clip-text text-transparent">
                Privacy Worldwide
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              We're on a mission to democratize digital privacy protection, making advanced AI-powered 
              security tools accessible to everyone who values their online privacy and security.
            </motion.p>
          </motion.div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className={`w-16 h-16 ${mission.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                <mission.icon className={mission.color} size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{mission.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">{mission.description}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className={`w-16 h-16 ${vision.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                <vision.icon className={vision.color} size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{vision.title}</h3>
              <p className="text-gray-600 text-lg leading-relaxed">{vision.description}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative z-10 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Our Core Values
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 text-center"
              >
                <div className={`w-16 h-16 ${value.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <value.icon className={value.color} size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Helps Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            How FootprintX Helps You
          </motion.h2>
          
          <div className="space-y-12">
            {howItHelps.map((help, index) => (
              <motion.div
                key={help.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Left Side - Content */}
                  <div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 ${help.bgColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <help.icon className={help.color} size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{help.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                      {help.description}
                    </p>
                    
                    <div className="space-y-3">
                      {help.benefits.map((benefit, benefitIndex) => (
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
                    <div className={`${help.bgColor} rounded-2xl p-8 h-full flex flex-col justify-center`}>
                      <div className="text-center">
                        <div className={`w-20 h-20 ${help.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <help.icon className={help.color} size={40} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{help.title}</h4>
                        <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                          <div className="text-sm text-gray-600">Key Benefits</div>
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

      {/* Stats Section */}
      <section className="relative z-10 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Our Impact
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 text-center"
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

      {/* Team Section */}
      <section className="relative z-10 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 
            className="text-4xl font-bold text-center text-gray-800 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Our Team
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 text-center"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-white font-bold text-xl">{member.avatar}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <div className="text-blue-600 font-semibold mb-3">{member.role}</div>
                <p className="text-gray-600">{member.description}</p>
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
              Join the Privacy Revolution
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Be part of the movement to protect digital privacy worldwide. 
              Start your journey with FootprintX today.
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
              <span className="relative z-10">🚀 Start Protecting Your Privacy</span>
              <ArrowRight className="relative z-10" size={22} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About; 