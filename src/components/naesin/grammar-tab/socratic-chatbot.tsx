'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, ChevronDown, ChevronRight, Send, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessageBubble } from './chat-message-bubble';
import type { NaesinGrammarChatMessage, NaesinGrammarChatSession } from '@/types/database';

interface SocraticChatbotProps {
  lessonId: string;
  lessonTitle: string;
}

export function SocraticChatbot({ lessonId, lessonTitle }: SocraticChatbotProps) {
  const [expanded, setExpanded] = useState(false);
  const [session, setSession] = useState<NaesinGrammarChatSession | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [hasQuestions, setHasQuestions] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if this lesson has chat questions
  useEffect(() => {
    async function checkQuestions() {
      try {
        const res = await fetch(`/api/naesin/grammar/chat/questions?lessonId=${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setHasQuestions(Array.isArray(data) && data.length > 0);
        } else {
          setHasQuestions(false);
        }
      } catch (err) {
        console.error(err);
        setHasQuestions(false);
      }
    }
    checkQuestions();
  }, [lessonId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  if (hasQuestions === null || hasQuestions === false) {
    return null;
  }

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch('/api/naesin/grammar/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || '대화 시작에 실패했습니다.');
      }
      const data = await res.json();
      setSession(data);
      setExpanded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '대화 시작에 실패했습니다.');
    } finally {
      setStarting(false);
    }
  }

  async function handleRestart() {
    setSession(null);
    setInputValue('');
    await handleStart();
  }

  async function handleSend() {
    if (!session || !inputValue.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/naesin/grammar/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, message: inputValue.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || '응답 생성에 실패했습니다.');
      }
      const updated = await res.json();
      setSession(updated);
      setInputValue('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '응답 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages = (session?.messages || []) as NaesinGrammarChatMessage[];

  return (
    <Card className="mt-4">
      <CardHeader
        className="py-3 px-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Bot className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">AI 문법 튜터</CardTitle>
            <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0">필수</Badge>
          </div>
          {session && (
            <Badge variant="secondary" className="text-xs">
              {session.turn_count}/{session.max_turns}
            </Badge>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {!session ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                AI 튜터와 &quot;{lessonTitle}&quot; 문법을 대화로 연습해보세요!
              </p>
              <Button onClick={handleStart} disabled={starting} size="sm">
                {starting ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />시작 중...</>
                ) : (
                  <><Bot className="h-4 w-4 mr-1.5" />대화 시작</>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col" style={{ maxHeight: 'min(60vh, 480px)' }}>
              <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
                <div className="space-y-3 pr-2">
                  {messages.map((msg, i) => (
                    <ChatMessageBubble key={i} message={msg} />
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI가 생각하고 있어요...
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="shrink-0 pt-3 border-t mt-3">
                {session.is_complete ? (
                  <div className="flex justify-center">
                    <Button onClick={handleRestart} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      다시 시작
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="답변을 입력하세요..."
                      disabled={loading}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || loading}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
