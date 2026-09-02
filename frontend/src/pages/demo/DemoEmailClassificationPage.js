import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import DemoEmailClassification from '../../components/demo/DemoEmailClassification';

/**
 * DemoEmailClassificationPage — wraps DemoEmailClassification
 * in a full-page layout matching the real EmailClassification page style.
 */
export default function DemoEmailClassificationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-xl" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail size={22} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-1">
                Email Classification
              </h1>
              <p className="text-gray-500 text-sm">AI-categorized inbox overview — Demo Mode sample data</p>
            </div>
          </div>
        </motion.div>

        {/* Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <DemoEmailClassification />
        </motion.div>

      </div>
    </div>
  );
}
