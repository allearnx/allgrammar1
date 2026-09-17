import fs from 'fs';
const meta = JSON.parse(fs.readFileSync(new URL('./meta.json', import.meta.url), 'utf8'));
const C = ['①','②','③','④','⑤'];
const stems = [
  '[1~2 미술관 대화] 밑줄 친 ⓐ(플래시를 사용해서는 안 됩니다)를 영어로 바르게 쓴 것은?',
  '[1~2 미술관 대화] 위 대화를 읽고 알 수 있는 내용으로 적절한 것은?',
  '[대화] 빈칸에 들어갈 말로 적절하지 않은 것은? (May I go to the video room?)',
  '어법상 옳은 문장만을 있는 대로 고른 개수는? (비교급)',
  '같은 뜻이 되도록 어법상 옳게 바꾸어 쓴 것은? (Larry Johnson is the smartest student in the world.)',
  '[6~10 Mona Lisa 목격자] 윗글의 목격자 진술을 잘못 이해한 것은?',
  '[6~10 Mona Lisa 목격자] 빈칸 (A)~(C)에 들어갈 말로 알맞게 짝지어진 것은? (was / were)',
  '[6~10 Mona Lisa 목격자] (가)~(마)에 들어갈 단어의 영영 풀이로 옳지 않은 것은?',
  '[6~10 Mona Lisa 목격자] 밑줄 친 ⓐ~ⓔ 중 어법상 옳은 것만을 있는 대로 고른 것은?',
  '[6~10 Mona Lisa 목격자] 윗글을 읽고 답할 수 없는 질문은?',
  '[11~13 Botero] 윗글의 내용과 일치하지 않는 것은?',
  '[11~13 Botero] 두 버전의 그림에 관한 공통점과 차이점을 표로 정리한 것 중 옳은 것을 고르면?',
  '[11~13 Botero] 밑줄 친 (A) it이 가리키는 것은?',
  '[14~15 대화] 빈칸 (A), (B)에 들어갈 말로 바르게 짝지어진 것은? (turn off)',
  '[14~15 대화] 빈칸 (가)에 들어갈 말로 옳은 것만을 <보기>에서 있는 대로 고른 것은?',
  '어법상 옳은 문장만을 있는 대로 고른 개수는? (to부정사·동명사)',
  '[17~19 zero-waste Challenge 01] 윗글의 내용과 일치하는 것은?',
  '[17~19 zero-waste Challenge 01] (A)에 알맞은 제목은?',
  '[17~19 zero-waste Challenge 01] ⓐ와 to부정사의 명사적 용법 중 쓰임이 같은 것만을 있는 대로 고른 것은?',
  '[20~23 Challenge 03 Upcycle] 답할 수 없는 질문만을 <보기>에서 있는 대로 고른 개수는?',
  '[20~23 Challenge 03 Upcycle] 문맥상 밑줄 친 ⓐ(tore)의 영영 풀이로 옳은 것은?',
  '[20~23 Challenge 03 Upcycle] (A)~(E) 중 주어진 문장(This process is upcycling.)이 들어가기에 알맞은 곳은?',
  '[20~23 Challenge 03 Upcycle] ⓑ(that)의 쓰임과 같은 것만을 있는 대로 고른 것은?',
  '[24~25 Challenge 04 Recycle] Minsu에 대한 설명으로 가장 알맞은 것은?',
  '[24~25 Challenge 04 Recycle] ⓐ~ⓔ 중 흐름상 어색한 문장은?',
  '[대화] 흐름에 맞도록 ⓐ~ⓕ의 순서를 가장 적절하게 배열한 것은? (plogging)',
];
const key = '③ ⑤ ⑤ ② ④ ① ④ ① ④ ⑤ ③ ⑤ ③ ② ④ ③ ② ④ ① ① ⑤ ② ④ ④ ② ⑤'.split(' ').map((c) => String(C.indexOf(c) + 1));
if (stems.length !== 26 || key.length !== 26) throw new Error('count');
const questions = stems.map((q, i) => ({ number: i + 1, question: q, options: C, answer: key[i] }));
fs.writeFileSync(new URL('./omr.json', import.meta.url), JSON.stringify({ R1: { pdf_url: meta.pdf, questions } }, null, 1));
console.log('26문항, key', key.join(' '));
