'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountUp, StaggerContainer, StaggerItem } from '@/components/shared/motion';
import { cn } from '@/lib/utils';

interface TopStudent {
  name: string;
  score: number;
  rank: number;
}

export interface VocaDayRankCardProps {
  dayTitle: string;
  rank: number;
  totalStudents: number;
  totalScore: number;
  scores: { quiz: number; spelling: number; matching: number };
  topStudents: TopStudent[];
  onClose: () => void;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-12 w-12 text-amber-400" />;
  if (rank === 2) return <Medal className="h-12 w-12 text-gray-300" />;
  if (rank === 3) return <Medal className="h-12 w-12 text-orange-400" />;
  return (
    <div className="h-12 w-12 rounded-full bg-slate-600 flex items-center justify-center text-xl font-bold text-white">
      {rank}
    </div>
  );
}

function RankEmoji({ rank }: { rank: number }) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}위`;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, score);
  const isGood = score >= 80;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-14 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-white w-8 text-right">{score}</span>
      <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', isGood ? 'bg-emerald-500' : 'bg-slate-400')}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function getRankLabel(rank: number, totalStudents: number) {
  if (totalStudents <= 1) return '완료!';
  if (rank === 1) return '우리 반 1등!';
  if (rank <= 3) return `우리 반 ${rank}등!`;
  return `${rank}등`;
}

export function VocaDayRankCard({
  dayTitle,
  rank,
  totalStudents,
  totalScore,
  scores,
  topStudents,
  onClose,
}: VocaDayRankCardProps) {
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
          className="relative w-full max-w-sm bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 space-y-5">
            {/* Title */}
            <div className="text-center space-y-1">
              <p className="text-sm text-slate-400">{dayTitle}</p>
              <p className="text-xl font-bold text-white">완료!</p>
            </div>

            {/* Medal + Rank */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                className="inline-block"
              >
                <RankIcon rank={rank} />
              </motion.div>
              <p className="text-lg font-bold text-white">{getRankLabel(rank, totalStudents)}</p>
              {totalStudents > 1 && (
                <p className="text-sm text-slate-400">{rank} / {totalStudents}명</p>
              )}
            </div>

            {/* Total Score */}
            <div className="bg-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-400">총점</span>
                <div className="text-2xl font-bold text-white">
                  <CountUp to={totalScore} duration={1.2} />
                  <span className="text-sm text-slate-400 ml-1">/ 300</span>
                </div>
              </div>
              <div className="space-y-2">
                <ScoreBar label="퀴즈" score={scores.quiz} />
                <ScoreBar label="스펠링" score={scores.spelling} />
                <ScoreBar label="매칭" score={scores.matching} />
              </div>
            </div>

            {/* Top Students */}
            {topStudents.length > 1 && (
              <StaggerContainer className="bg-slate-800/80 rounded-xl p-4 space-y-2">
                {topStudents.map((s, i) => {
                  const isMe = s.rank === rank && s.score === totalScore;
                  return (
                    <StaggerItem
                      key={i}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm',
                        isMe ? 'bg-indigo-500/20 ring-1 ring-indigo-400/30' : ''
                      )}
                    >
                      <span className="w-8 text-center">{RankEmoji({ rank: s.rank })}</span>
                      <span className={cn('flex-1 truncate', isMe ? 'text-white font-semibold' : 'text-slate-300')}>
                        {s.name}
                        {isMe && <span className="text-indigo-300 ml-1 text-xs">나</span>}
                      </span>
                      <span className={cn('font-medium', isMe ? 'text-white' : 'text-slate-400')}>
                        {s.score}점
                      </span>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}

            {/* Confirm Button */}
            <Button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
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
