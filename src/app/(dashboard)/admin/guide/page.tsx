import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { BookOpen } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    question: '학생은 어떻게 등록하나요?',
    answer:
      '학원의 초대코드를 학생에게 전달해 주세요. 학생이 회원가입 시 초대코드를 입력하면 자동으로 학원에 연결됩니다. 이미 가입한 학생은 "학원 연결" 메뉴에서 초대코드를 입력하면 됩니다.',
  },
  {
    question: '선생님은 어떻게 등록하나요?',
    answer:
      '학생과 동일한 초대코드를 전달해 주세요. 회원가입 시 역할을 "선생님"으로 선택하면 선생님으로 등록됩니다.',
  },
  {
    question: '초대코드는 어디서 확인하나요?',
    answer:
      '대시보드 상단 또는 "학원 설정" 페이지에서 초대코드를 확인하고 복사할 수 있습니다.',
  },
  {
    question: '학생에게 서비스를 어떻게 배정하나요?',
    answer:
      '"학생 관리" 메뉴에서 학생을 선택한 뒤 올인내신, 올킬보카 등 원하는 서비스를 배정할 수 있습니다.',
  },
  {
    question: '학생 진도는 어디서 확인하나요?',
    answer:
      '대시보드에서 전체 현황을 확인하거나, "학원 통계" 메뉴에서 학생별 상세 진도를 확인할 수 있습니다.',
  },
  {
    question: '요금제는 어떻게 변경하나요?',
    answer:
      '"결제 관리" 메뉴에서 현재 요금제를 확인하고 업그레이드할 수 있습니다.',
  },
  {
    question: '학생이 최대 인원을 초과하면?',
    answer:
      '현재 요금제의 최대 인원을 초과하면 새 학생을 등록할 수 없습니다. "결제 관리"에서 더 큰 요금제로 업그레이드해 주세요.',
  },
];

export default async function AdminGuidePage() {
  const user = await requireRole(['admin', 'boss']);

  return (
    <>
      <Topbar user={user} title="사용 방법" />
      <div className="p-4 md:p-6 space-y-5">
        {/* ── 헤더 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: '#60A5FA' }}
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">사용 방법</h2>
              <p className="text-sm text-white/70">자주 묻는 질문과 사용 가이드입니다</p>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="rounded-xl border bg-card p-4 md:p-6">
          <Accordion type="multiple" className="w-full">
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
}
