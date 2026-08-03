/**
 * 올라영_교육부 초등필수영단어800.pdf (주제별 재배치본) 텍스트 추출본 파싱
 * → scripts/elementary-800-words.json (PDF 등장 순서 그대로, 감사용 보관)
 *
 * 사용: pdftotext -layout <PDF> ola.txt 후
 *   node scripts/parse-elementary-800.mjs <ola.txt 경로>
 *
 * PDF는 한 줄에 두 항목(좌→우) 배치라 줄 단위로 읽으며 □ 로 쪼개면 등장 순서가 유지된다.
 * (숫자 섹션이 one two / three four 순으로 확인됨 — 행 우선)
 *
 * 구간: 핵심 403 · 확장 201 · 심화 89 = 학습 대상 693. 기초 기능어 107은
 * PDF 스스로 "외우지 마세요"라 앱에서도 제외한다.
 */
import fs from 'fs';

const src = process.argv[2];
if (!src) { console.error('사용법: node scripts/parse-elementary-800.mjs <추출텍스트>'); process.exit(1); }
const txt = fs.readFileSync(src, 'utf8');

let section = null;
let bucket = null;
const rows = [];
for (const raw of txt.split('\n')) {
  const line = raw.replace(/ /g, ' '); // NBSP 정규화
  if (/심화\s*·\s*중등 맛보기/.test(line)) { section = '심화'; bucket = '심화'; continue; }
  if (/기초 기능어/.test(line)) { section = '기능어'; bucket = '기능어'; continue; }
  const topic = line.match(/^\s*([가-힣·()\s]+?)\s*핵심\s*(\d+)\s*·\s*확장\s*(\d+)\s*$/);
  if (topic) { section = topic[1].trim(); continue; }
  if (/● 꼭 외우기/.test(line)) { bucket = '핵심'; continue; }
  if (/➕ 더 알기/.test(line)) { bucket = '확장'; continue; }
  if (!line.includes('□')) continue; // 페이지 푸터·안내문 등
  for (const seg of line.split('□')) {
    const s = seg.trim();
    if (!s) continue;
    const m = s.match(/^([A-Za-z][A-Za-z()\-\/]*)\s+(.*)$/);
    if (!m) continue;
    // math(mathematics/maths) → math : 괄호 병기는 표제어에서 제거 (뜻은 원문 유지)
    const word = m[1].replace(/\(.*$/, '');
    rows.push({ word, meaning: m[2].trim(), section, bucket });
  }
}

const learn = rows.filter((r) => r.bucket !== '기능어');
const counts = rows.reduce((a, r) => ((a[r.bucket] = (a[r.bucket] || 0) + 1), a), {});
console.log('파싱:', JSON.stringify(counts), '/ 학습 대상', learn.length);
if (rows.length !== 800 || learn.length !== 693) {
  console.error('❌ 개수 불일치 — PDF 추출본을 확인하세요 (기대: 총 800, 학습 693)');
  process.exit(1);
}
const dup = learn.length - new Set(learn.map((r) => r.word.toLowerCase())).size;
if (dup !== 0) { console.error(`❌ 중복 ${dup}건`); process.exit(1); }

fs.writeFileSync('scripts/elementary-800-words.json', JSON.stringify({ generatedAt: '2026-08-04', source: '올라영_교육부 초등필수영단어800.pdf', learnable: learn, functionWords: rows.filter((r) => r.bucket === '기능어') }, null, 1));
console.log('✅ scripts/elementary-800-words.json 저장 (학습', learn.length, '+ 기능어', rows.length - learn.length, ')');
