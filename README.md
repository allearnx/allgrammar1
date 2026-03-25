# 올라영 (AllRounder English) - AI Learning Engine

중학생 대상 영어 학습 플랫폼. AI 기반 내신 대비 + 단어 학습 시스템.

**Production:** https://www.allrounderenglish.co.kr

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| AI | Claude API (Anthropic) - Haiku 4.5 (student), Sonnet 4.6 (admin content) |
| Video | YouTube (Private/Unlisted) embed + Player API |
| Deploy | Vercel |
| Notifications | Telegram Bot API |
| Payments | Toss Payments (토스페이먼츠) |

## Features

### 1. 레벨 기반 문법 학습 (Phase 1)

레벨 선택 → 영상 시청 → 암기(플래시카드/퀴즈/스펠링) → 교과서 문제(빈칸/순서/영작)

### 2. 올인내신 (Naesin) - 내신 대비

교과서 선택 → 단원 선택 → 5단계 순차 학습:

1. **어휘 (vocab)** - 플래시카드 + 퀴즈 + 스펠링
2. **지문 (passage)** - 지문 읽기 + 빈칸 + 영작 (AI 채점)
3. **문법 (grammar)** - AI 소크라틱 챗봇 (선택사항, 스킵 가능)
4. **문제풀이 (problem)** - 객관식 자동채점 + 서술형 AI 채점
5. **라스트리뷰 (lastReview)** - 오답 복습 + AI 유사문제 + 보충자료

- 객관식: 룰 기반 즉시 채점 (AI 비용 없음)
- 서술형/영작: Claude Haiku 4.5 채점
- 콘텐츠 생성: PDF 업로드 → Claude Sonnet 4.6이 어휘/지문/문법/문제 자동 추출

### 3. 올킬보카 (AllKill Voca) - 단어 학습

Day별 단어 학습 (플래시카드/퀴즈/스펠링). 2회독 시스템:
- **1회독 (R1)**: 무료 가입 시 자동 제공
- **2회독 (R2)**: 결제 후 해금 (`round2_unlocked`)

### 4. 공개 홍보 페이지

`(public)` route group: 랜딩, 수업 소개, 선생님, 후기, FAQ, 상담 신청, 올킬보카 결제 페이지

### 5. B2B 학원 시스템

- 학원 가입 시 초대코드 자동 생성 + 무료 플랜 (5명, 서비스 1개 택)
- 학생/선생님은 초대코드로 학원 합류
- 좌석 관리, 서비스 배정, 진도 모니터링
- 온보딩 위자드 (학원정보 → 초대코드 → 서비스안내 → 완료)

## Pricing (B2B Academy)

| Plan | Students | Monthly | Services |
|---|---|---|---|
| Free | 5 | 0 | 1 service (naesin or voca) |
| Pro 8 | 8 | 28,000 KRW | naesin + voca |
| Pro 40 | 40 | 84,000 KRW | naesin + voca |
| Pro 80 | 80 | 140,000 KRW | naesin + voca |
| Pro 150 | 150 | 210,000 KRW | naesin + voca |

Free tier limits: vocab + passage stages only, no analytics charts/rankings, no reports, no bulk operations.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, signup
│   ├── (dashboard)/     # authenticated pages
│   │   ├── admin/       # academy admin dashboard
│   │   ├── boss/        # super admin (platform owner)
│   │   ├── student/     # student learning pages
│   │   ├── teacher/     # teacher dashboard
│   │   └── [role]/      # shared admin views (reports, etc.)
│   ├── (public)/        # public marketing pages
│   └── api/             # API routes
├── components/
│   ├── auth/            # signup fields, invite code
│   ├── billing/         # subscription, plan comparison
│   ├── naesin/          # naesin learning components
│   ├── onboarding/      # academy onboarding wizard
│   ├── public/          # header, footer, landing sections
│   ├── ui/              # ShadCN UI primitives
│   └── voca/            # voca learning components
├── lib/
│   ├── ai/              # Claude API integration
│   ├── api/             # API handler, schemas (Zod)
│   ├── auth/            # auth helpers, redirect
│   ├── billing/         # feature-gate, plan context
│   ├── payments/        # Toss Payments integration
│   ├── reports/         # student report builder
│   ├── supabase/        # client, server, admin, middleware
│   ├── logger.ts        # structured logger
│   └── telegram.ts      # Telegram notifications
└── types/               # TypeScript types
```

## Auth & Roles

| Role | Description | Dashboard |
|---|---|---|
| `student` | Learner | `/student` |
| `teacher` | Teacher (assigned by academy) | `/teacher` |
| `admin` | Academy owner | `/admin` |
| `boss` | Platform super admin | `/boss` |

- Supabase Auth (JWT) with RLS policies
- Middleware enforces role-based route access
- DB trigger `handle_new_user()` auto-creates user record + academy on signup

## Key Database Tables

`users`, `academies`, `subscriptions`, `subscription_plans`, `service_assignments`, `courses`, `teacher_profiles`, `orders`, `consultations`, `parent_share_tokens`

Naesin: `textbooks`, `textbook_units`, `unit_vocabularies`, `passages`, `problems`, `grammar_chat_sessions`

Voca: `voca_days`, `voca_words`, `voca_progress`

Migrations: `supabase/migrations/001_*.sql` ~ `038_*.sql`

## Environment Variables

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

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # vitest (382 tests)
npm run build      # production build
```

## Database Migrations

Migrations are in `supabase/migrations/`. Apply via Supabase SQL Editor.

Note: Korean comments in SQL may cause errors in Supabase SQL Editor. Use English comments only.
