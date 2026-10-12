import { describe, expect, it } from 'vitest';
import { AnswerMatcher, levenshtein, tolerance } from '../../src/lib/match';
import type { ContentAnswer } from '../../src/types';

const a = (text: string, aliases: string[] = []): ContentAnswer => ({ text, aliases, baseRarity: 0.01 });

const countries: ContentAnswer[] = [
  a('مصر', ['جمهورية مصر العربية']),
  a('المغرب'),
  a('الجزائر'),
  a('إثيوبيا', ['الحبشة']),
  a('إريتريا', ['ارتيريا']),
  a('ساحل العاج', ['كوت ديفوار']),
  a('جمهورية الكونغو', ['الكونغو']),
  a('جمهورية الكونغو الديمقراطية', ['زائير']),
  a('غينيا'),
  a('غينيا بيساو'),
  a('غينيا الاستوائية'),
  a('النيجر'),
  a('نيجيريا'),
  a('مالي'),
  a('ملاوي'),
  a('موريتانيا'),
  a('موريشيوس'),
  a('ساو تومي وبرينسيب'),
  a('سيراليون'),
  a('سريلانكا', ['سيلان']),
  a('إسواتيني', ['سوازيلاند']),
  a('النمسا'),
  a('النرويج'),
];

const names: ContentAnswer[] = [
  a('عبدالله'),
  a('عبدالرحمن'),
  a('فاطمة'),
  a('مصطفى'),
  a('إبراهيم'),
  a('عائشة'),
];

const m = new AnswerMatcher(countries);
const n = new AnswerMatcher(names);
const text = (matcher: AnswerMatcher, list: ContentAnswer[], input: string) => {
  const r = matcher.match(input);
  return r ? list[r.index].text : null;
};

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['abc', 'abc', 0],
    ['abc', 'abd', 1],
    ['abc', 'ab', 1],
    ['kitten', 'sitting', 3],
    ['مصر', 'مصرر', 1],
  ] as const)('%s ↔ %s = %d', (x, y, d) => {
    expect(levenshtein(x, y)).toBe(d);
  });
  it('يوقف بدري لما يتجاوز الحد', () => {
    expect(levenshtein('abcdefgh', 'zzzzzzzz', 2)).toBeGreaterThan(2);
  });
});

describe('tolerance', () => {
  it.each([
    [3, 0],
    [4, 0],
    [5, 1],
    [8, 1],
    [9, 2],
    [15, 2],
  ])('طول %d ← %d', (len, tol) => expect(tolerance(len)).toBe(tol));
});

describe('AnswerMatcher: تطابق مباشر', () => {
  it.each([
    ['مصر', 'مصر'],
    ['مِصْر', 'مصر'],
    ['المغرب', 'المغرب'],
    ['مغرب', 'المغرب'],
    ['الجزائر', 'الجزائر'],
    ['جزائر', 'الجزائر'],
    ['اثيوبيا', 'إثيوبيا'],
    ['أثيوبيا', 'إثيوبيا'],
    ['الحبشة', 'إثيوبيا'],
    ['الحبشه', 'إثيوبيا'],
    ['ارتيريا', 'إريتريا'],
    ['اريتريا', 'إريتريا'],
    ['كوت ديفوار', 'ساحل العاج'],
    ['كوتديفوار', 'ساحل العاج'],
    ['ساحل العاج', 'ساحل العاج'],
    ['الكونغو', 'جمهورية الكونغو'],
    ['زائير', 'جمهورية الكونغو الديمقراطية'],
    ['غينيا', 'غينيا'],
    ['غينيا بيساو', 'غينيا بيساو'],
    ['غينيا الإستوائية', 'غينيا الاستوائية'],
    ['النيجر', 'النيجر'],
    ['نيجيريا', 'نيجيريا'],
    ['سيلان', 'سريلانكا'],
    ['سوازيلاند', 'إسواتيني'],
    ['ساو تومي و برينسيب', 'ساو تومي وبرينسيب'],
    ['جمهورية مصر العربية', 'مصر'],
  ])('«%s» ← %s', (input, expected) => {
    expect(text(m, countries, input)).toBe(expected);
  });

  it.each([
    ['عبد الله', 'عبدالله'],
    ['عبدالله', 'عبدالله'],
    ['عبد الرحمن', 'عبدالرحمن'],
    ['فاطمه', 'فاطمة'],
    ['مصطفي', 'مصطفى'],
    ['ابراهيم', 'إبراهيم'],
    ['عايشة', 'عائشة'],
    ['عائشه', 'عائشة'],
  ])('أسماء: «%s» ← %s', (input, expected) => {
    expect(text(n, names, input)).toBe(expected);
  });
});

describe('AnswerMatcher: تسامح إملائي', () => {
  it.each([
    ['موريتانا', 'موريتانيا'], // حرف ناقص (٩ أحرف → ٢)
    ['موريطانيا', 'موريتانيا'],
    ['نيجيرا', 'نيجيريا'], // ٧ أحرف → ١
    ['سيراليوون', 'سيراليون'],
    ['ابراهييم', 'إبراهيم'],
    ['اسواتينى', 'إسواتيني'],
    ['ساو تومي وبرنسيب', 'ساو تومي وبرينسيب'],
    ['الجزاير', 'الجزائر'],
    ['ارتريا', 'إريتريا'],
  ])('«%s» ← %s', (input, expected) => {
    expect(text(m, countries, input) ?? text(n, names, input)).toBe(expected);
  });

  it('ما يسامح في الكلمات القصيرة (أقل من ٥ أحرف)', () => {
    expect(m.match('مصرا')).toBeNull();
    expect(m.match('مالو')).toBeNull();
  });

  it('ما يقبل خطأين في كلمة من ٥-٨ أحرف', () => {
    expect(m.match('نجيرا')).toBeNull();
  });

  it('يرفض الإدخال الغامض اللي قريب من جوابين بنفس المسافة', () => {
    // «موريشيا» قريبة من موريشيوس وموريتانيا؟ نتأكد إنها ما تروح لجواب غلط
    const r = m.match('غينيا بيساوو');
    expect(r && countries[r.index].text).toBe('غينيا بيساو');
    const amb = new AnswerMatcher([a('سلوفاكيا'), a('سلوفانيا')]);
    expect(amb.match('سلوفايا')).toBeNull();
  });

  it('يفضّل الجواب الأقرب', () => {
    expect(text(m, countries, 'موريشيس')).toBe('موريشيوس');
    expect(text(m, countries, 'النرويح')).toBe('النرويج');
  });
});

describe('AnswerMatcher: رفض', () => {
  it.each(['فرنسا', 'اليابان', '', '   ', 'xyz', '١٢٣', 'مصريين جدا'])('«%s» مرفوض', (input) => {
    expect(m.match(input)).toBeNull();
  });

  it('وضع المطابقة الحرفية يرفض التصحيح الإملائي', () => {
    const words = [a('نظارة'), a('ظلام')];
    const strict = new AnswerMatcher(words, { exact: true });
    expect(strict.match('نضارة')).toBeNull();
    expect(strict.match('النظارة')).not.toBeNull();
    expect(new AnswerMatcher(words).match('نضارة')).not.toBeNull();
  });

  it('الأرقام ما فيها تسامح إملائي', () => {
    const nums = new AnswerMatcher([a('10000'), a('12345')]);
    expect(nums.match('10001')).toBeNull();
    expect(nums.match('١٠٠٠٠')).not.toBeNull();
  });

  it('يبين إذا كان التطابق تقريبي', () => {
    expect(m.match('مصر')?.fuzzy).toBe(false);
    expect(m.match('موريتانا')?.fuzzy).toBe(true);
  });
});
