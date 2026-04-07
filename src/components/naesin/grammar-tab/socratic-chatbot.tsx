'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, ChevronDown, ChevronRight, Send, Loader2, RotateCcw } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const cancelInflight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStarting(false);
    setLoading(false);
  }, []);

  async function handleStart() {
    cancelInflight();
    const controller = new AbortController();
    abortRef.current = controller;

    setStarting(true);
    try {
      const data = await fetchWithToast<NaesinGrammarChatSession>('/api/naesin/grammar/chat/start', {
        body: { lessonId },
        errorMessage: '대화 시작에 실패했습니다.',
        fetchOptions: { signal: controller.signal },
      });
      if (controller.signal.aborted) return;
      setSession(data);
      setExpanded(true);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      // error already toasted by fetchWithToast
    } finally {
      if (!controller.signal.aborted) setStarting(false);
    }
  }

  async function handleRestart() {
    setSession(null);
    setInputValue('');
    await handleStart();
  }

  async function handleSend() {
    if (!session || !inputValue.trim() || loading) return;

    cancelInflight();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const updated = await fetchWithToast<NaesinGrammarChatSession>('/api/naesin/grammar/chat/reply', {
        body: { sessionId: session.id, message: inputValue.trim() },
        errorMessage: '응답 생성에 실패했습니다.',
        fetchOptions: { signal: controller.signal },
      });
      if (controller.signal.aborted) return;
      setSession(updated);
      setInputValue('');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      // error already toasted by fetchWithToast
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCollapse() {
    cancelInflight();
    setSession(null);
    setInputValue('');
    setExpanded(false);
  }

  const messages = (session?.messages || []) as NaesinGrammarChatMessage[];

  return (
    <Card className="mt-4">
      <CardHeader
        className="py-3 px-4 cursor-pointer"
        onClick={() => {
          if (expanded) {
            handleCollapse();
          } else {
            setExpanded(true);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Bot className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">AI 문법 튜터</CardTitle>
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
              {starting ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    채팅을 준비 중입니다. 잠시만 기다려 주세요!
                  </div>
                </div>
              ) : (
                <Button onClick={handleStart} size="sm">
                  <Bot className="h-4 w-4 mr-1.5" />대화 시작
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div
                ref={scrollRef}
                className="overflow-y-auto space-y-3 pr-1"
                style={{ maxHeight: 'min(50vh, 360px)' }}
              >
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

              <div className="pt-3 border-t mt-3">
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
