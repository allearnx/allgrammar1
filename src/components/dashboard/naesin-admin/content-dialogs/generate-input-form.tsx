'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

interface GenerateInputFormProps {
  title: string;
  setTitle: (v: string) => void;
  grammarTopic: string;
  setGrammarTopic: (v: string) => void;
  focusPoints: string;
  setFocusPoints: (v: string) => void;
  mcqCount: number;
  setMcqCount: (v: number) => void;
  selectAllCount: number;
  setSelectAllCount: (v: number) => void;
  subjectiveCount: number;
  setSubjectiveCount: (v: number) => void;
  trapPercent: string;
  setTrapPercent: (v: string) => void;
  grade?: string;
  onGenerate: () => void;
}

export function GenerateInputForm({
  title,
  setTitle,
  grammarTopic,
  setGrammarTopic,
  focusPoints,
  setFocusPoints,
  mcqCount,
  setMcqCount,
  selectAllCount,
  setSelectAllCount,
  subjectiveCount,
  setSubjectiveCount,
  trapPercent,
  setTrapPercent,
  grade,
  onGenerate,
}: GenerateInputFormProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        문법 주제와 출제 조건을 입력하면 AI가 객관식/모두고르시오/서술형 문제를 자동 생성합니다.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="ai-gen-title">시트 제목</Label>
          <Input
            id="ai-gen-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="1과 AI 생성 문제"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="ai-gen-topic">문법 주제</Label>
          <Input
            id="ai-gen-topic"
            value={grammarTopic}
            onChange={(e) => setGrammarTopic(e.target.value)}
            placeholder="to부정사의 명사적/형용사적/부사적 용법"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="ai-gen-focus">출제 포인트 (선택)</Label>
          <Textarea
            id="ai-gen-focus"
            value={focusPoints}
            onChange={(e) => setFocusPoints(e.target.value)}
            placeholder="전치사 유무 (write with, sit on, drink Ø)&#10;decide/want + to부정사 vs. enjoy/mind + 동명사"
            rows={3}
          />
        </div>

        <div>
          <Label>학년</Label>
          <Badge variant="secondary" className="ml-2">{grade || '2'}학년</Badge>
        </div>

        <div>
          <Label htmlFor="ai-gen-trap">함정 비율</Label>
          <Select value={trapPercent} onValueChange={setTrapPercent}>
            <SelectTrigger id="ai-gen-trap" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20%</SelectItem>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="30">30%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ai-gen-mcq">일반 객관식</Label>
          <Input
            id="ai-gen-mcq"
            type="number"
            min={0}
            max={50}
            value={mcqCount}
            onChange={(e) => setMcqCount(Number(e.target.value))}
            className="h-8"
          />
        </div>

        <div>
          <Label htmlFor="ai-gen-select-all">모두 고르시오</Label>
          <Input
            id="ai-gen-select-all"
            type="number"
            min={0}
            max={10}
            value={selectAllCount}
            onChange={(e) => setSelectAllCount(Number(e.target.value))}
            className="h-8"
          />
        </div>

        <div>
          <Label htmlFor="ai-gen-sub">서술형</Label>
          <Input
            id="ai-gen-sub"
            type="number"
            min={0}
            max={10}
            value={subjectiveCount}
            onChange={(e) => setSubjectiveCount(Number(e.target.value))}
            className="h-8"
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">생성 분배 (총 {mcqCount + selectAllCount + subjectiveCount}문제)</p>
        <p>일반 객관식 {mcqCount}개 / 모두고르시오 {selectAllCount}개 / 서술형 {subjectiveCount}개</p>
        <p>함정 비율 {trapPercent}% (객관식에서 약 {Math.max(1, Math.round(mcqCount * parseInt(trapPercent) / 100))}개)</p>
      </div>

      <Button
        className="w-full"
        onClick={onGenerate}
        disabled={!title.trim() || !grammarTopic.trim() || (mcqCount + selectAllCount + subjectiveCount) === 0}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        AI 문제 생성 시작
      </Button>
    </div>
  );
}
