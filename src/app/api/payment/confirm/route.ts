import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { paymentConfirmSchema } from '@/lib/api/schemas';
import { confirmPayment, cancelPayment, TossPaymentError } from '@/lib/payments/toss';
import { createAdminClient } from '@/lib/supabase/admin';
import { invalidateStudentServices } from '@/lib/cache/invalidate';
import { computeExtendedExpiry } from '@/lib/billing/service-expiry';
import { logger } from '@/lib/logger';
import { sendTelegram } from '@/lib/telegram';

const CATEGORY_TO_SERVICE: Record<string, 'voca' | 'naesin'> = {
  voca: 'voca',
  school_exam: 'naesin',
};

// 올인내신(school_exam) 결제 학생은 올라영 소속으로 자동 편입 (2026-08-24 사장님 지시).
// 올라영 academy id — academies에서 naesin_enabled 최초 활성 학원 (name: 올라영).
const OLLAYOUNG_ACADEMY_ID = 'b429a2bc-62d1-41d9-8396-f029c21f53ae';

export const POST = createApiHandler(
  { schema: paymentConfirmSchema },
  async ({ user, body, supabase }) => {
    const { paymentKey, orderId, amount, orderName, courseId } = body;

    // ── 0. 멱등성 가드: 이미 승인된 주문의 재진입(뒤로가기·새로고침)은 그대로 성공 응답 ──
    // 없으면 재승인 시도 → orders UNIQUE(toss_order_id) 충돌 → "기록 실패" 오인 →
    // 정상 결제를 자동 취소하는 사고가 난다 (2026-07-19 실사고).
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('status, receipt_url, course_id')
      .eq('toss_order_id', orderId)
      .maybeSingle();
    if (existingOrder?.status === 'paid') {
      let serviceActivated: 'voca' | 'naesin' | null = null;
      const cid = existingOrder.course_id || courseId;
      if (cid) {
        const { data: course } = await supabase
          .from('courses').select('category').eq('id', cid).single();
        const service = course ? CATEGORY_TO_SERVICE[course.category] : null;
        if (service) {
          const { data: assign } = await supabase
            .from('service_assignments')
            .select('id').eq('student_id', user.id).eq('service', service).maybeSingle();
          if (assign) serviceActivated = service;
        }
      }
      return NextResponse.json({
        success: true,
        receiptUrl: existingOrder.receipt_url ?? null,
        serviceActivated,
      });
    }

    // ── 1. 토스 결제 승인 ──
    let result;
    try {
      result = await confirmPayment(paymentKey, orderId, amount);
    } catch (err) {
      await supabase.from('orders').insert({
        user_id: user.id,
        order_name: orderName,
        amount,
        status: 'failed',
        toss_order_id: orderId,
        toss_payment_key: paymentKey,
        course_id: courseId || null,
        failure_code: err instanceof TossPaymentError ? err.code : 'UNKNOWN',
        failure_message: err instanceof Error ? err.message : '결제 승인 실패',
      });

      if (err instanceof TossPaymentError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.statusCode },
        );
      }
      throw err;
    }

    // ── 1-1. 금액 위변조 방어 검증 ──
    if (result.totalAmount !== amount) {
      logger.error('payment.amount_mismatch', {
        orderId,
        clientAmount: amount,
        tossAmount: result.totalAmount,
        userId: user.id,
      });
      await cancelPayment(result.paymentKey, '결제 금액 불일치로 인한 자동 취소');
      await sendTelegram(
        `🚨 결제 금액 위변조 감지\n\n클라이언트: ${amount}원\n토스: ${result.totalAmount}원\n유저: ${user.email}\n주문: ${orderId}\n\n→ 자동 취소 완료`
      );
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    // ── 2. 주문 기록 저장 ──
    const { error: insertErr } = await supabase.from('orders').insert({
      user_id: user.id,
      order_name: orderName,
      amount: result.totalAmount,
      status: 'paid',
      toss_order_id: orderId,
      toss_payment_key: result.paymentKey,
      receipt_url: result.receipt?.url ?? null,
      course_id: courseId || null,
      paid_at: new Date().toISOString(),
    });

    if (insertErr) {
      // 중복 키(23505) = 이미 기록된 주문의 동시/재진입 요청 — 실패가 아니므로 절대 취소 금지
      if (insertErr.code === '23505') {
        logger.warn('payment.duplicate_confirm', { orderId, userId: user.id });
        return NextResponse.json({
          success: true,
          receiptUrl: result.receipt?.url ?? null,
          serviceActivated: null,
        });
      }

      logger.error('payment.insert_failed', {
        orderId,
        userId: user.id,
        error: insertErr.message,
      });

      // 주문 기록 실패 → 토스 결제 즉시 취소
      try {
        await cancelPayment(result.paymentKey, '주문 기록 저장 실패로 인한 자동 취소');
        logger.error('payment.auto_canceled', { orderId, paymentKey: result.paymentKey });
      } catch (cancelErr) {
        logger.error('payment.cancel_also_failed', {
          orderId,
          paymentKey: result.paymentKey,
          error: cancelErr instanceof Error ? cancelErr.message : String(cancelErr),
        });
      }

      await sendTelegram(
        `🚨 결제 긴급 알림\n\n주문 기록 저장 실패 → 토스 취소 시도\n주문: ${orderId}\n금액: ${result.totalAmount}원\n유저: ${user.email}\n에러: ${insertErr.message}`
      );

      return NextResponse.json(
        { error: '주문 처리 중 오류가 발생했습니다. 결제가 취소되었습니다.' },
        { status: 500 },
      );
    }

    // ── 3. 서비스 자동 활성화 (voca/school_exam 코스만) ──
    let serviceActivated: 'voca' | 'naesin' | null = null;
    let serviceExpiresAt: string | null = null;

    if (courseId) {
      const { data: course } = await supabase
        .from('courses')
        .select('category, duration_days')
        .eq('id', courseId)
        .single();

      const service = course ? CATEGORY_TO_SERVICE[course.category] : null;

      if (service) {
        // 결제 후 서비스 부여는 신뢰된 서버 작업 — admin client로 RLS 우회.
        // (user-scoped client는 학생 UPDATE 정책이 없어, 이미 무료로 가진 서비스를
        //  유료로 업그레이드하는 upsert의 ON CONFLICT DO UPDATE에서 RLS에 막힘.)
        const admin = createAdminClient();

        // 만료일: 코스 기간(duration_days)만큼 부여. 만료 전 재결제면 남은 기간 위에 연장
        const { data: existingAssign } = await admin
          .from('service_assignments')
          .select('expires_at')
          .eq('student_id', user.id)
          .eq('service', service)
          .maybeSingle();
        serviceExpiresAt = computeExtendedExpiry(existingAssign?.expires_at, course?.duration_days);

        // round2_unlocked는 심지 않는다 — 결제 학생(tier=paid)은 플랜 게이트(voca:round2)로
        // 이미 2회독이 열려 있고, 이 플래그는 7/20(1610946)부터 "1회독 면제"(round2Forced)
        // 의미라 켜면 홈 완료 표시가 2회독 기준이 되어 R1 완료가 안 보인다 (김민유 신고, 2026-08-06).
        const { error: assignErr } = await admin
          .from('service_assignments')
          .upsert(
            {
              student_id: user.id,
              service,
              assigned_by: user.id,
              source: 'payment',
              expires_at: serviceExpiresAt,
            },
            { onConflict: 'student_id,service' },
          );

        if (assignErr) {
          logger.error('payment.service_activation_failed', {
            orderId,
            userId: user.id,
            service,
            error: assignErr.message,
          });

          // 돈은 받았으니 취소 안 함 — 수동 대응
          await sendTelegram(
            `🚨 서비스 활성화 실패\n\n결제는 성공했으나 서비스 배정 실패\n주문: ${orderId}\n서비스: ${service}\n유저: ${user.email}\n에러: ${assignErr.message}\n\n👉 수동으로 서비스 배정 필요`
          );
        } else {
          serviceActivated = service;

          // ── 3-1. 올인내신 결제 학생 → 올라영 소속 자동 편입 ──
          // 무소속(독립) 학생만 자동 편입. 타 학원 소속이면 조용히 빼오지 않고
          // 텔레그램으로 알려 수동 판단 (타 학원 명단에서 사라지는 부작용 방지).
          if (service === 'naesin') {
            const { data: profile } = await admin
              .from('users')
              .select('academy_id')
              .eq('id', user.id)
              .single();

            if (!profile?.academy_id) {
              const { error: joinErr } = await admin
                .from('users')
                .update({ academy_id: OLLAYOUNG_ACADEMY_ID })
                .eq('id', user.id);
              if (joinErr) {
                logger.error('payment.ollayoung_join_failed', {
                  orderId, userId: user.id, error: joinErr.message,
                });
                await sendTelegram(
                  `🚨 올라영 자동 편입 실패\n\n올인내신 결제는 성공했으나 학원 편입 실패\n유저: ${user.email}\n에러: ${joinErr.message}\n\n👉 수동으로 올라영 소속 처리 필요`
                );
              }
            } else if (profile.academy_id !== OLLAYOUNG_ACADEMY_ID) {
              await sendTelegram(
                `⚠️ 올인내신 결제 — 타 학원 소속 학생\n\n유저: ${user.email}\n현재 소속 학원 id: ${profile.academy_id}\n\n올라영으로 이관할지 수동 판단 필요 (자동 이관 안 함)`
              );
            }
          }

          // 결제 즉시 접근 반영 — 캐시된 plan context/서비스 목록 갱신
          invalidateStudentServices(user.id);
        }
      }
    }

    // ── 4. 결제 성공 텔레그램 알림 ──
    const serviceName = serviceActivated === 'voca' ? '올킬보카' : serviceActivated === 'naesin' ? '올인내신' : null;
    await sendTelegram(
      [
        '💰 결제 완료',
        '',
        `👤 ${user.email}`,
        `📦 ${orderName}`,
        `💳 ${result.totalAmount.toLocaleString()}원`,
        `🔖 주문번호: ${orderId}`,
        serviceName ? `✅ ${serviceName} 자동 활성화 완료 (만료: ${serviceExpiresAt ? serviceExpiresAt.slice(0, 10) : '무기한'})` : '',
      ].filter(Boolean).join('\n'),
    );

    return NextResponse.json({
      success: true,
      receiptUrl: result.receipt?.url ?? null,
      serviceActivated,
    });
  },
);
