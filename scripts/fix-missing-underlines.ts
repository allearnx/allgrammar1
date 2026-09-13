/**
 * "밑줄 친" 문항인데 <u> 태그가 없는 문항 복구 (2026-09-13)
 *
 * 학생 화면(FormattedText)은 <u>…</u>만 밑줄로 그린다. 추출 과정에서 밑줄이 *…* / _…_ 마커로 남거나
 * 통째로 유실된 문항은 학생이 무엇을 묻는지 알 수 없다. 처리 순서:
 *   (a) 마커 변환: *text* / **text** / _text_ / __text__ → <u>text</u>
 *   (b) 규칙 기반 복원: 지시문·<보기>·해설·문항 유형에서 대상을 추론해 보기/문장마다 정확히 1곳에 <u> 부착
 *       (모든 단위 문장이 정확히 1개씩 매칭될 때만 적용 — 하나라도 0개/2개면 미적용)
 *   (c) 지시문 재작성: 대상을 안전하게 복원할 수 없으면 "밑줄 친"을 빼고 풀 수 있는 지시문으로
 *   나머지는 수동 작업 목록으로 출력.
 * 정답(answer/answer_key)은 절대 건드리지 않는다. 적용 후 시도가 있는 시트는 regradeSheet로 재채점(오답 화면 지문 갱신).
 *
 *   npx tsx --env-file=.env.local scripts/fix-missing-underlines.ts                # dry-run
 *   npx tsx --env-file=.env.local scripts/fix-missing-underlines.ts --apply
 *   옵션: --table=sheets|templates|all (기본 all)  --sample=N (경로 b 무작위 N건 출력)  --verbose
 *         --manual=path.json (수동 작업 목록 저장)  --backup-dir=dir (기본 scripts/backups/missing-underlines-YYYYMMDD)
 */
import { mkdirSync, writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

type Q = { number: number; question: string; answer?: unknown; options?: string[]; explanation?: string };
type Table = 'naesin_problem_sheets' | 'naesin_templates';
type Row = { id: string; title: string; questions: Q[] };
type Path = 'a' | 'b' | 'c' | 'manual';
type Result = { path: Path; notes: string[] };

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const VERBOSE = ARGS.includes('--verbose');
const arg = (k: string) => ARGS.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const TABLE = arg('table') ?? 'all';
const SAMPLE = Number(arg('sample') ?? 0);
const MANUAL_OUT = arg('manual');
const SHOW = arg('show'); // 노트에 이 문자열이 포함된 문항 전문 출력 (규칙 검수용)
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const BACKUP_DIR = arg('backup-dir') ?? `scripts/backups/missing-underlines-${today}`;

// ───────────────────────── 감지 ─────────────────────────
export const hasDefect = (q: Q) =>
  /밑줄 친/.test(q.question ?? '') && !/<u>/.test(q.question ?? '') && !(q.options ?? []).some((o) => /<u>/.test(o));

const hasU = (s: string) => /<u>/.test(s);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ───────────────────────── (a) 마커 변환 ─────────────────────────
export function convertMarkers(text: string): string {
  return text
    .replace(/\*\*(?!\s)([^*\n]{1,200}?)(?<!\s)\*\*/g, '<u>$1</u>')
    .replace(/(?<!\*)\*(?!\s|\*)([^*\n]{1,200}?)(?<!\s)\*(?!\*)/g, '<u>$1</u>')
    .replace(/(?<![A-Za-z0-9_])__([A-Za-z][^_\n]{0,120}?)__(?![A-Za-z0-9_])/g, '<u>$1</u>')
    .replace(/(?<![A-Za-z0-9_])_([A-Za-z][^_\n]{0,120}?)_(?![A-Za-z0-9_])/g, '<u>$1</u>');
}

// ───────────────────────── 단위 문장 추출 ─────────────────────────
const MARKER_RE = /^\s*(?:[①②③④⑤⑥⑦⑧⑨⑩]|[ⓐⓑⓒⓓⓔⓕⓖⓗ]|\([A-Ha-h]\)|\([1-9]\)|[•·\-–]|\d\.)\s*/;
const isMarkerOnly = (s: string) => /^[\s①②③④⑤⑥⑦⑧⑨⑩ⓐⓑⓒⓓⓔⓕⓖⓗ(),.\/A-Ha-h\d개~]*$/.test(s) && !/[a-z]{2,}/.test(s);
const englishWords = (s: string) => (s.match(/[A-Za-z][A-Za-z']*/g) ?? []).length;
const hasHangul = (s: string) => /[가-힣]/.test(s);
/** 보기가 "문장 단위"인가 (마커·개수·한글 라벨이 아니라 영어 문장) */
const sentenceOptions = (q: Q) => {
  const o = q.options ?? [];
  if (o.length < 2) return false;
  return o.every((x) => !isMarkerOnly(x) && englishWords(x) >= 3);
};
/** 지문 안 마커 줄 (①~⑤ / ⓐ~ⓔ / (A)~(E) / • …) 인덱스 */
const stemMarkerLines = (lines: string[]) => {
  // <조건>/<보기> 블록(다음 빈 줄까지)의 "- stop / goal / to" 같은 단어 목록 줄은 단위 문장이 아님
  let inBlock = false;
  return lines
    .map((l, i) => {
      if (/조건|보기|어휘|단어/.test(l) && /^\s*[<\[※]/.test(l)) inBlock = true;
      else if (!l.trim()) inBlock = false;
      if (inBlock || / \/ /.test(l)) return -1;
      return MARKER_RE.test(l) && englishWords(l) >= 2 && !hasHangul(l.replace(MARKER_RE, '')) ? i : -1;
    })
    .filter((i) => i >= 0);
};
/** <보기> 문장 줄 인덱스 ("<보기> I have …" 또는 "<보기>" 다음 줄) */
const bogiLines = (lines: string[]) => {
  const out: number[] = [];
  lines.forEach((l, i) => {
    const m = l.match(/^\s*[<\[\-]?보기[>\]\-]?\s*(.*)$/);
    if (!m) return;
    if (englishWords(m[1]) >= 2 && !hasHangul(m[1])) out.push(i);
    else if (lines[i + 1] && englishWords(lines[i + 1]) >= 2 && !hasHangul(lines[i + 1]) && !MARKER_RE.test(lines[i + 1])) out.push(i + 1);
  });
  return out;
};
/** 마커 없는 단독 영어 문장 줄 (지시문·조건·한글 번역 제외). 지시문과 같은 줄에 붙은 영어 문장은 "시오." 뒤를 취함 */
const INLINE_MARKERS = /[①②③④⑤⑥⑦⑧⑨⑩ⓐⓑⓒⓓⓔⓕⓖⓗ]|\([A-Ea-e]\)/g;
const plainSentenceLines = (lines: string[]) =>
  lines
    .map((l, i) => (!hasHangul(l) && englishWords(l) >= 3 && englishWords(l) <= 25 && !MARKER_RE.test(l) && !/^\s*[<\[]/.test(l) && !/^\s*[→⇒]/.test(l) && (l.match(INLINE_MARKERS) ?? []).length < 2 ? i : -1))
    .filter((i) => i >= 0);

/** 한 줄에서 밑줄 대상 문자열 후보(시작·끝 인덱스). 정확히 1개일 때만 유효 */
type Span = { start: number; end: number };
function wrapSpan(s: string, sp: Span) {
  return `${s.slice(0, sp.start)}<u>${s.slice(sp.start, sp.end)}</u>${s.slice(sp.end)}`;
}
function findAll(s: string, re: RegExp): Span[] {
  const out: Span[] = [];
  for (const m of s.matchAll(re)) out.push({ start: m.index! + (m[1] ? m[0].indexOf(m[1]) : 0), end: m.index! + (m[1] ? m[0].indexOf(m[1]) + m[1].length : m[0].length) });
  return out;
}

// ───────────────────────── (b) 규칙 ─────────────────────────
const BASE_VERBS = new Set(
  `accept achieve act add admit advise afford agree allow answer apologize appear apply argue arrive ask attend avoid bake be bear beat become begin behave believe belong bend bet bite blow boil borrow bother break breathe bring brush build burn buy call calm cancel care carry catch cause celebrate change chase chat cheat check cheer choose clean clear climb close collect come communicate compare complain complete concentrate consider contact continue control cook copy count cover create cross cry cut dance deal decide decorate deliver depend describe design destroy develop die dig discover discuss dive do donate draw dream dress drink drive drop earn eat encourage end enjoy enter escape exercise expect explain explore express fail fall feed feel fight fill find finish fix fly focus follow forget forgive form gather get give go greet grow guess handle hang happen hate have hear help hide hike hire hit hold hope hug hurry hurt imagine improve include introduce invent invite join jump keep kick kill kiss know laugh lead learn leave lend let lie lift listen live lock look lose love mail make manage marry match mean meet melt memorize mention mind miss move name need notice obey offer open order paint park participate pass pay perform pick plan plant play please post practice prepare present press pretend prevent print promise protect prove pull push put quit raise reach read realize receive recommend recycle reduce refuse relax remember remind rent repair repeat reply rescue rest return ride ring rise run save say search see seem sell send serve set shake share shine shoot shop shout show shut sing sit skate ski sleep slide smell smile snow solve sound speak spend stand start stay steal stop store study succeed suggest support surf survive swim take talk taste teach tell thank think throw tie touch train travel treat trust try turn understand use visit volunteer vote wait wake walk want warn wash waste watch water wear welcome win wish wonder work worry write
absorb accomplish adapt adjust adopt advance affect aim alert amaze announce annoy apologise appreciate approach arrange arrest assist assume attach attack attract avoid award bark bathe beg behave bless blame bloom board book bounce bow breed brighten broadcast bury calculate camp capture carve cast chant charge chew chop claim clap classify climb cling coach comb comfort command comment commit compete complain compose conclude confirm confuse connect conquer consult consume contain contribute convince correct cough crash crawl criticize cure damage dare decorate defeat defend define delay delight demand deny deposit deserve dial differ dip direct disagree disappear disappoint discourage dislike display divide donate doubt download drag drown dry dump dust earn educate elect eliminate embarrass emphasize employ enable encourage endure engage enlarge ensure entertain envy establish estimate evaluate examine exchange excite excuse exhibit exist expand experience experiment explode export expose extend face fasten favor fear fetch file film finance fire fit flash float flood flow fold force forecast found frame freeze frighten fry fulfill function fund gain gaze generate glow glue govern grab graduate grant grasp greet grind grip guarantee guard guide hand harm harvest heal heat hesitate hop host hunt identify ignore illustrate imitate impress inform inherit injure insist inspire install instruct insult insure intend interrupt interview invest investigate iron jog judge kneel knit knock label land last launch lay lean leap lecture lick limit link load locate long maintain march mark master measure melt mend mess milk mix moan monitor motivate mount multiply murder nail negotiate nod note nurse obtain occupy occur operate oppose organize overcome owe own pack paddle pause peel perform permit persuade photograph pile pinch place plug point polish pollute pop possess pour pray predict prefer prepare preserve pretend proceed produce program progress prohibit promote pronounce propose provide publish punish purchase pursue qualify question queue race rain rank rate reassure rebuild recall recognize record recover reflect refer regard register regret rehearse reject relate release relieve rely remain remove renew repeat replace report represent request require research reserve resist resolve respect respond restore retire reveal review reward rid rob roll rot row rub ruin rule rush sail satisfy scan scare scatter scold scream screw scrub seal seat secure seek seize select separate settle sew shave shelter shift ship shiver shrug sigh sign signal sink sip sketch skip slap slip slow smash smoke snap sneeze sniff soak sort sow spare sparkle specialize spell spill spin spit split spoil spot spray spread sprint squeeze stack stain stamp stare starve state steer step stick stir stitch strengthen stretch strike strip struggle submit subtract suffer suit summarize supply suppose surprise surround suspect swallow sweat sweep swell switch tackle tap target tear tease tempt tend terrify test thrive tick tickle tidy tip toast tolerate toss trace track trade transfer transform translate transport trap tremble trick trip trouble tune twist type unite unlock unpack update upgrade upload upset value vanish vary view wander warm wave weigh whisper whistle widen wipe withdraw witness wrap wrestle yell zoom rest reach explore worry fix pass hang dry iron lend book sit spend sleep celebrate clean kick deliver exercise fill open finish`
    .split(/\s+/),
);
const ING_STOP = new Set('thing things something anything nothing everything morning evening during king ring bring sing string spring wing swing sting ceiling darling pudding sibling viking ping ding'.split(' '));
/** 동명사 문항에서 후보에서 빼는 -ing 형용사·명사 (분사 문항에서는 대상일 수 있어 동명사 주제일 때만 제외) */
const ING_ADJ = new Set('exciting interesting boring amazing surprising tiring relaxing shocking confusing disappointing embarrassing frightening annoying satisfying touching charming fascinating terrifying pleasing boiling freezing missing clothing'.split(' '));
/** 문법 기능어 — 모든 단위에 정확히 1번씩 나올 때 밑줄 대상 후보. SAFE는 그 자체로 문법 포인트인 말(추가 근거 불필요),
 *  나머지는 지시문·해설·제목에 언급될 때만 채택 */
const SAFE_FUNCTION_WORDS = ['that', 'which', 'who', 'whom', 'whose', 'what', 'when', 'where', 'why', 'how', 'if', 'whether', 'although', 'though', 'because', 'unless', 'until', 'so that'];
const FUNCTION_WORDS = [...SAFE_FUNCTION_WORDS, 'as', 'since', 'while', 'it', 'one', 'ones', 'like', 'enough', 'too', 'such', 'even', 'used', 'than', 'made', 'make', 'makes', 'keep', 'kept', 'let', 'get', 'got', 'have', 'has', 'had'];
const CONNECTORS = /\b(although|even though|even if|though|because of|because|since|despite|in spite of|thanks to|unless|until|whether|if|so that|while|when|before|after|as soon as)\b/gi;

type Rule = { name: string; find: (unit: string) => Span[] };
const wordRule = (w: string): Rule => ({ name: `word:${w}`, find: (u) => findAll(u, new RegExp(`(?<![A-Za-z'])(${esc(w)})(?![A-Za-z'])`, 'gi')) });
const phraseRule = (p: string): Rule => ({ name: `phrase:${p}`, find: (u) => findAll(u, new RegExp(`(${esc(p)})`, 'g')) });
const TO_INF: Rule = {
  name: 'to-inf',
  find: (u) => findAll(u, /(?<![A-Za-z'])([Tt]o [a-z]+)(?![A-Za-z'])/g).filter((sp) => BASE_VERBS.has(u.slice(sp.start + 3, sp.end))),
};
const ING: Rule = {
  name: '-ing',
  find: (u) => findAll(u, /(?<![A-Za-z'])([A-Za-z]{2,}ing)(?![A-Za-z'])/g).filter((sp) => !ING_STOP.has(u.slice(sp.start, sp.end).toLowerCase())),
};
const GERUND: Rule = { name: '-ing(gerund)', find: (u) => ING.find(u).filter((sp) => !ING_ADJ.has(u.slice(sp.start, sp.end).toLowerCase())) };
const WH_TO: Rule = {
  name: 'wh-to',
  find: (u) => findAll(u, /(?<![A-Za-z'])((?:what|when|where|how|which|who|whom|whether)(?: [a-z]+)? to [a-z]+[^,.;?!\n]*)/gi),
};
const CONNECTOR: Rule = { name: 'connector', find: (u) => findAll(u, CONNECTORS) };
const COMPARATIVE: Rule = {
  name: 'comparative',
  find: (u) => findAll(u, /(?<![A-Za-z'])((?:much |a lot |far |even )?(?:more [a-z]+|less [a-z]+|[a-z]+er|better|worse|less|more) than|as [a-z]+ as)(?![A-Za-z'])/gi),
};
/** 비교급 강조어 (very/much/even/still/far/a lot/so/real…) — 지시문에 '강조'가 있을 때 */
const INTENSIFIER: Rule = {
  name: 'intensifier',
  find: (u) => findAll(u, /(?<![A-Za-z'])(very|much|even|still|far|a lot|so|real|really|too|quite|pretty|a little|a bit|way)(?= (?:more |less )?[a-z]+(?:er)? than)/gi),
};
const BE_VERB: Rule = { name: 'be-verb', find: (u) => findAll(u, /(?<![A-Za-z'])(am|is|are|was|were|be|been|being)(?![A-Za-z'])/gi) };
const MODAL: Rule = { name: 'modal', find: (u) => findAll(u, /(?<![A-Za-z'])(can|could|may|might|must|will|would|shall|should|have to|has to|had to)(?![A-Za-z'])/gi) };
const TITLE_PHRASES = ['have to', 'has to', 'had to', 'so that', 'used to', 'be able to', 'would like to', 'had better', 'be going to', 'because of', 'in order to', 'as well as', 'not only', 'too ~ to', 'enough to'];
const SENSE: Rule = {
  name: 'sense-verb',
  find: (u) => findAll(u, /(?<![A-Za-z'])(?:look|looks|looked|feel|feels|felt|smell|smells|smelled|sound|sounds|sounded|taste|tastes|tasted|seem|seems|seemed) (?:like )?([a-z]+)(?![A-Za-z'])/gi),
};

/** 규칙을 단위 집합에 적용: 모든 단위가 정확히 1개 매칭일 때만 결과 반환 */
function applyRule(units: string[], rule: Rule): string[] | null {
  if (!units.length) return null;
  const out: string[] = [];
  for (const u of units) {
    if (hasU(u)) { out.push(u); continue; }
    // "문장 A / 문장 B" 짝 보기: 각 문장마다 정확히 1개
    const segs = u.split(' / ');
    const done: string[] = [];
    for (const seg of segs) {
      const sp = rule.find(seg);
      if (sp.length !== 1) return null;
      done.push(wrapSpan(seg, sp[0]));
    }
    out.push(done.join(' / '));
  }
  return out;
}

/** 지시문에 명시된 대상 (밑줄 친 if / so that / when / 'it ~ that' …) */
function explicitTarget(direction: string): Rule | null {
  const m = direction.match(/밑줄 친 ['"]?([A-Za-z][A-Za-z' ]{0,40}?)['"]?(?:의|가|이|와|과|는|을|를|에)\s/)
    ?? direction.match(/보기[>\]]?의 ['"]?([A-Za-z][A-Za-z' ]{0,20}?)['"]?(?:와|과|랑)\s/);
  if (!m) return null;
  const w = m[1].trim();
  if (/^to$/i.test(w) || /부정사/.test(direction.slice(m.index!, m.index! + 30))) return null;
  if (w.split(' ').length > 6 || /~/.test(w)) return null;
  return w.includes(' ') ? phraseRule(w) : wordRule(w);
}
/** 불규칙 동사 활용형 묶음 — <보기>의 made ↔ 보기의 make/making 등 같은 단어로 취급 */
const VERB_FORMS = ['make makes made making', 'keep keeps kept keeping', 'find finds found finding', 'get gets got gotten getting', 'take takes took taken taking', 'give gives gave given giving', 'have has had having', 'do does did done doing', 'go goes went gone going', 'see sees saw seen seeing', 'let lets letting', 'tell tells told telling', 'run runs ran running', 'win wins won winning', 'leave leaves left leaving', 'feel feels felt feeling', 'say says said saying', 'know knows knew known knowing', 'come comes came coming', 'become becomes became becoming'];
const wordFormsRule = (w: string): Rule => {
  const lw = w.toLowerCase();
  if (lw === 'if' || lw === 'whether') return { name: `word:if|whether`, find: (u) => findAll(u, /(?<![A-Za-z'])(if|whether)(?![A-Za-z'])/gi) };
  const group = VERB_FORMS.find((g) => g.split(' ').includes(lw));
  if (group) return { name: `word:${lw}(+활용형)`, find: (u) => findAll(u, new RegExp(`(?<![A-Za-z'])(${group.split(' ').join('|')})(?![A-Za-z'])`, 'gi')) };
  return wordRule(w);
};
/** <보기>에 이미 <u>단어</u>가 있으면 그 단어 */
function bogiTarget(question: string): Rule | null {
  const m = question.match(/보기[^\n]*?<u>([^<]+)<\/u>/) ?? question.match(/보기>?\s*\n[^\n]*<u>([^<]+)<\/u>/);
  if (!m) return null;
  const w = m[1].trim();
  if (!/^[A-Za-z' ]+$/.test(w) || w.split(' ').length > 3) return null;
  return w.includes(' ') ? phraseRule(w) : wordFormsRule(w);
}
/** 모든 단위에 정확히 1번씩 등장하는 기능어가 유일하면 그 단어 */
function commonFunctionWord(units: string[], evidence: string): Rule | null {
  const cands = FUNCTION_WORDS.filter((w) => units.every((u) => findAll(u, new RegExp(`(?<![A-Za-z'])(${esc(w)})(?![A-Za-z'])`, 'gi')).length === 1));
  const ok = cands.filter((w) => SAFE_FUNCTION_WORDS.includes(w) || new RegExp(`(?<![A-Za-z])${esc(w)}(?![A-Za-z])`, 'i').test(evidence));
  if (ok.length !== 1) return null;
  return wordRule(ok[0]);
}
const COMMON_STOP = new Set('the and for you she her his him they them their our with from this that are was were have has had not but can will any all some what when where who how why did does do one out into about than then there here very too also just more most much many your its it is be been being of in on at to by as if or an no so up my me we us he am could would should may might must shall like get got make made take took go went come came see saw say said know knew think thought want give gave'.split(' '));
/** 지시문이 '단어/낱말/표현'을 묻고, 모든 단위에 정확히 1번씩(활용형 허용) 나오는 내용어가 유일하면 그 단어 */
function commonContentWord(units: string[]): Rule | null {
  const first = units[0].toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const cands: string[] = [];
  for (const w of new Set(first)) {
    if (COMMON_STOP.has(w) || FUNCTION_WORDS.includes(w)) continue;
    const stem = w.replace(/(?:ies|es|s|ed|ing)$/, '');
    if (stem.length < 3) continue;
    const re = new RegExp(`(?<![A-Za-z'])(${esc(stem)}(?:s|es|ies|d|ed|ing|y)?)(?![A-Za-z'])`, 'gi');
    if (units.every((u) => findAll(u, re).length === 1)) cands.push(stem);
  }
  if (cands.length !== 1) return null;
  const stem = cands[0];
  return { name: `content:${stem}`, find: (u) => findAll(u, new RegExp(`(?<![A-Za-z'])(${esc(stem)}(?:s|es|ies|d|ed|ing|y)?)(?![A-Za-z'])`, 'gi')) };
}
/** 해설 첫머리 "'afraid'는 …" → 지문 문장에서 그 단어 */
function explanationLeadWord(exp: string | undefined): Rule | null {
  const m = exp?.match(/^\s*['"‘“]?([A-Za-z][A-Za-z']{1,20})['"’”]?\s*(?:[은는이가의도을를]|→|와|과)\s/);
  return m ? wordRule(m[1]) : null;
}

type Topic = 'to-inf' | 'ing' | 'gerund' | 'wh-to' | 'connector' | 'comparative' | 'intensifier' | 'sense' | 'be' | 'modal' | null;
function detectTopic(q: Q, title: string, direction: string): Topic {
  const t = `${title} ${direction} ${q.explanation ?? ''}`;
  if (/의문사\s*\+?\s*to|의문사\+to|wh-?\s*to/i.test(t)) return 'wh-to';
  if (/to\s?부정사|to-?V\b|to \+ 동사/i.test(t)) return 'to-inf';
  if (/동명사/.test(t) && !/분사/.test(t)) return 'gerund';
  if (/동명사|현재분사|-ing|ing형/.test(t)) return 'ing';
  if (/감각동사|look\/feel|지각동사/.test(t)) return 'sense';
  if (/비교급.*강조|강조.*비교급/.test(direction)) return 'intensifier';
  if (/비교급|원급/.test(t)) return 'comparative';
  if (/be동사|be 동사/.test(t)) return 'be';
  if (/조동사/.test(t)) return 'modal';
  if (/접속사|because|although|though|since|unless|so that/.test(t)) return 'connector';
  return null;
}
const topicRule = (topic: Topic): Rule | null =>
  topic === 'to-inf' ? TO_INF : topic === 'ing' ? ING : topic === 'gerund' ? GERUND : topic === 'wh-to' ? WH_TO : topic === 'connector' ? CONNECTOR : topic === 'comparative' ? COMPARATIVE
  : topic === 'intensifier' ? INTENSIFIER : topic === 'sense' ? SENSE : topic === 'be' ? BE_VERB : topic === 'modal' ? MODAL : null;
const titlePhraseRule = (title: string, direction: string): Rule | null => {
  const p = TITLE_PHRASES.find((x) => title.includes(x) || direction.includes(x));
  return p && !/~/.test(p) ? phraseRule(p) : null;
};

/** 보기가 "① to eat" 처럼 마커+구절이고 지문에 같은 마커 줄이 있으면, 지문 줄에서 그 구절에 밑줄 */
function optionPhraseIntoStem(q: Q, lines: string[]): { lines: string[]; n: number } | null {
  const opts = q.options ?? [];
  if (opts.length < 3) return null;
  const parsed = opts.map((o) => o.match(/^\s*([①②③④⑤ⓐⓑⓒⓓⓔ]|\([A-Ea-e]\))\s*(.+?)\s*$/)).map((m) => (m ? { marker: m[1], phrase: m[2] } : null));
  if (parsed.some((p) => !p)) return null;
  const targets = parsed.flatMap((p) => (p && !hasHangul(p.phrase) ? [p] : []));
  if (targets.length < 3 || targets.some((p) => englishWords(p.phrase) < 1)) return null;
  const out = [...lines];
  let n = 0;
  for (const p of targets) {
    const idx = out.findIndex((l) => l.includes(p.marker) && l.includes(p.phrase));
    if (idx < 0) return null;
    // 구절이 그 줄의 문장 전체면(① She is a nurse.) 밑줄 대상이 아니라 문장 자체 → 규칙 미적용
    if (out[idx].replace(MARKER_RE, '').trim() === p.phrase) return null;
    const re = new RegExp(`(${esc(p.marker)}\\s*)${esc(p.phrase)}`);
    const next = out[idx].replace(re, `$1<u>${p.phrase}</u>`);
    if (next === out[idx]) return null;
    out[idx] = next;
    n++;
  }
  return n === targets.length ? { lines: out, n } : null;
}

/** 지시문에 <u>구절</u>이 있고 지문에 같은 구절이 있으면 지문 쪽에도 밑줄 */
function directionPhraseIntoPassage(lines: string[]): { lines: string[]; n: number } | null {
  const di = lines.findIndex((l) => /밑줄 친\s*<u>/.test(l));
  if (di < 0) return null;
  const m = lines[di].match(/밑줄 친\s*<u>(.+?)<\/u>/);
  if (!m) return null;
  const phrase = m[1].replace(/^["“'‘]|["”'’]$/g, '');
  const out = [...lines];
  for (let i = 0; i < out.length; i++) {
    if (i === di || hasU(out[i]) || !out[i].includes(phrase)) continue;
    out[i] = out[i].replace(phrase, `<u>${phrase}</u>`);
    return { lines: out, n: 1 };
  }
  return null;
}

/** 대화/영작 문항: "밑줄 친 우리말" — 한글 문장 줄이 정확히 하나면 그 줄(화자 라벨·(A) 마커 제외)에 밑줄 */
function koreanTargetLine(lines: string[]): { lines: string[]; n: number } | null {
  // "※ 완전한 문장으로 쓰시오" / "(clean, want, room)" 같은 꼬리는 대상에서 제외
  const cutAt = (l: string) => { const i = l.search(/※|\((?=[A-Za-z][A-Za-z, ]*\))/); return i < 0 ? l : l.slice(0, i); };
  const cand = lines
    .map((l, i) => ({ l: cutAt(l), i }))
    .filter(({ l }) => {
      const body = l.replace(/^\s*(?:[A-Za-z]+\s*:|\([A-Da-d]\)|\(\d\)|[①②③④⑤ⓐⓑⓒⓓⓔ])?\s*/, '');
      if ((body.match(/[가-힣]/g) ?? []).length < 4) return false;
      if (/밑줄|시오|하세요|할 것|쓸 것|조건|보기|※|_{3,}|→/.test(body)) return false;
      if (/^\s*[<\[]/.test(l)) return false;
      return true;
    });
  if (cand.length !== 1) return null;
  const { l, i } = cand[0];
  const sp = koreanRun(l, l.search(/[가-힣]/));
  if (!sp) return null;
  const out = [...lines];
  out[i] = wrapSpan(lines[i], sp); // l은 잘린 앞부분이므로 원래 줄에 같은 위치로 적용
  return { lines: out, n: 1 };
}
/** start 위치(한글 시작)부터 한글 문장 끝까지 — 문장부호 뒤에 영어 문장이 이어지면 거기서 끊는다 */
function koreanRun(line: string, start: number): Span | null {
  if (start < 0) return null;
  const rest = line.slice(start);
  const m = rest.match(/^(.*?[.?!])(?=\s+[A-Z"“(\[])/) ?? rest.match(/^(.*?)\s*$/);
  if (!m || !/[가-힣]/.test(m[1])) return null;
  // 마지막 한글 글자(+바로 뒤 문장부호)까지만 — ", but still …" 같은 영어 꼬리 제외
  const seg = m[1];
  let end = seg.length;
  while (end > 0 && !/[가-힣]/.test(seg[end - 1])) end--;
  if (/[.?!]/.test(seg[end] ?? '')) end++;
  return { start, end: start + end };
}
/** "밑줄 친 우리말 (A)" / "밑줄 친 (A)의 우리말": 지문의 "(A) 한글…"에 밑줄 */
function koreanAfterMarker(lines: string[], letter: string): { lines: string[]; n: number } | null {
  const re = new RegExp(`\\(${letter}\\)\\s*(?=[가-힣])`);
  const idx = lines.map((l, i) => (!/밑줄 친/.test(l) && re.test(l) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) return null;
  const l = lines[idx[0]];
  const m = l.match(re)!;
  const sp = koreanRun(l, m.index! + m[0].length);
  if (!sp) return null;
  const out = [...lines];
  out[idx[0]] = wrapSpan(l, sp);
  return { lines: out, n: 1 };
}
/** "밑줄 친 우리말" + 지문 줄 안에 "①한글 구절" 인라인 마커: 각 마커 뒤 한글 구절에 밑줄 */
function koreanAfterInlineMarkers(lines: string[], required: number): { lines: string[]; n: number } | null {
  const re = /([①②③④⑤ⓐⓑⓒⓓⓔ])\s*([가-힣][^\n]*?)(?=\s+[A-Za-z("]|[.?!,]|\s*$)/g;
  let n = 0;
  const out = lines.map((l) => (/밑줄 친/.test(l) ? l : l.replace(re, (_m, mk: string, ko: string) => { n++; return `${mk}<u>${ko}</u>`; })));
  return n >= required ? { lines: out, n } : null;
}
/** "밑줄 친 (A)" (영어 문장): 지문에서 문장 첫머리의 "(A)" 뒤 문장 끝까지 밑줄. 문장 중간의 (A)는 범위를 알 수 없어 미적용 */
function englishAfterMarker(lines: string[], letter: string): { lines: string[]; n: number } | null {
  const re = new RegExp(`(?:^|[.?!]\\s+|:\\s*)\\(${letter}\\)\\s*(?=[A-Z"“])`);
  const idx = lines.map((l, i) => (!/밑줄 친/.test(l) && re.test(l) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) return null;
  const l = lines[idx[0]];
  const all = l.match(new RegExp(`\\(${letter}\\)`, 'g')) ?? [];
  if (all.length !== 1) return null;
  const m = l.match(re)!;
  const start = m.index! + m[0].length;
  const rest = l.slice(start);
  const e = rest.match(/^(.*?[.?!]["”]?)(?=\s|$)/) ?? rest.match(/^(.*?)\s*$/);
  if (!e || englishWords(e[1]) < 2 || hasHangul(e[1])) return null;
  const out = [...lines];
  out[idx[0]] = wrapSpan(l, { start, end: start + e[1].length });
  return { lines: out, n: 1 };
}

// ───────────────────────── (c) 지시문 재작성 ─────────────────────────
const MARKER_RANGE = (text: string) => {
  const sets: [RegExp, string[]][] = [
    [/[ⓐⓑⓒⓓⓔⓕⓖⓗ]/g, [...'ⓐⓑⓒⓓⓔⓕⓖⓗ']],
    [/[①②③④⑤⑥⑦⑧⑨⑩]/g, [...'①②③④⑤⑥⑦⑧⑨⑩']],
    [/\([A-H]\)/g, 'ABCDEFGH'.split('').map((c) => `(${c})`)],
    [/\([a-h]\)/g, 'abcdefgh'.split('').map((c) => `(${c})`)],
    [/\([1-9]\)/g, '123456789'.split('').map((c) => `(${c})`)],
  ];
  for (const [re, seq] of sets) {
    const found = new Set(text.match(re) ?? []);
    if (found.size < 2 || !found.has(seq[0])) continue;
    let last = 0;
    while (last + 1 < seq.length && found.has(seq[last + 1])) last++;
    if (last < 1) continue;
    return `${seq[0]}~${seq[last]}`;
  }
  return null;
};

type Reword = { name: string; test: (q: Q, ctx: Ctx) => boolean; apply: (q: Q, ctx: Ctx) => string | null };
type Ctx = { units: 'options' | 'stem' | 'none'; range: string | null; title: string };
const GRAMMAR_JUDGE = /어법상|어색|올바른|틀린|옳은|알맞지 않은|바르지 않은|적절하지 않은|어색하지 않은|자연스러운/;
const REWORDS: Reword[] = [
  {
    name: 'marker-range', // 밑줄 친 ⓐ~ⓔ → ⓐ~ⓔ
    test: (q) => /밑줄 친 (?:부분 )?(?:[ⓐ①]~[ⓑ-ⓗ②-⑩]|\([Aa1]\)~\([B-Hb-h2-9]\)|㉠~[㉡-㉦])/.test(q.question),
    apply: (q) => q.question.replace(/밑줄 친 (?:부분 )?((?:[ⓐ①]~[ⓑ-ⓗ②-⑩]|\([Aa1]\)~\([B-Hb-h2-9]\)|㉠~[㉡-㉦]))/g, '$1'),
  },
  {
    name: 'inline-marker', // 밑줄 친 ⓐ를 / 밑줄 친 ⓐ와 ⓑ의 / 밑줄 친 문장 ⓐ, ⓑ를 → 마커가 지문에 있으면 "밑줄 친"만 제거
    test: (q) => {
      const m = q.question.match(/밑줄 친 (?:문장 |부분 )?([ⓐ-ⓗ①-⑩])/);
      return !!m && q.question.replace(/[^\n]*밑줄 친[^\n]*/g, '').includes(m[1]);
    },
    apply: (q) => q.question.replace(/밑줄 친 ((?:문장 |부분 )?[ⓐ-ⓗ①-⑩])/g, '$1'),
  },
  {
    name: 'korean-(A)', // 밑줄 친 우리말 (A) / 밑줄 친 (A)의 우리말 → 우리말 (A)
    test: (q) => /밑줄 친 (?:우리말 )?\([A-Da-d]\)/.test(q.question) && /\([A-Da-d]\)\s*[가-힣]/.test(q.question.replace(/밑줄 친 (?:우리말 )?\([A-Da-d]\)[^\n]*/g, '')),
    apply: (q) => q.question.replace(/밑줄 친 우리말 (\([A-Da-d]\))/g, '우리말 $1').replace(/밑줄 친 (\([A-Da-d]\))/g, '$1'),
  },
  {
    name: 'korean-condition', // (단, 밑줄 친 부분의 뜻이 빠지지 않도록 …) → 우리말의 뜻이
    test: (q) => /\(단, 밑줄 친 부분의 뜻이 빠지지 않도록/.test(q.question),
    apply: (q) => q.question.replace(/\(단, 밑줄 친 부분의 뜻이 빠지지 않도록/g, '(단, 우리말의 뜻이 빠지지 않도록'),
  },
  {
    name: 'find-symbol-among-markers', // 밑줄 친 부분(에서|중) 어색한 것을 찾아 기호를 → ⓐ~ⓓ 중 …
    test: (q, ctx) => !!ctx.range && /밑줄 친 (?:부분|곳|문장)(?:에서| 중|들 중)[, ]*.*(?:기호|고르|고치|찾)/.test(q.question) && !sentenceOptions(q),
    apply: (q, ctx) => q.question.replace(/밑줄 친 (?:부분|곳|문장)(?:에서| 중|들 중),?/g, `${ctx.range} 중`),
  },
  {
    name: 'grammar-judge-sentences', // 문장 단위 보기에서 어법 판단 → "다음 중 어법상 … 것은?"
    test: (q, ctx) => ctx.units !== 'none' && GRAMMAR_JUDGE.test(q.question.split('\n').find((l) => /밑줄 친/.test(l)) ?? '') && !/쓰임|용법|의미|뜻/.test(q.question.split('\n').find((l) => /밑줄 친/.test(l)) ?? ''),
    apply: (q) => {
      const before = q.question;
      const after = before
        .replace(/다음 (?:글의 |대화의 |문장의 |문장 중 )?밑줄 친 (?:부분|곳|것)(?:들)? 중,?\s*/g, '다음 중 ')
        .replace(/다음 (?:중 |문장 중 )?밑줄 친 (?:부분|곳)이 /g, '다음 중 ')
        .replace(/다음 (?:중 )?밑줄 친 (?:부분|곳)의 /g, '다음 중 ')
        .replace(/\[다음 밑줄 친 (?:부분|곳) 중 /g, '[다음 중 ')
        .replace(/밑줄 친 (?:부분|곳) 중(?:에서)?,?\s*/g, '');
      return after === before ? null : after;
    },
  },
  {
    name: 'wh-to-clause', // <보기>와 같이 밑줄 친 부분을 주어가 있는 절로 → 「의문사+to부정사」를 …
    test: (q) => /밑줄 친 부분을 주어가 있는 절로/.test(q.question) && /\b(what|when|where|how|which|who|whom|whether) to\b/i.test(q.question),
    apply: (q) => q.question.replace(/밑줄 친 부분을 주어가 있는 절로/g, '「의문사+to부정사」를 주어가 있는 절로'),
  },
  {
    name: 'dative-example', // 밑줄 친 낱말을 문장의 끝에 위치시켜 <예시>처럼 → 두 문장을 <예시>처럼 한 문장으로
    test: (q) => /밑줄 친 낱말을 문장의 끝에 위치시켜 주어진 <예시>처럼 바꾸어 쓰시오/.test(q.question),
    apply: (q) => q.question.replace(/다음 두 개의 문장에서 밑줄 친 낱말을 문장의 끝에 위치시켜 주어진 <예시>처럼 바꾸어 쓰시오/g, '다음 두 개의 문장을 주어진 <예시>처럼 한 문장으로 바꾸어 쓰시오'),
  },
  {
    name: 'relative-adverb-antecedent',
    test: (q) => /밑줄 친 부분이 선행사일 때, 관계부사로 바꿀 수 있는 부분을 찾아 동그라미 치고/.test(q.question),
    apply: (q) => q.question.replace(/다음 문장에서 밑줄 친 부분이 선행사일 때, 관계부사로 바꿀 수 있는 부분을 찾아 동그라미 치고, 빈칸에 알맞은 관계부사를 쓰시오/g, '다음 두 문장을 관계부사를 사용하여 한 문장으로 만들 때, 빈칸에 알맞은 관계부사를 쓰시오'),
  },
  {
    name: 'find-error-sentence', // [Part N] 밑줄 친 부분을 올바르게 고쳐 쓰시오. + "Find error:" 문장 → 문장 전체 고쳐 쓰기
    test: (q) => /밑줄 친 부분을 올바르게 고쳐 쓰시오/.test(q.question) && /Find error:/.test(q.question) && typeof q.answer === 'string' && englishWords(q.answer) >= 4,
    apply: (q) => q.question.replace(/밑줄 친 부분을 올바르게 고쳐 쓰시오/g, '다음 문장에서 틀린 부분을 찾아 문장 전체를 올바르게 고쳐 쓰시오'),
  },
  {
    name: 'blank-fill', // "밑줄 친 부분을 올바르게 고쳐 쓰시오" 인데 지문이 빈칸(___) 문항 → 빈칸 채우기 지시문
    test: (q) => /밑줄 친 부분을 (?:올바르게|바르게) 고쳐 쓰시오/.test(q.question) && /_{3,}/.test(q.question) && typeof q.answer === 'string' && englishWords(q.answer) <= 3,
    apply: (q) => q.question.replace(/밑줄 친 부분을 (?:올바르게|바르게) 고쳐 쓰시오/g, '빈칸에 알맞은 말을 쓰시오'),
  },
  {
    name: 'korean-to-english', // "아래 밑줄 친 문장의 틀린 부분을 고치시오" 인데 지문이 우리말 + [조건]만 있는 영작 문항
    test: (q) => /아래 밑줄 친 문장의 틀린 부분을 고치시오/.test(q.question) && /\[조건\]/.test(q.question)
      && !q.question.split('\n').some((l) => !hasHangul(l) && englishWords(l) >= 3) && typeof q.answer === 'string' && englishWords(q.answer) >= 3,
    apply: (q) => q.question.replace(/아래 밑줄 친 문장의 틀린 부분을 고치시오/g, '아래 우리말을 [조건]에 맞게 영어로 쓰시오'),
  },
  {
    name: 'it-that-usage', // 밑줄 친 'it ~ that …'의 용법 → 'it ~ that …'의 용법
    test: (q) => /밑줄 친 ['"]?[Ii]t\s*~\s*that/.test(q.question),
    apply: (q) => q.question.replace(/밑줄 친 (['"]?[Ii]t\s*~\s*that)/g, '$1'),
  },
];

// ───────────────────────── 문항 처리 ─────────────────────────
export function processQuestion(q: Q, title: string): Result {
  const notes: string[] = [];
  let pathA = false;
  let pathB = false;

  // (a) 마커 변환
  const qa = convertMarkers(q.question);
  const oa = (q.options ?? []).map(convertMarkers);
  if (qa !== q.question || oa.some((o, i) => o !== q.options![i])) {
    pathA = true;
    notes.push('a:markers');
    q.question = qa;
    if (q.options) q.options = oa;
  }

  // 단위 집합
  let lines = q.question.split('\n');
  const direction = lines.find((l) => /밑줄 친/.test(l)) ?? '';
  const stemIdx = stemMarkerLines(lines);
  const bogiIdx = bogiLines(lines);
  const plainIdx = plainSentenceLines(lines).filter((i) => !bogiIdx.includes(i) && !stemIdx.includes(i));
  const optsAreUnits = sentenceOptions(q);
  const stemHasU = () => hasU(q.question);
  const optsHaveU = () => (q.options ?? []).some(hasU);
  const topic = detectTopic(q, title, direction);
  /** 지시문이 지문 쪽 대상(우리말·(A)·지칭)을 가리켜 보기에는 밑줄이 필요 없는 유형 */
  const markerTarget = /밑줄 친 (?:우리말 )?\([A-Da-d]\)(?!~)(?!\s*[A-Za-z])/.test(direction) && !/[ⓐ①]~|\([A-Ea-e]\)~/.test(direction);
  const stemOnlyTarget = /우리말|영작|의도로|의미하는 바|의미로 알맞은|의미로 가장|가리키는|지칭|배열|시사하는|함축하는/.test(direction) || markerTarget;
  /** 고쳐 쓰기 문항: 오류 위치가 밑줄 대상이라 추론 불가 (마커 변환·지시문 재작성만) */
  const correction = /고쳐|고치/.test(direction);
  /** 지문 한 줄 안에 여러 대상(ⓐ~ⓔ 등)이 있는 유형 — 단위당 1개 규칙 적용 불가 */
  const multiTarget = /[ⓐ①]~[ⓑ-ⓗ②-⑩]|\([Aa]\)~\([B-Hb-h]\)|부분 중|것 중|곳 중/.test(direction);

  // (b-0) 지시문 <u>구절</u> → 지문 / 보기 "① 구절" → 지문
  if (!stemIdx.some((i) => hasU(lines[i])) && !plainIdx.some((i) => hasU(lines[i]))) {
    const r1 = directionPhraseIntoPassage(lines);
    if (r1) { lines = r1.lines; pathB = true; notes.push('b:direction-phrase→passage'); }
    else {
      const r2 = optionPhraseIntoStem(q, lines);
      if (r2) { lines = r2.lines; pathB = true; notes.push(`b:option-phrase→stem×${r2.n}`); }
    }
  }
  // (b-우리말) 밑줄 친 우리말 (A) → "(A) 한글…" / 밑줄 친 우리말 → 인라인 ①한글 구절 또는 유일한 한글 문장 줄
  const letterM = markerTarget ? direction.match(/밑줄 친 (?:우리말 )?\(([A-Da-d])\)/) : null;
  if (letterM && !lines.some(hasU)) {
    const r = /우리말/.test(direction) ? koreanAfterMarker(lines, letterM[1]) : /\([A-Da-d]\)\s*[A-Za-z]/.test(direction) ? null : englishAfterMarker(lines, letterM[1]);
    if (r) { lines = r.lines; pathB = true; notes.push(/우리말/.test(direction) ? 'b:korean-(A)' : 'b:english-(A)'); }
  } else if (/밑줄 친 .{0,12}우리말/.test(direction) && !lines.some(hasU)) {
    const listed = new Set(direction.match(/[ⓐ-ⓗ①-⑩]/g) ?? []);
    const r = koreanAfterInlineMarkers(lines, listed.size || 2) ?? koreanTargetLine(lines);
    if (r) { lines = r.lines; pathB = true; notes.push(r.n > 1 ? `b:korean-inline×${r.n}` : 'b:korean-line'); }
  }
  // (b-보기 문장) "밑줄 친 문장" + <보기>에 영어 문장이 하나뿐이면 그 문장 전체
  if (/밑줄 친 문장/.test(direction) && /보기/.test(direction) && bogiIdx.length === 1 && !lines.some(hasU)) {
    const l = lines[bogiIdx[0]];
    const m = l.match(/^(\s*[<\[]?보기[>\]]?\s*)?(.*?)(\s*)$/);
    if (m && englishWords(m[2]) >= 3) { lines[bogiIdx[0]] = `${m[1] ?? ''}<u>${m[2]}</u>${m[3]}`; pathB = true; notes.push('b:bogi-sentence'); }
  }
  q.question = lines.join('\n');

  // (b) 규칙 기반: 대상 추론 순서 = 지시문 명시 → <보기> 밑줄 → 공통 기능어 → 해설 첫 단어 → 주제 규칙
  const unitSets: { name: string; idx: number[] }[] = [];
  if (!multiTarget) {
    if (stemIdx.length && !stemIdx.some((i) => hasU(lines[i]))) unitSets.push({ name: 'stem', idx: stemIdx });
    if (bogiIdx.length && !bogiIdx.some((i) => hasU(lines[i]))) unitSets.push({ name: 'bogi', idx: bogiIdx });
    if (plainIdx.length && !plainIdx.some((i) => hasU(lines[i]))) unitSets.push({ name: 'plain', idx: plainIdx });
  }
  const needOptions = optsAreUnits && !optsHaveU() && !stemIdx.length && !stemOnlyTarget;
  // 지문 쪽 대상 유형(우리말·(A)·의미)은 아직 아무 밑줄도 못 만들었을 때만 지문 단위 규칙을 시도 (보기는 제외)
  if ((unitSets.length || needOptions) && !correction && (!stemOnlyTarget || !lines.some(hasU))) {
    const allUnits = [...unitSets.flatMap((s) => s.idx.map((i) => lines[i].replace(MARKER_RE, '').replace(/^\s*[<\[]?보기[>\]]?\s*/, ''))), ...(needOptions ? q.options! : [])];
    const candidates: (Rule | null)[] = [
      explicitTarget(direction),
      bogiTarget(q.question),
      topicRule(topic),
      titlePhraseRule(title, direction),
      allUnits.length >= 3 ? commonFunctionWord(allUnits, `${direction} ${q.explanation ?? ''} ${title}`) : null,
      allUnits.length >= 3 && /단어|낱말|표현/.test(direction) ? commonContentWord(allUnits) : null,
      unitSets.some((s) => s.name === 'plain') && !needOptions && !/(?:중|끼리|나머지)/.test(direction) ? explanationLeadWord(q.explanation) : null,
    ];
    // 주제 힌트 없이도 문장 구조로 확정되는 규칙 (모든 단위 정확히 1개일 때만)
    if (!topic) candidates.push(TO_INF, ING, WH_TO);
    for (const rule of candidates) {
      if (!rule) continue;
      const trial = [...lines];
      let ok = true;
      for (const s of unitSets) {
        const units = s.idx.map((i) => trial[i]);
        const res = applyRule(units, rule);
        if (!res) { ok = false; break; }
        s.idx.forEach((li, k) => { trial[li] = res[k]; });
      }
      let optsRes: string[] | null = null;
      if (ok && needOptions) { optsRes = applyRule(q.options!, rule); if (!optsRes) ok = false; }
      if (!ok) continue;
      lines = trial;
      q.question = lines.join('\n');
      if (optsRes) q.options = optsRes;
      pathB = true;
      notes.push(`b:${rule.name}[${[...unitSets.map((s) => s.name), ...(needOptions ? ['options'] : [])].join('+')}]`);
      break;
    }
    // 보기가 단위이고 지문에도 마커 줄이 있는 경우(중복 표기): 지문에 밑줄이 생겼으면 보기도 같은 규칙으로 시도(실패해도 무방)
  }
  if (optsAreUnits && !optsHaveU() && stemIdx.length && stemIdx.some((i) => hasU(lines[i]))) {
    // 지문 마커 줄의 밑줄 구절을 보기 문장에 그대로 옮김
    const next = q.options!.map((o) => {
      const src = stemIdx.map((i) => lines[i]).find((l) => l.replace(/<\/?u>/g, '').replace(MARKER_RE, '').trim() === o.trim());
      return src ? src.replace(MARKER_RE, '') : o;
    });
    if (next.every(hasU)) { q.options = next; notes.push('b:stem→options-copy'); }
  }

  // 해결 판정: 지시문이 가리키는 단위에 밑줄이 있는가
  const resolved = (() => {
    const stemU = stemIdx.some((i) => hasU(lines[i]));
    const stemOk = !stemIdx.length || stemU || stemOnlyTarget;
    const plainOk = !plainIdx.length || multiTarget || stemOnlyTarget || plainIdx.some((i) => hasU(lines[i])) || bogiIdx.some((i) => hasU(lines[i])) || (stemU && !/주어진 문장|다음 문장의|밑줄 친 부분과/.test(direction));
    const bogiOk = !bogiIdx.length || stemOnlyTarget || bogiIdx.some((i) => hasU(lines[i])) || !/보기/.test(direction);
    const optOk = !optsAreUnits || stemOnlyTarget || optsHaveU() || stemU;
    const any = stemHasU() || optsHaveU();
    if (!any) return false;
    if (stemIdx.length || plainIdx.length || optsAreUnits || bogiIdx.length) return stemOk && plainOk && bogiOk && optOk;
    return true; // 단위 구조를 못 잡은 문항: 어딘가에 밑줄이 생겼으면 해결로 본다
  })();
  if (resolved) return { path: pathB ? 'b' : 'a', notes };

  // (c) 지시문 재작성
  const ctx: Ctx = { units: optsAreUnits ? 'options' : stemIdx.length ? 'stem' : 'none', range: MARKER_RANGE(q.question), title };
  for (const r of REWORDS) {
    if (!r.test(q, ctx)) continue;
    const next = r.apply(q, ctx);
    if (!next || next === q.question) continue;
    q.question = next;
    notes.push(`c:${r.name}`);
    if (!/밑줄 친/.test(q.question)) return { path: 'c', notes };
  }
  notes.push(pathA || pathB ? 'partial' : 'unresolved');
  return { path: 'manual', notes };
}

// ───────────────────────── 실행 ─────────────────────────
async function fetchAll(admin: ReturnType<typeof createAdminClient>, table: Table): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await admin.from(table).select('id, title, questions').order('id').range(from, from + 499).returns<Row[]>();
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return rows;
}

async function main() {
  const admin = createAdminClient();
  const tables: Table[] = TABLE === 'sheets' ? ['naesin_problem_sheets'] : TABLE === 'templates' ? ['naesin_templates'] : ['naesin_problem_sheets', 'naesin_templates'];
  const counts: Record<Table, Record<Path, number>> = {
    naesin_problem_sheets: { a: 0, b: 0, c: 0, manual: 0 },
    naesin_templates: { a: 0, b: 0, c: 0, manual: 0 },
  };
  const ruleCounts = new Map<string, number>();
  const manual: { table: Table; id: string; title: string; number: number; notes: string[]; direction: string; question: string; options?: string[] }[] = [];
  const samples: { table: Table; title: string; number: number; notes: string[]; question: string; options?: string[] }[] = [];
  const touchedSheets: string[] = [];
  let backups = 0;
  mkdirSync(BACKUP_DIR, { recursive: true });

  for (const table of tables) {
    const rows = await fetchAll(admin, table);
    let rowsTouched = 0;
    for (const row of rows) {
      const before = JSON.stringify(row.questions);
      const log: string[] = [];
      for (const q of row.questions ?? []) {
        if (!hasDefect(q)) continue;
        const answerBefore = JSON.stringify(q.answer);
        const r = processQuestion(q, row.title ?? '');
        if (JSON.stringify(q.answer) !== answerBefore) throw new Error(`answer changed! ${table} ${row.id} #${q.number}`);
        counts[table][r.path]++;
        for (const n of r.notes) ruleCounts.set(n.replace(/×\d+|\[.*\]/g, ''), (ruleCounts.get(n.replace(/×\d+|\[.*\]/g, '')) ?? 0) + 1);
        const direction = q.question.split('\n').find((l) => /밑줄 친/.test(l)) ?? q.question.split('\n')[0];
        if (r.path === 'manual') manual.push({ table, id: row.id, title: row.title, number: q.number, notes: r.notes, direction: direction.slice(0, 120), question: q.question, options: q.options });
        if (r.path === 'b') samples.push({ table, title: row.title, number: q.number, notes: r.notes, question: q.question, options: q.options });
        log.push(`  #${q.number} [${r.path}] ${r.notes.join(', ')}`);
        if (SHOW && r.notes.some((n) => n.includes(SHOW))) {
          console.log(`\n>>> [${table}] ${row.title} #${q.number} (${r.notes.join(', ')}) ans=${JSON.stringify(q.answer)}\n${q.question}`);
          (q.options ?? []).forEach((o, i) => console.log(`  (${i + 1}) ${o}`));
          if (q.explanation) console.log(`  exp: ${q.explanation.slice(0, 160)}`);
        }
      }
      const after = JSON.stringify(row.questions);
      if (after === before) continue;
      rowsTouched++;
      writeFileSync(`${BACKUP_DIR}/${table}_${row.id}.json`, JSON.stringify({ table, id: row.id, title: row.title, questions: JSON.parse(before) }));
      backups++;
      if (VERBOSE) console.log(`\n[${table}] ${row.title} (${row.id.slice(0, 8)})\n${log.join('\n')}`);
      if (!APPLY) continue;
      const { error } = await admin.from(table).update({ questions: row.questions }).eq('id', row.id);
      if (error) throw error;
      if (table === 'naesin_problem_sheets') touchedSheets.push(row.id);
    }
    console.log(`\n[${table}] ${rows.length}행 조회, ${rowsTouched}행 변경${APPLY ? ' (저장됨)' : ''}`);
    console.log(`  경로별: a=${counts[table].a} b=${counts[table].b} c=${counts[table].c} manual=${counts[table].manual}`);
  }

  console.log('\n규칙별 적용 건수:');
  for (const [k, v] of [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);
  console.log(`\n백업 ${backups}건 → ${BACKUP_DIR}`);

  if (SAMPLE > 0) {
    console.log(`\n===== 경로 b 무작위 표본 ${SAMPLE}건 (검수용) =====`);
    const pool = samples.filter((s) => s.table === 'naesin_problem_sheets');
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for (const s of pool.slice(0, SAMPLE)) {
      console.log(`\n--- ${s.title} #${s.number} (${s.notes.join(', ')})`);
      console.log(s.question.split('\n').filter((l) => hasU(l) || /밑줄 친/.test(l)).join('\n'));
      (s.options ?? []).forEach((o, i) => { if (hasU(o)) console.log(`  (${i + 1}) ${o}`); });
    }
  }

  const manualGroups = new Map<string, number>();
  for (const m of manual) { const k = m.direction.replace(/\d+/g, 'N'); manualGroups.set(k, (manualGroups.get(k) ?? 0) + 1); }
  console.log(`\n===== 수동 작업 목록 ${manual.length}건 (지시문별) =====`);
  for (const [k, v] of [...manualGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60)) console.log(`  ${String(v).padStart(4)}  ${k}`);
  if (MANUAL_OUT) { writeFileSync(MANUAL_OUT, JSON.stringify(manual, null, 1)); console.log(`수동 목록 저장: ${MANUAL_OUT}`); }

  if (!APPLY) { console.log('\n[dry-run] --apply 로 실제 적용'); return; }

  console.log(`\n===== 재채점 (변경 시트 ${touchedSheets.length}개 중 시도 있는 시트) =====`);
  let regraded = 0, scoreChanges = 0;
  for (const id of touchedSheets) {
    const before = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    if (!before.data?.length) continue;
    const r = await regradeSheet(id);
    const after = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    const bm = new Map(before.data.map((a) => [a.id, a.score]));
    const diffs = (after.data ?? []).filter((a) => bm.get(a.id) !== a.score).map((a) => `${a.id.slice(0, 8)} ${bm.get(a.id)}→${a.score}`);
    regraded++;
    scoreChanges += diffs.length;
    console.log(`  ${id.slice(0, 8)}: 시도 ${r.total}건, 점수 변동 ${diffs.length}건${diffs.length ? ' ' + diffs.join(', ') : ''}`);
  }
  console.log(`재채점 시트 ${regraded}개, 점수 변동 총 ${scoreChanges}건`);
}

if (!process.env.UNDERLINE_LIB) main().catch((e) => { console.error(e); process.exit(1); });
