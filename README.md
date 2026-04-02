# 올라영 (AllRounder English) - AI Learning Engine

중학생 대상 영어 학습 플랫폼. AI 기반 내신 대비 + 단어 학습 + B2B 학원 관리 시스템.

**Production:** https://www.allrounderenglish.co.kr

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| AI | Claude API (Anthropic) - Haiku 4.5 (student), Sonnet 4.6 (admin content) |
| Video | YouTube (Private/Unlisted) embed + Player API |
| Deploy | Vercel (main push = auto deploy) |
| Payments | Toss Payments (토스페이먼츠) |
| Notifications | Telegram Bot API |

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm run test         # vitest (432 tests)
npm run build        # production build
npx tsc --noEmit     # type check only
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude AI
ANTHROPIC_API_KEY=

# Toss Payments
TOSS_SECRET_KEY=
NEXT_PUBLIC_TOSS_CLIENT_KEY=

# Telegram Notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## Features Overview

### 1. 올인내신 (Naesin) - 내신 대비

교과서 선택 → 단원 선택 → **8단계 순차 학습**:

| 단계 | Stage Key | 설명 | 해금 조건 |
|---|---|---|---|
| 1 | `vocab` | 어휘 암기 (플래시카드/퀴즈/스펠링) | 항상 열림 |
| 2 | `passage` | 교과서 지문 (빈칸/순서/영작 AI채점) | vocab 80%+ |
| 3 | `dialogue` | 대화문 암기 (한글→영작) | passage 80%+ |
| 4 | `textbookVideo` | 본문 설명 영상 | dialogue 완료 |
| 5 | `grammar` | 문법 설명 + AI 소크라틱 챗봇 | textbookVideo 완료 |
| 6 | `problem` | 문제풀이 (객관식+서술형 AI채점) | grammar 완료 |
| 7 | `mockExam` | 예상문제 | problem 완료 |
| 8 | `lastReview` | 직전보강 (오답+유사문제+보충자료) | 시험 D-3 자동해금 |

- 2회독(Round 2) 지원: boss가 잠금 해제 토글
- 무료 스테이지: vocab, passage, dialogue만

### 2. 올킬보카 (AllKill Voca) - 단어 학습

Day별 단어 학습 (플래시카드/퀴즈/스펠링/종합문제). 2회독 시스템.

### 3. 레벨 기반 문법 학습 (Phase 1)

레벨 선택 → 영상 시청 → 암기(플래시카드/퀴즈/스펠링) → 교과서 문제(빈칸/순서/영작)

### 4. 공개 홍보 페이지

`(public)` route group: 랜딩, 수업 소개, 선생님, 후기, FAQ, 상담 신청, 올킬보카/올인내신 결제

### 5. B2B 학원 시스템

- 학원 가입 시 초대코드 자동 생성 + 무료 플랜 (5명, 서비스 1개 택)
- 학생/선생님은 초대코드로 학원 합류
- 좌석 관리, 서비스 배정, 교과서 배정, 진도 모니터링
- Toss Payments 카드결제로 유료 플랜 업그레이드

---

## Auth & Roles

| Role | Description | Dashboard | 비고 |
|---|---|---|---|
| `student` | 학습자 | `/student` | |
| `teacher` | 선생님 | `/teacher` | 콘텐츠 관리, 학생 관리 |
| `admin` | 원장 | `/admin` | teacher 권한 + 사용자/결제 관리 |
| `boss` | 최고관리자 | `/boss` | 전체 학원/플랜/콘텐츠 관리 |

- Supabase Auth (JWT) + RLS 정책
- Middleware: `src/middleware.ts` → 역할 기반 라우트 접근 제어
- DB 트리거 `handle_new_user()`: 가입 시 user 레코드 + academy 자동 생성

---

## Pricing (B2B Academy)

| Plan | Students | Monthly | Services |
|---|---|---|---|
| Free | 5 | 0 | 1 service (naesin or voca) |
| Pro 8 | 8 | 28,000 KRW | naesin + voca |
| Pro 40 | 40 | 84,000 KRW | naesin + voca |
| Pro 80 | 80 | 140,000 KRW | naesin + voca |
| Pro 150 | 150 | 210,000 KRW | naesin + voca |

Free tier: vocab + passage + dialogue만 사용 가능. 분석 차트/랭킹/리포트/일괄 작업 제한.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # login, signup
│   ├── (dashboard)/         # authenticated pages
│   │   ├── admin/           # academy admin dashboard
│   │   ├── boss/            # super admin (platform owner)
│   │   ├── student/         # student learning pages
│   │   │   ├── naesin/      # 올인내신 (8-stage learning)
│   │   │   ├── voca/        # 올킬보카
│   │   │   └── levels/      # Phase 1 level-based grammar
│   │   ├── teacher/         # teacher dashboard
│   │   └── [role]/          # shared views (reports, etc.)
│   ├── (public)/            # public marketing pages
│   └── api/                 # API routes (~70 endpoints)
│
├── components/
│   ├── auth/                # signup fields, invite code
│   ├── billing/             # subscription, plan comparison
│   ├── dashboard/           # admin dashboards, naesin-admin
│   │   └── naesin-admin/    # unit content CRUD management
│   ├── naesin/              # student naesin learning components
│   │   ├── vocab-tab/       # flashcard, quiz, spelling
│   │   ├── passage-tab/     # fill-blanks, ordering, translation
│   │   ├── grammar-tab/     # video player, socratic chatbot
│   │   ├── problem-tab/     # interactive + image answer
│   │   └── last-review-tab  # wrong answer review + similar problems
│   ├── onboarding/          # academy onboarding wizard
│   ├── public/              # header, footer, landing sections
│   ├── shared/              # confirm-dialog, vocab-dialogs
│   ├── ui/                  # ShadCN UI primitives
│   └── voca/                # voca learning components
│
├── hooks/                   # Custom React hooks (21 files)
│   ├── use-list-crud.ts     # generic list CRUD with optimistic updates
│   ├── use-inline-edit.ts   # inline editing pattern
│   ├── use-confirm-delete.ts # delete confirmation dialog
│   ├── use-learning-session.ts # heartbeat timer
│   └── ...
│
├── lib/
│   ├── ai/                  # Claude API integration
│   ├── api/
│   │   ├── handler.ts       # createApiHandler (Zod + RBAC + rate limit)
│   │   ├── schemas/         # Zod validation schemas (domain-split)
│   │   │   ├── _shared.ts   # shared limits (ID, SHORT, MEDIUM, LONG)
│   │   │   ├── naesin.ts    # naesin schemas
│   │   │   ├── voca.ts      # voca schemas
│   │   │   ├── billing.ts   # payment/subscription schemas
│   │   │   ├── admin.ts     # academy/user schemas
│   │   │   ├── public.ts    # public page CRUD schemas
│   │   │   ├── auth.ts      # auth schemas
│   │   │   └── index.ts     # re-exports all
│   │   ├── rate-limit.ts    # Upstash Redis rate limiting
│   │   └── errors.ts        # API error responses
│   ├── auth/                # auth helpers, redirect
│   ├── billing/             # feature-gate, plan context
│   ├── naesin/              # stage-unlock, helpers, make-delete-handler
│   ├── payments/            # Toss Payments integration
│   ├── reports/             # student report builder
│   ├── supabase/            # client, server, admin, middleware
│   ├── fetch-with-toast.ts  # unified fetch wrapper
│   ├── logger.ts            # structured logger (replaces console.log)
│   └── telegram.ts          # Telegram notifications
│
├── types/
│   ├── database.ts          # Supabase types + custom types
│   ├── naesin.ts            # Naesin-specific interfaces
│   ├── grammar.ts           # Phase 1 grammar types
│   └── ...
│
└── __tests__/               # 432 tests (vitest)
```

---

## Coding Conventions

### API Routes

모든 API는 `createApiHandler()` 래퍼로 생성:

```typescript
export const POST = createApiHandler({
  schema: mySchema,           // Zod validation
  roles: ['teacher', 'admin', 'boss'],  // RBAC
  rateLimit: { max: 30 },    // per hour
  handler: async ({ body, supabase, userId }) => {
    // ...
    return NextResponse.json(result);
  },
});
```

### Client Fetch

클라이언트에서 API 호출 시 `fetchWithToast` 사용 (raw fetch 금지):

```typescript
const data = await fetchWithToast<ResponseType>('/api/endpoint', {
  body: { ... },
  successMessage: '성공',
  errorMessage: '실패',
  logContext: 'feature.action',
});
```

### Page Pattern

Server Component (data fetch) → Client Component (UI):

```
page.tsx    → DB query + auth check → props로 전달
client.tsx  → 'use client' + interactive UI
```

### Structured Logger

`console.log` 사용 금지. 구조화 로거 사용:

```typescript
import { logger } from '@/lib/logger';
logger.info('feature.action', { key: value });
logger.error('feature.error', { error: err.message });
```

---

## AI Usage

| 용도 | 모델 | 비용 전략 |
|---|---|---|
| 소크라틱 챗봇 | Haiku 4.5 | 질문 자동 생성 (최초 1회, 이후 재사용) |
| 서술형 채점 | Haiku 4.5 | 서술형만 AI, 객관식은 룰 기반 |
| 영작 채점 | Haiku 4.5 | LCS 알고리즘 우선 → Claude 폴백 |
| PDF 콘텐츠 추출 | Sonnet 4.6 | 관리자 전용 (빈도 낮음) |
| 유사문제 생성 | Haiku 4.5 | 오답 기반 1~3개 생성 |

---

## Database

- **52 migrations**: `supabase/migrations/001_*.sql` ~ `052_*.sql`
- **RLS**: 모든 테이블에 Row Level Security 적용 (학원별 격리)
- **DB 트리거**: `SECURITY DEFINER` + `SET search_path = public` 필수
- SQL 마이그레이션 적용: Supabase SQL Editor 사용
- 주의: SQL 파일 내 한글 주석 → Supabase SQL Editor 에러 가능 (영문 권장)

### 주요 테이블

**Core**: `users`, `academies`, `subscriptions`, `subscription_plans`, `service_assignments`, `orders`

**Naesin**: `naesin_textbooks`, `naesin_units`, `naesin_vocabulary`, `naesin_passages`, `naesin_dialogues`, `naesin_grammar_lessons`, `naesin_grammar_chat_sessions`, `naesin_problem_sheets`, `naesin_problem_attempts`, `naesin_wrong_answers`, `naesin_similar_problems`, `naesin_student_progress`, `naesin_omr_sheets`, `naesin_textbook_videos`, `naesin_last_review_content`

**Voca**: `voca_books`, `voca_days`, `voca_vocabulary`, `voca_progress`, `voca_matching_submissions`

**Public**: `courses`, `teacher_profiles`, `reviews`, `faqs`, `consultations`

**학습 기록**: `learning_sessions`, `learning_daily_log`

---

## Security

- Supabase RLS로 학원 간 데이터 격리
- `requireAcademyScope()`: 타 학원 학생 접근 차단
- 결제 금액 위변조 검증 (Toss 승인 후 서버 검증, 불일치 시 자동취소 + 텔레그램 알림)
- billing_key, customer_key 등 민감 정보 클라이언트 노출 차단
- Rate limiting: Upstash Redis (API별 시간당 제한)

---

## Testing

```bash
npm run test              # vitest 전체 실행 (432 tests)
npx vitest run --watch    # watch mode
npx tsc --noEmit          # type check only
```

테스트 위치: `src/__tests__/` (41 파일, 432 테스트)

주요 테스트:
- API 스키마 검증 (`api-schemas.test.ts`)
- API 핸들러 동작 (`api-handler.test.ts`)
- LCS 채점 알고리즘 (`lcs-grader.test.ts`)
- 스테이지 해금 로직 (`stage-unlock.test.ts`)
- YouTube ID 추출 (`youtube.test.ts`)
- 벌크 업로드 파서 (`bulk-upload-parsers.test.ts`)

---

## Deployment

- **Vercel**: `main` branch push 시 자동 배포
- **Domain**: `allrounderenglish.co.kr`
- 빌드: `next build` → Vercel Edge/Serverless Functions
- 환경변수: Vercel Dashboard에서 관리
