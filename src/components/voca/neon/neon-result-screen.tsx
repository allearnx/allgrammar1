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
}

export function NeonResultScreen({
  score,
  passThreshold,
  passMessage,
  failMessage,
  subtitle,
}: NeonResultScreenProps) {
  const passed = score >= passThreshold;

  return (
    <div className="neon-container p-6 min-h-[60dvh] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-4"
      >
        <p className={cn('text-5xl font-bold', passed ? 'neon-text-green' : 'neon-text-gold')}>
          {score}%
        </p>
        {subtitle && (
          <p className="text-slate-400">{subtitle}</p>
        )}
        <p className="text-slate-500 text-sm">
          {passed ? passMessage : failMessage}
        </p>
      </motion.div>
    </div>
  );
}
