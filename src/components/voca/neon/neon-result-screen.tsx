'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import './neon-styles.css';

interface NeonResultScreenProps {
  score: number;
  passThreshold: number;
  passMessage: string;
  failMessage: string;
  subtitle?: string;
  onRetry?: () => void;
}

export function NeonResultScreen({
  score,
  passThreshold,
  passMessage,
  failMessage,
  subtitle,
  onRetry,
}: NeonResultScreenProps) {
  const passed = score >= passThreshold;

  return (
    <div className="neon-container p-6 min-h-[60dvh] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-4"
      >
        <p className={cn('text-6xl font-bold', passed ? 'text-green-600' : 'text-brand-600')}>
          {score}%
        </p>
        {subtitle && (
          <p className="text-gray-500 text-lg">{subtitle}</p>
        )}
        <p className="text-gray-400 text-base">
          {passed ? passMessage : failMessage}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'mt-4 px-6 py-2.5 rounded-xl border-2 font-medium transition-colors',
              passed
                ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                : 'border-brand-300 text-brand-600 hover:bg-brand-50',
            )}
          >
            {passed ? '다시 풀기' : '새 문제로 다시 풀기'}
          </button>
        )}
      </motion.div>
    </div>
  );
}
