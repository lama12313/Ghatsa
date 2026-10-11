/** يحوّل content/*.json إلى public/q: فهرس بدون أجوبة + ملف مشفّر لكل سؤال */
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalize } from '../src/lib/normalize';
import { encodeAnswerSet, fileNameFor } from '../src/lib/obfuscate';
import type { ContentIndex, QuestionMeta } from '../src/types';
import { loadQuestions, ROOT } from './content-lib';

const OUT = join(ROOT, 'public', 'q');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const questions = loadQuestions();
const metas: QuestionMeta[] = [];
const hash = createHash('sha1');

for (const q of questions) {
  const secretIndex = q.answers.findIndex((a) => normalize(a.text) === normalize(q.secret));
  if (secretIndex < 0) throw new Error(`${q.id}: الجواب السري مو موجود (شغّل npm run validate)`);
  const file = fileNameFor(q.id);
  const data = encodeAnswerSet({ id: q.id, answers: q.answers, secretIndex });
  writeFileSync(join(OUT, file), data);
  hash.update(q.id + data);
  metas.push({ id: q.id, category: q.category, prompt: q.prompt, difficulty: q.difficulty, file });
}

const index: ContentIndex = {
  version: hash.digest('hex').slice(0, 10),
  categories: [...new Set(metas.map((m) => m.category))],
  questions: metas,
};
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
console.log(`📦 ${metas.length} سؤال → public/q (نسخة ${index.version})`);
