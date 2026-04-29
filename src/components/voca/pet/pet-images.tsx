'use client';

import Image from 'next/image';
import type { PetStage, PetMood } from '@/lib/voca/pet-constants';

const IMAGE_MAP: Record<string, string> = {
  '0-happy': '/images/pet/egg.png',
  '0-normal': '/images/pet/egg.png',
  '0-hungry': '/images/pet/egg.png',
  '1-happy': '/images/pet/egg-cracked.png',
  '1-normal': '/images/pet/egg-cracked.png',
  '1-hungry': '/images/pet/egg-cracked.png',
  '2-happy': '/images/pet/chick-happy.png',
  '2-normal': '/images/pet/chick-normal.png',
  '2-hungry': '/images/pet/chick-hungry.png',
  '3-happy': '/images/pet/young-happy.png',
  '3-normal': '/images/pet/young-normal.png',
  '3-hungry': '/images/pet/young-hungry.png',
  '4-happy': '/images/pet/golden-happy.png',
  '4-normal': '/images/pet/golden-normal.png',
  '4-hungry': '/images/pet/golden-hungry.png',
};

interface PetImageProps {
  stage: PetStage;
  mood: PetMood;
  size?: number;
  className?: string;
}

export function PetImage({ stage, mood, size = 80, className }: PetImageProps) {
  const src = IMAGE_MAP[`${stage}-${mood}`] ?? '/images/pet/egg.png';

  return (
    <Image
      src={src}
      alt="내 병아리"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
