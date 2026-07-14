'use client';

import { motion } from 'framer-motion';
import { VocaBrandStyle, VocaHeroLetters, VOCA_COLORS } from '@/components/voca/voca-brand';
import './neon-styles.css';

interface NeonResultScreenProps {
  score: number;
  passThreshold: number;
  passMessage: string;
  failMessage: string;
  subtitle?: string;
  onRetry?: () => void;
  /** 통과 시에만 노출되는 "다음 단계로" 버튼 — 없으면 자동으로 넘어가지 않고 화면에 머문다 */
  onContinue?: () => void;
  continueLabel?: string;
}

/**
 * 단계 최종 결과 — /allkill 톤 (하늘 카드 + 알파벳 + GmarketSans 점수)
 * onContinue가 있으면 자동으로 다음 단계로 넘어가지 않고, 학생이 점수를
 * 확인한 뒤 직접 버튼을 눌러야 진행된다 (결과 화면이 너무 빨리 지나가는 것 방지).
 */
export function NeonResultScreen({
  score,
  passThreshold,
  passMessage,
  failMessage,
  subtitle,
  onRetry,
  onContinue,
  continueLabel = '다음 단계로',
}: NeonResultScreenProps) {
  const passed = score >= passThreshold;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 min-h-[60dvh] flex items-center justify-center"
      style={{ background: VOCA_COLORS.sky }}
    >
      <VocaBrandStyle />
      <VocaHeroLetters />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 text-center space-y-4"
      >
        <p className="voca-display text-6xl tabular-nums" style={{ color: passed ? VOCA_COLORS.green : VOCA_COLORS.blue, fontWeight: 700 }}>
          {score}<span className="text-4xl">%</span>
        </p>
        {subtitle && (
          <p className="text-lg" style={{ color: VOCA_COLORS.gray }}>{subtitle}</p>
        )}
        <p className="voca-display text-lg" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
          {passed ? passMessage : failMessage}
        </p>
        {passed && onContinue ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              onClick={onContinue}
              className="voca-cta voca-display rounded-full px-10 py-3.5 text-base active:scale-[0.98]"
              style={{ fontWeight: 700 }}
            >
              {continueLabel} →
            </button>
            {onRetry && (
              <button onClick={onRetry} className="text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline">
                다시 풀기
              </button>
            )}
          </div>
        ) : onRetry && (
          passed ? (
            <button
              onClick={onRetry}
              className="mt-4 rounded-full bg-white px-6 py-2.5 font-medium text-gray-600 shadow-sm transition-all hover:shadow"
            >
              다시 풀기
            </button>
          ) : (
            <button
              onClick={onRetry}
              className="voca-cta voca-display mt-4 rounded-full px-8 py-3 active:scale-[0.98]"
              style={{ fontWeight: 700 }}
            >
              새 문제로 다시 풀기
            </button>
          )
        )}
      </motion.div>
    </div>
  );
}
