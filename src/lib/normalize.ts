const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const PUNCT = /[^\p{L}\p{N}\s]/gu;

const CHAR_MAP: Record<string, string> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ٲ: 'ا',
  ٳ: 'ا',
  ؤ: 'و',
  ئ: 'ي',
  ى: 'ي',
  ی: 'ي',
  ي: 'ي',
  ة: 'ه',
  ۀ: 'ه',
  ک: 'ك',
  گ: 'ك',
  ڤ: 'ف',
  پ: 'ب',
  چ: 'ج',
  ء: '',
};

function mapDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.charCodeAt(0);
    return String((code >= 0x06f0 ? code - 0x06f0 : code - 0x0660) % 10);
  });
}

/** يشيل «ال» من بداية الكلمة، مع استثناء لفظ الجلالة عشان «عبد الله» = «عبدالله» */
function stripArticle(word: string): string {
  if (word === 'الله' || word === 'اله') return word;
  if (word.startsWith('ال') && word.length > 3) return word.slice(2);
  return word;
}

/**
 * تطبيع النص العربي للمقارنة: يشيل التشكيل والتطويل، ويوحّد الهمزات
 * والتاء المربوطة والألف المقصورة والأرقام، ويشيل «ال» والمسافات وعلامات الترقيم.
 */
export function normalize(input: string): string {
  let s = input.normalize('NFKC').toLowerCase();
  s = mapDigits(s);
  s = s.replace(DIACRITICS, '');
  s = s.replace(/[؀-ۿ]/g, (c) => CHAR_MAP[c] ?? c);
  s = s.replace(PUNCT, ' ');
  const words = s.split(/\s+/).filter(Boolean);
  // «عبد الرحمن» تنكتب كثير ملصوقة «عبدالرحمن»، فما نشيل «ال» بعد «عبد»
  return words.map((w, i) => (i > 0 && words[i - 1] === 'عبد' ? w : stripArticle(w))).join('');
}
