/**
 * 학생 수별 상세 요금표 (10~180명, 5명 단위 35구간) — 클래스카드식.
 * 요금 공식: 27,900원 시작 + 5명당 7,000원 (전 구간 클래스카드 −100원, 2026-07-20 확정).
 * /pricing(공개)과 /admin/billing(학원장 결제 관리) 공용.
 */
export function SeatLadderTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white">
      <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr className="border-b border-violet-100 bg-violet-50/50">
            <th className="px-5 py-3 text-left font-semibold text-gray-700" scope="col">학생 수</th>
            <th className="px-5 py-3 text-right font-semibold text-gray-700" scope="col">월 요금</th>
            <th className="px-5 py-3 text-right font-semibold text-gray-400" scope="col">1인당</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: 35 }, (_, i) => {
            const seats = 10 + i * 5;
            const price = 27900 + i * 7000;
            const highlight = seats === 50 || seats === 100;
            return (
              <tr key={seats} className={highlight ? 'bg-violet-50/40' : undefined}>
                <td className="px-5 py-2.5 font-medium text-gray-800">{seats}명</td>
                <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{price.toLocaleString()}원</td>
                <td className="px-5 py-2.5 text-right text-gray-400">{Math.round(price / seats).toLocaleString()}원</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
