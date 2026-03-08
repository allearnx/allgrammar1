'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NaesinGrammarChatMessage } from '@/types/database';

interface ChatMessageBubbleProps {
  message: NaesinGrammarChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isAi = message.role === 'ai';

  return (
    <div className={cn('flex gap-2', isAi ? 'justify-start' : 'justify-end')}>
      {isAi && (
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          'rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap',
          isAi
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.content}
        {message.feedback && !message.feedback.isCorrect && message.feedback.correctedPoint && (
          <p className="mt-1.5 text-xs opacity-80 border-t border-current/20 pt-1.5">
            {message.feedback.correctedPoint}
          </p>
        )}
      </div>
      {!isAi && (
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}
