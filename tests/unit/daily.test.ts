import { describe, expect, it } from 'vitest';
import { DailyScheduler } from '../../src/lib/daily';
import { dayIndex, formatCountdown, nextResetAt } from '../../src/lib/date';
import type { Difficulty, QuestionMeta } from '../../src/types';

function makeQuestions(n: number, cats = 12): QuestionMeta[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${String(i).padStart(4, '0')}`,
    category: `cat-${i % cats}`,
    prompt: `سؤال ${i}`,
    difficulty: ((i % 3) + 1) as Difficulty,
    file: `${i}.bin`,
  }));
}

describe('DailyScheduler', () => {
  const qs = makeQuestions(300);

  it('ثابت: نفس اليوم يعطي نفس الأسئلة دايماً وبأي ترتيب للمحتوى', () => {
    const a = new DailyScheduler(qs).forDay(57);
    const b = new DailyScheduler([...qs].reverse()).forDay(57);
    expect(a).toEqual(b);
    expect(a).toHaveLength(7);
  });

  it('ما يتكرر سؤال داخل نفس اليوم', () => {
    const s = new DailyScheduler(qs);
    for (let d = 0; d < 100; d++) expect(new Set(s.forDay(d)).size).toBe(7);
  });

  it('ما يتكرر سؤال قبل ٤٠ يوم', () => {
    const s = new DailyScheduler(qs, { noRepeatDays: 40 });
    const last = new Map<string, number>();
    for (let d = 0; d < 400; d++) {
      for (const id of s.forDay(d)) {
        const prev = last.get(id);
        if (prev !== undefined) expect(d - prev).toBeGreaterThan(40);
        last.set(id, d);
      }
    }
  });

  it('مع ٩٠٠ سؤال يتحقق شرط ٩٠ يوم', () => {
    const s = new DailyScheduler(makeQuestions(900), { noRepeatDays: 90 });
    const last = new Map<string, number>();
    for (let d = 0; d < 300; d++) {
      for (const id of s.forDay(d)) {
        const prev = last.get(id);
        if (prev !== undefined) expect(d - prev).toBeGreaterThan(90);
        last.set(id, d);
      }
    }
  });

  it('يوزع التصنيفات: ما يتكرر تصنيف في نفس اليوم لما يكون فيه تصنيفات كافية', () => {
    const s = new DailyScheduler(qs);
    const byId = new Map(qs.map((q) => [q.id, q]));
    for (let d = 0; d < 60; d++) {
      const cats = s.forDay(d).map((id) => byId.get(id)!.category);
      expect(new Set(cats).size).toBe(7);
    }
  });

  it('يوازن الصعوبة: فيه سهل وصعب كل يوم', () => {
    const s = new DailyScheduler(qs);
    const byId = new Map(qs.map((q) => [q.id, q]));
    for (let d = 0; d < 60; d++) {
      const diffs = s.forDay(d).map((id) => byId.get(id)!.difficulty);
      expect(diffs).toContain(1);
      expect(diffs).toContain(3);
    }
  });

  it('يكمل حتى لو المحتوى قليل', () => {
    const s = new DailyScheduler(makeQuestions(10, 3));
    for (let d = 0; d < 20; d++) expect(new Set(s.forDay(d)).size).toBe(7);
  });

  it('أيام مختلفة تعطي أسئلة مختلفة', () => {
    const s = new DailyScheduler(qs);
    expect(s.forDay(1)).not.toEqual(s.forDay(2));
  });
});

describe('التاريخ بتوقيت الرياض', () => {
  it('اليوم يتغير الساعة ١٢ بالليل بتوقيت الرياض (٩ مساءً UTC)', () => {
    const before = Date.UTC(2026, 9, 12, 20, 59, 59); // 11:59:59 م الرياض
    const after = Date.UTC(2026, 9, 12, 21, 0, 0); // 12:00 ص الرياض
    expect(dayIndex(after)).toBe(dayIndex(before) + 1);
  });
  it('أول يوم = ٠', () => {
    expect(dayIndex(Date.UTC(2026, 9, 11, 21, 0, 0))).toBe(0);
  });
  it('العداد التنازلي', () => {
    const t = Date.UTC(2026, 9, 12, 20, 0, 0);
    expect(nextResetAt(t) - t).toBe(3600_000);
    expect(formatCountdown(3661_000)).toBe('٠١:٠١:٠١');
  });
});
