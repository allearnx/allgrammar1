/**
 * `.in()` id 목록이 길면 PostgREST 요청 URL이 한계를 넘어 쿼리가 통째로 죽는다
 * (2026-08-06 실측: id 300개 OK / 400개 실패 — 초등 800 추가로 전체 Day가 655개가
 * 되면서 보카 홈·대시보드의 진도 조회가 조용히 빈 배열이 된 사고).
 * id가 많을 수 있는 `.in()` 조회는 반드시 이 헬퍼로 청크 분할할 것.
 */
export async function selectInChunks<Row>(
  ids: readonly string[],
  run: (chunk: string[]) => PromiseLike<{ data: Row[] | null; error: unknown }>,
  chunkSize = 200,
): Promise<Row[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize) as string[]);
  const results = await Promise.all(chunks.map((c) => run(c)));
  return results.flatMap((r) => r.data ?? []);
}
