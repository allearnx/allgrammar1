export default function TermsPage() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-8">이용약관</h1>

        <div className="prose prose-lg max-w-none text-[#424245] space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제1조 (목적)</h2>
            <p className="leading-relaxed">
              이 약관은 올라운더영어(이하 &quot;회사&quot;)가 제공하는 온라인 영어 교육 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차,
              회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제2조 (정의)</h2>
            <p className="leading-relaxed">
              ① &quot;서비스&quot;란 회사가 제공하는 온라인 영어 교육 관련 제반 서비스를 의미합니다.<br />
              ② &quot;회원&quot;이란 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.<br />
              ③ &quot;학부모&quot;란 수강생의 법정대리인으로서 서비스 이용계약을 체결하는 자를 의미합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제3조 (약관의 효력 및 변경)</h2>
            <p className="leading-relaxed">
              ① 이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.<br />
              ② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.<br />
              ③ 변경된 약관은 웹사이트에 공지함으로써 효력을 발생합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제4조 (서비스의 제공)</h2>
            <p className="leading-relaxed">
              회사는 다음과 같은 서비스를 제공합니다.<br />
              ① 실시간 온라인 영어 수업<br />
              ② 녹화 영상 제공<br />
              ③ 숙제 및 피드백 서비스<br />
              ④ 학습 관리 및 리포트 서비스<br />
              ⑤ 기타 회사가 정하는 서비스
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제5조 (이용계약의 체결)</h2>
            <p className="leading-relaxed">
              ① 이용계약은 회원이 되고자 하는 자가 약관의 내용에 동의한 후 상담 신청을 하고,
              회사가 이를 승낙함으로써 체결됩니다.<br />
              ② 회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 거부할 수 있습니다.<br />
              - 타인의 명의를 사용한 경우<br />
              - 허위의 정보를 기재한 경우<br />
              - 기타 회사가 정한 이용신청 요건을 충족하지 못한 경우
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제6조 (회원의 의무)</h2>
            <p className="leading-relaxed">
              ① 회원은 서비스 이용 시 관계 법령, 이 약관의 규정, 이용안내 등을 준수하여야 합니다.<br />
              ② 회원은 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 배포, 출판, 방송 등의
              방법으로 이용하거나 제3자에게 제공할 수 없습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제7조 (수업료 및 환불)</h2>
            <p className="leading-relaxed">
              ① 수업료는 회사가 정한 금액에 따릅니다.<br />
              ② 환불은 학원의 설립·운영 및 과외교습에 관한 법률에 따라 처리됩니다.<br />
              ③ 자세한 환불 규정은 별도 안내를 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">제8조 (면책조항)</h2>
            <p className="leading-relaxed">
              ① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는
              서비스 제공에 관한 책임이 면제됩니다.<br />
              ② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-4">부칙</h2>
            <p className="leading-relaxed">
              이 약관은 2024년 1월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
