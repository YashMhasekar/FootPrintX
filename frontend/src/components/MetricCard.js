import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  bgColor, 
  action, 
  status,
  trend,
  trendDirection,
  onClick,
}) => {
  const getStatusIndicator = () => {
    switch (status) {
      case 'healthy':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
      case 'warning':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
      case 'excellent':
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    return trendDirection === 'up' ? (
      <TrendingUp size={16} className="text-green-500" />
    ) : (
      <TrendingDown size={16} className="text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trendDirection === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)" 
      }}
      onClick={onClick}
      className={`metric-card group${onClick ? ' cursor-pointer' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIndicator()}
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        </div>
        <motion.div 
          className={`p-4 rounded-2xl ${bgColor} shadow-lg group-hover:shadow-xl transition-all duration-300`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className={`w-7 h-7 ${color}`} />
        </motion.div>
      </div>
      
      {/* Value and Subtitle */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="text-4xl font-bold text-gray-900">{value}</div>
          {trend && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm"
            >
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {trend}
              </span>
            </motion.div>
          )}
        </div>
        <div className="text-sm text-gray-600 font-medium">{subtitle}</div>
      </div>
      
      {/* Action Button */}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
          status === 'healthy' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
            : status === 'warning'
            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
        }`}
      >
        {action}
      </motion.button>
    </motion.div>
  );
};

export default MetricCard;