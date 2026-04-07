'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { LearningOrderGuide } from './learning-order-guide';

const STORAGE_KEY = 'naesin-learning-order-guide-seen';

export function LearningOrderModal() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(STORAGE_KEY);
  });

  function handleClose() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            올인내신 학습 순서 안내
          </DialogTitle>
          <DialogDescription className="text-center">
            아래 순서대로 학습하면 가장 효과적이에요!
          </DialogDescription>
        </DialogHeader>

        <LearningOrderGuide mode="dialog" />

        <Button onClick={handleClose} className="w-full mt-1">
          확인했어요
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
