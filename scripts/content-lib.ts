import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentQuestion } from '../src/types';

export const ROOT = join(import.meta.dirname, '..');
export const CONTENT_DIR = join(ROOT, 'content');

export interface ContentFile {
  file: string;
  questions: unknown[];
}

/** كل ملف في content/ يكون مصفوفة أسئلة أو سؤال واحد */
export function readContentFiles(): ContentFile[] {
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      const data: unknown = JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
      return { file, questions: Array.isArray(data) ? data : [data] };
    });
}

export function loadQuestions(): ContentQuestion[] {
  return readContentFiles().flatMap((f) => f.questions as ContentQuestion[]);
}
