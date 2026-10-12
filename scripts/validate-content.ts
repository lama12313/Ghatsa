/**
 * يتحقق من صحة كل ملفات content/:
 * الـ schema، والتكرار بعد التطبيع، والجواب السري، وعدد الأجوبة، وتعارض الأسماء البديلة.
 * يطلع بكود ١ لو فيه أي خطأ.
 */
import { CONFIG } from '../src/config';
import { normalize } from '../src/lib/normalize';
import { readContentFiles } from './content-lib';

const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
const prompts = new Map<string, string>();
const perCategory = new Map<string, { questions: number; answers: number }>();

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

let totalAnswers = 0;
let totalQuestions = 0;

for (const { file, questions } of readContentFiles()) {
  questions.forEach((raw, qi) => {
    const where = `${file}#${qi}`;
    const err = (m: string) => errors.push(`${where}: ${m}`);
    if (!isObj(raw)) return err('السؤال لازم يكون object');
    const { id, category, prompt, difficulty, answers, secret, sources, exact } = raw;
    if (!isStr(id) || !/^[a-z0-9-]+$/.test(id)) err('id لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات');
    else if (ids.has(id)) err(`id مكرر: ${id}`);
    else ids.add(id);
    const label = isStr(id) ? `${file}:${id}` : where;
    const e = (m: string) => errors.push(`${label}: ${m}`);
    const w = (m: string) => warnings.push(`${label}: ${m}`);

    if (!isStr(category)) e('category مفقود');
    if (!isStr(prompt)) e('prompt مفقود');
    else {
      const p = normalize(prompt);
      if (prompts.has(p)) e(`نفس نص السؤال موجود في ${prompts.get(p)}`);
      prompts.set(p, String(id));
    }
    if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) e('difficulty لازم يكون 1 أو 2 أو 3');
    if (!Array.isArray(sources) || !sources.every(isStr)) e('sources لازم يكون مصفوفة نصوص');
    else if (sources.length === 0) w('ما فيه مصادر');
    if (!isStr(secret)) e('secret مفقود');
    if (exact !== undefined && typeof exact !== 'boolean') e('exact لازم يكون true أو false');
    if (!Array.isArray(answers)) return e('answers لازم يكون مصفوفة');

    const owner = new Map<string, string>(); // الشكل المطبّع ← الجواب الأصلي
    let sum = 0;
    let secretFound = false;
    answers.forEach((a, ai) => {
      if (!isObj(a) || !isStr(a.text)) return e(`الجواب رقم ${ai} ما فيه text`);
      const text = a.text;
      if (typeof a.baseRarity !== 'number' || !(a.baseRarity > 0 && a.baseRarity <= 1))
        e(`«${text}»: baseRarity لازم يكون بين 0 و 1`);
      else sum += a.baseRarity;
      if (a.aliases !== undefined && (!Array.isArray(a.aliases) || !a.aliases.every(isStr)))
        e(`«${text}»: aliases لازم تكون مصفوفة نصوص`);
      if (isStr(secret) && normalize(text) === normalize(secret)) secretFound = true;
      const forms = [text, ...((a.aliases as string[] | undefined) ?? [])];
      const seenHere = new Set<string>();
      for (const f of forms) {
        const n = normalize(f);
        if (!n) {
          e(`«${f}» يصير فاضي بعد التطبيع`);
          continue;
        }
        if (seenHere.has(n)) continue; // اسم بديل يطابق نفس الجواب بعد التطبيع: عادي
        seenHere.add(n);
        const prev = owner.get(n);
        if (prev !== undefined) {
          e(f === text && prev === n ? `جواب مكرر: «${text}»` : `«${f}» (من «${text}») يتعارض مع «${prev}»`);
        } else owner.set(n, text);
      }
    });
    if (isStr(secret) && !secretFound) e(`الجواب السري «${secret}» مو موجود ضمن الأجوبة`);
    if (answers.length < CONFIG.minAnswers)
      e(`عدد الأجوبة ${answers.length} أقل من الحد الأدنى ${CONFIG.minAnswers}`);
    else if (answers.length < CONFIG.targetAnswers)
      w(`عدد الأجوبة ${answers.length} أقل من الهدف ${CONFIG.targetAnswers}`);
    if (answers.length && Math.abs(sum - 1) > 0.05)
      w(`مجموع baseRarity = ${sum.toFixed(3)} (المفروض قريب من 1)`);

    totalQuestions++;
    totalAnswers += answers.length;
    if (isStr(category)) {
      const c = perCategory.get(category) ?? { questions: 0, answers: 0 };
      c.questions++;
      c.answers += answers.length;
      perCategory.set(category, c);
    }
  });
}

const verbose = process.argv.includes('--verbose');
if (warnings.length) {
  console.log(`⚠️  ${warnings.length} تنبيه`);
  for (const w of verbose ? warnings : warnings.slice(0, 15)) console.log('   ' + w);
  if (!verbose && warnings.length > 15) console.log('   … (شغّل مع --verbose لعرض الكل)');
}
console.log('\nالتصنيفات:');
for (const [cat, c] of [...perCategory].sort((a, b) => b[1].questions - a[1].questions))
  console.log(`   ${cat}: ${c.questions} سؤال، ${c.answers} جواب`);
console.log(`\nالمجموع: ${totalQuestions} سؤال، ${totalAnswers} جواب`);

if (errors.length) {
  console.error(`\n❌ ${errors.length} خطأ:`);
  for (const e of errors) console.error('   ' + e);
  process.exit(1);
}
console.log('✅ المحتوى سليم');
