import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-[#f5f5f7] pt-6 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 구분선 */}
        <div className="border-t border-gray-300 mb-8"></div>

        {/* 메인 콘텐츠 */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* CONTACT US */}
          <div className="flex-shrink-0">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-4">CONTACT US</h3>
            <p className="text-2xl font-bold text-[#1d1d1f] mb-2">카카오톡 [올라영]</p>
            <p className="text-[#424245] text-sm mb-1">수업관련 문의 평일 AM 10:00 - PM 5:00</p>
            <p className="text-[#424245] text-sm mb-4">주말/공휴일 휴무</p>
            <div className="flex gap-2">
              <Link href="/faq" className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium rounded hover:bg-[#424245] transition-colors">FAQ</Link>
            </div>
          </div>

          {/* BUSINESS INFORMATION */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-4">BUSINESS INFORMATION</h3>
            <div className="flex flex-col md:flex-row gap-8 text-[#424245] text-sm leading-relaxed">
              <div className="space-y-1">
                <p>상호 : 올라운더영어</p>
                <p>주소 : 인천광역시 연수구 해돋이로 107, 디동 209호</p>
                <p>전화번호 : 010-4904-1247</p>
                <p>개인정보관리책임자 : 안홍미</p>
                <p>e-mail : michaela@allrounderenglish.com</p>
              </div>
              <div className="space-y-1">
                <p>사업자등록번호 : 188-88-03474</p>
                <p>통신판매업신고번호 : 제 2024-인천연수구-3892호</p>
                <p>올라운더영어 대표 : 안홍미</p>
              </div>
            </div>
          </div>
        </div>

        {/* 저작권 및 약관 링크 */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-[#86868b] text-sm">
          <p>Copyright &copy; allrounderenglish Inc. All Rights Reserved.</p>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <Link href="/terms" className="hover:underline hover:text-[#424245]">이용약관</Link>
            <span>|</span>
            <Link href="/privacy" className="font-bold hover:underline hover:text-[#424245]">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
