import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, AlertTriangle, Clock, Star } from 'lucide-react';

const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  bgColor, 
  stats,
  status
}) => {
  const navigate = useNavigate();
  
  const handleModuleClick = () => {
    if (title === 'Website Tracker') {
      navigate('/website-tracker');
    } else if (title === 'Drive Decay Detector') {
      navigate('/drive-cleanup');
    } else if (title === 'Drive File Classifier') {
      navigate('/drive-classifier');
    } else if (title === 'Email Subscription Manager') {
      navigate('/email-manager');
    } else if (title === 'Photos Scanner') {
      navigate('/photos-scanner');
    } else if (title === 'Auto Cleanup') {
      navigate('/auto-cleanup');
    } else if (title === 'Digital Risk Score') {
      navigate('/digital-risk-score');
    } else if (title === 'Data Leak Monitor') {
      navigate('/data-leak-monitor');
    } else if (title === 'AI Risk Predictor') {
      navigate('/ai-risk-predictor');
    } else if (title === 'Instant Leak Alerts') {
      navigate('/instant-leak-alerts');
    } else {
      console.log(`Opening ${title} module`);
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-semibold">Active</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-600 font-semibold">Warning</span>
          </div>
        );
      case 'alert':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600 font-semibold">Alert</span>
          </div>
        );
      case 'safe':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-600 font-semibold">Safe</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-cyan-600 font-semibold">Ready</span>
          </div>
        );
      case 'excellent':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-600 font-semibold">Excellent</span>
          </div>
        );
      default:
        return null;
    }
  };

  const PREMIUM_TITLES = new Set(['Data Leak Monitor', 'AI Risk Predictor', 'Instant Leak Alerts']);
  const isPremium = PREMIUM_TITLES.has(title);

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)" 
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleModuleClick}
      className="module-card group relative overflow-hidden h-full flex flex-col"
    >
      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
          <Star size={9} className="text-white fill-white" />
          <span className="text-white text-xs font-bold tracking-wide">PREMIUM</span>
        </div>
      )}
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <motion.div 
            className={`p-3 rounded-xl ${bgColor} shadow-lg group-hover:shadow-xl transition-all duration-300`}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </motion.div>
          <div className="text-right flex flex-col items-end space-y-2">
            {getStatusIndicator()}
            <div>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                {stats}
              </span>
            </div>
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="flex-1 mb-6">
          <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-gray-800 transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
            {description}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>Open Tool</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          {/* Animated Status Dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'active' ? 'bg-green-400' :
                  status === 'warning' ? 'bg-yellow-400' :
                  status === 'alert' ? 'bg-red-400' :
                  status === 'safe' ? 'bg-blue-400' :
                  status === 'ready' ? 'bg-cyan-400' :
                  status === 'excellent' ? 'bg-emerald-400' :
                  'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModuleCard;