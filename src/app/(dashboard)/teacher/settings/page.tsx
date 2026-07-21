import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { Settings } from 'lucide-react';
import { AcademySettingsClient } from '../../admin/settings/client';

// 선생님도 학원 설정(시험 강도 기본값 등)을 할 수 있게 — admin 화면과 동일 컴포넌트 재사용.
export default async function TeacherSettingsPage() {
  const user = await requireRole(['teacher', 'admin', 'boss']);
  const admin = createAdminClient();

  const { data: academy } = await admin
    .from('academies')
    .select('id, name, invite_code, contact_phone, contact_email, address, logo_url, max_students, naesin_required_rounds, voca_exam_pass_score_default, voca_exam_seconds_per_word_default, voca_exam_retry_wrong_default, onboarding_completed_at, created_at, updated_at')
    .eq('id', user.academy_id!)
    .single();

  const { count: currentStudents } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', user.academy_id!)
    .eq('role', 'student')
    .eq('is_active', true);

  return (
    <>
      <Topbar user={user} title="학원 설정" />
      <div className="p-4 md:p-6 space-y-5">
        <div className="relative overflow-hidden rounded-2xl p-6 text-white" style={{ background: '#4285F4' }}>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">학원 설정</h2>
              <p className="text-sm text-white/70">학원 정보와 시험 설정을 관리합니다</p>
            </div>
          </div>
        </div>

        <AcademySettingsClient academy={academy!} currentStudents={currentStudents || 0} canEditAcademyInfo={user.role !== 'teacher'} />
      </div>
    </>
  );
}
