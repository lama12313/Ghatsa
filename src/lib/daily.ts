import { CONFIG } from '../config';
import type { QuestionMeta } from '../types';
import { hashString, mulberry32 } from './rng';

/**
 * خطة الصعوبة لكل يوم: من الأسهل للأصعب.
 * لو ما توفر سؤال بالصعوبة المطلوبة نختار أقرب صعوبة.
 */
const DIFFICULTY_PLAN = [1, 1, 2, 2, 2, 3, 3] as const;

export interface ScheduleOptions {
  perDay?: number;
  noRepeatDays?: number;
  seed?: string;
}

/**
 * يبني جدول الأسئلة يوم بيوم من أول يوم للعبة. الخوارزمية ثابتة تماماً
 * (ما تعتمد على الجهاز)، فكل اللاعبين يطلع لهم نفس الأسئلة طالما نفس المحتوى.
 */
export class DailyScheduler {
  private readonly questions: QuestionMeta[];
  private readonly perDay: number;
  private readonly noRepeat: number;
  private readonly seed: number;
  private readonly days: string[][] = [];
  private readonly lastUsed = new Map<string, number>();
  private readonly lastCategoryUse = new Map<string, number>();

  constructor(questions: readonly QuestionMeta[], opts: ScheduleOptions = {}) {
    // نرتب حسب id عشان ترتيب الملفات ما يأثر على النتيجة
    this.questions = [...questions].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    this.perDay = opts.perDay ?? CONFIG.questionsPerDay;
    this.noRepeat = opts.noRepeatDays ?? CONFIG.noRepeatDays;
    this.seed = hashString(opts.seed ?? 'ghatsa');
    if (this.questions.length < this.perDay) throw new Error('عدد الأسئلة أقل من أسئلة اليوم');
  }

  forDay(day: number): string[] {
    if (day < 0) day = 0;
    while (this.days.length <= day) this.days.push(this.buildDay(this.days.length));
    return this.days[day];
  }

  private buildDay(day: number): string[] {
    const rand = mulberry32(this.seed ^ Math.imul(day + 1, 0x9e3779b1));
    // نسمح بالأسئلة اللي ما انستخدمت خلال فترة المنع
    let window = this.noRepeat;
    let eligible: QuestionMeta[] = [];
    while (window >= 0) {
      eligible = this.questions.filter((q) => {
        const last = this.lastUsed.get(q.id);
        return last === undefined || day - last > window;
      });
      if (eligible.length >= this.perDay) break;
      window--; // المحتوى قليل: نخفف الشرط بدل ما نوقف
    }

    // الأولوية: الأقدم استخداماً، وبعدها عشوائي ثابت
    const scored = eligible.map((q) => ({ q, age: day - (this.lastUsed.get(q.id) ?? -100000), r: rand() }));

    const picked: QuestionMeta[] = [];
    const usedCats = new Set<string>();
    const plan = this.perDay === DIFFICULTY_PLAN.length ? DIFFICULTY_PLAN : null;

    for (let slot = 0; slot < this.perDay; slot++) {
      const want = plan ? plan[slot] : 0;
      let bestScore = -Infinity;
      let best: (typeof scored)[number] | null = null;
      for (const c of scored) {
        if (picked.includes(c.q)) continue;
        let score = Math.min(c.age, 1000) / 10 + c.r * 8;
        if (usedCats.has(c.q.category)) score -= 500; // تصنيف واحد باليوم إن أمكن
        const catAge = day - (this.lastCategoryUse.get(c.q.category) ?? -1000);
        score += Math.min(catAge, 10) * 2; // نعطي التصنيفات اللي غابت فرصة
        if (want) score -= Math.abs(c.q.difficulty - want) * 40;
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (!best) break;
      picked.push(best.q);
      usedCats.add(best.q.category);
    }

    for (const q of picked) {
      this.lastUsed.set(q.id, day);
      this.lastCategoryUse.set(q.category, day);
    }
    return picked.map((q) => q.id);
  }
}
