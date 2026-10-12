/**
 * يحوّل ملفات التأليف المختصرة في content-src/*.txt إلى content/<اسم>.json
 *
 * الصيغة:
 *   @category جغرافيا عالمية
 *   # geo-africa-countries | 2 | اذكر دولة في قارة أفريقيا
 *   secret: ساو تومي وبرينسيب
 *   source: https://...
 *   مصر | جمهورية مصر | مصر العربية
 *   نيجيريا
 *
 * الأجوبة مرتبة من الأشهر للأندر، والندرة (baseRarity) تنحسب من الترتيب
 * بتوزيع Zipf. تقدر تحدد ندرة يدوية بكتابة «@0.12» في آخر السطر.
 * السطور اللي تبدأ بـ // تعليقات.
 *
 * إعادة استخدام القوائم:
 *   @rows <id>   يضيف كل أجوبة سؤال ثاني (أو قائمة مساعدة) بدون تكرار
 *   @rows-if <id> <شرط>  نفس @rows بس ياخذ الأجوبة اللي تحقق الشرط (على النص بعد التطبيع):
 *        contains:ر  ‏|‏  starts:س  ‏|‏  ends:ا  ‏|‏  len:3 (كلمة وحدة طولها ٣)
 *   @exact       مطابقة حرفية بدون تسامح إملائي
 *   سؤال يبدأ id حقه بـ _ يعتبر قائمة مساعدة: يستخدم مع @rows وما ينضاف للعبة.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { normalize } from '../src/lib/normalize';
import type { ContentAnswer, ContentQuestion, Difficulty } from '../src/types';
import { CONTENT_DIR, ROOT } from './content-lib';

const SRC = join(ROOT, 'content-src');
const ZIPF_S = 1;

interface Draft {
  id: string;
  category: string;
  prompt: string;
  difficulty: Difficulty;
  secret: string;
  sources: string[];
  rows: Row[];
  file: string;
  exact: boolean;
}

type Row =
  | { text: string; aliases: string[]; fixed?: number }
  | { include: string; line: number; rule?: string };

function round(n: number): number {
  return Math.max(0.0001, Math.round(n * 10000) / 10000);
}

const drafts = new Map<string, Draft>();
const order: { file: string; id: string }[] = [];

/** يفك @rows ويشيل التكرار (بعد التطبيع) */
function resolve(d: Draft, stack: string[] = []): Extract<Row, { text: string }>[] {
  if (stack.includes(d.id)) throw new Error(`حلقة في @rows: ${[...stack, d.id].join(' → ')}`);
  const out: Extract<Row, { text: string }>[] = [];
  const seen = new Set<string>();
  for (const r of d.rows) {
    const list =
      'include' in r
        ? (() => {
            const src = drafts.get(r.include);
            if (!src) throw new Error(`${d.file}:${r.line}: @rows ${r.include} مو موجود`);
            const rows = resolve(src, [...stack, d.id]);
            return r.rule ? applyRule(rows, r.rule, `${d.file}:${r.line}`) : rows;
          })()
        : [r];
    for (const row of list) {
      // نتخطى الجواب لو اسمه مأخوذ، ونشيل الأسماء البديلة المأخوذة
      if (seen.has(normalize(row.text))) continue;
      const aliases = row.aliases.filter((a) => !seen.has(normalize(a)));
      for (const f of [row.text, ...aliases]) seen.add(normalize(f));
      out.push({ ...row, aliases });
    }
  }
  return out;
}

type TextRow = Extract<Row, { text: string }>;

function ruleTest(rule: string, where: string): (form: string) => boolean {
  const [kind, arg] = rule.split(':');
  const a = arg ? normalize(arg) : '';
  switch (kind) {
    case 'contains':
      return (f) => normalize(f).includes(a);
    case 'starts':
      return (f) => normalize(f).startsWith(a);
    case 'ends':
      return (f) => normalize(f).endsWith(a);
    case 'len':
      return (f) => !/\s/.test(f.trim()) && normalize(f).length === Number(arg);
    default:
      throw new Error(`${where}: شرط غير معروف «${rule}»`);
  }
}

/** يبقي فقط الأشكال (النص والأسماء البديلة) اللي تحقق الشرط */
function applyRule(rows: TextRow[], rule: string, where: string): TextRow[] {
  const test = ruleTest(rule, where);
  const out: TextRow[] = [];
  for (const r of rows) {
    const forms = [r.text, ...r.aliases].filter(test);
    if (!forms.length) continue;
    const [text, ...aliases] = forms;
    out.push({ text, aliases });
  }
  return out;
}

function finish(draft: Draft): ContentQuestion {
  const d = { ...draft, rows: resolve(draft) };
  const weights = d.rows.map((_, i) => 1 / Math.pow(i + 1, ZIPF_S));
  const fixedSum = d.rows.reduce((s, r) => s + (r.fixed ?? 0), 0);
  const freeWeight = d.rows.reduce((s, r, i) => s + (r.fixed === undefined ? weights[i] : 0), 0);
  const scale = freeWeight > 0 ? Math.max(0, 1 - fixedSum) / freeWeight : 0;
  const answers: ContentAnswer[] = d.rows.map((r, i) => {
    const a: ContentAnswer = { text: r.text, baseRarity: round(r.fixed ?? weights[i] * scale) };
    if (r.aliases.length) a.aliases = r.aliases;
    return a;
  });
  return {
    id: d.id,
    category: d.category,
    prompt: d.prompt,
    difficulty: d.difficulty,
    answers,
    secret: d.secret,
    sources: d.sources,
    ...(d.exact ? { exact: true } : {}),
  };
}

function parse(file: string): void {
  let category = '';
  let cur: Draft | null = null;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((rawLine, ln) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) return;
      const fail = (m: string) => {
        throw new Error(`${basename(file)}:${ln + 1}: ${m}`);
      };
      if (line.startsWith('@category')) {
        category = line.slice('@category'.length).trim();
        return;
      }
      if (line.startsWith('#')) {
        const [id, diff, prompt] = line
          .slice(1)
          .split('|')
          .map((s) => s.trim());
        const difficulty = Number(diff);
        if (!id || !prompt || ![1, 2, 3].includes(difficulty))
          fail('سطر السؤال لازم يكون: # id | صعوبة | نص');
        if (!category) fail('حدد @category قبل الأسئلة');
        cur = {
          id,
          category,
          prompt,
          difficulty: difficulty as Difficulty,
          secret: '',
          sources: [],
          rows: [],
          file: basename(file),
          exact: false,
        };
        if (drafts.has(id)) fail(`id مكرر: ${id}`);
        drafts.set(id, cur);
        order.push({ file: basename(file, '.txt'), id });
        return;
      }
      if (!cur) return fail('سطر خارج سؤال');
      if (line.startsWith('secret:')) {
        cur.secret = line.slice(7).trim();
        return;
      }
      if (line === '@exact') {
        cur.exact = true;
        return;
      }
      if (line.startsWith('@rows-if')) {
        const [src, rule] = line.slice(8).trim().split(/\s+/);
        cur.rows.push({ include: src, line: ln + 1, rule });
        return;
      }
      if (line.startsWith('@rows')) {
        cur.rows.push({ include: line.slice(5).trim(), line: ln + 1 });
        return;
      }
      if (line.startsWith('source:')) {
        cur.sources.push(line.slice(7).trim());
        return;
      }
      let body = line;
      let fixed: number | undefined;
      const m = /@\s*([0-9.]+)\s*$/.exec(body);
      if (m) {
        fixed = Number(m[1]);
        body = body.slice(0, m.index).trim();
      }
      const [text, ...aliases] = body
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      cur.rows.push({ text, aliases, fixed });
    });
}

const files = readdirSync(SRC)
  .filter((f) => f.endsWith('.txt'))
  .sort();
for (const f of files) parse(join(SRC, f));
let total = 0;
for (const f of files) {
  const name = basename(f, '.txt');
  const qs = order
    .filter((o) => o.file === name && !o.id.startsWith('_'))
    .map((o) => finish(drafts.get(o.id)!));
  writeFileSync(join(CONTENT_DIR, `${name}.json`), JSON.stringify(qs, null, 1) + '\n');
  total += qs.length;
  console.log(`✍️  ${f}: ${qs.length} سؤال`);
}
console.log(`المجموع: ${total} سؤال من ${files.length} ملف`);
