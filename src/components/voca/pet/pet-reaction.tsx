'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetImage } from './pet-images';
import { STAGE_NAMES } from '@/lib/voca/pet-constants';
import type { PetFeedResult } from '@/lib/voca/pet-constants';

interface PetReactionProps {
  result: PetFeedResult;
  onClose: () => void;
}

export function PetReaction({ result, onClose }: PetReactionProps) {
  const { pet, xpEarned, evolved } = result;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 text-center space-y-4">
            {/* Pet image with bounce */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
            >
              <PetImage stage={pet.stage} mood={pet.mood} size={96} className="mx-auto" />
            </motion.div>

            {/* XP earned */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-extrabold text-amber-500"
            >
              +{xpEarned} XP
            </motion.p>

            {/* Evolution message */}
            {evolved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-1"
              >
                <p className="text-lg font-bold text-brand-600">진화!</p>
                <p className="text-sm text-gray-600">
                  {STAGE_NAMES[pet.stage]}(으)로 성장했어요!
                </p>
              </motion.div>
            )}

            {!evolved && (
              <p className="text-sm text-gray-500">
                {STAGE_NAMES[pet.stage]}에게 밥을 줬어요
              </p>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              확인
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
