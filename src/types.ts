export type Difficulty = 1 | 2 | 3;

/** إدخال جواب واحد كما هو مخزّن في content/*.json */
export interface ContentAnswer {
  text: string;
  aliases?: string[];
  baseRarity: number;
}

/** سؤال كامل كما هو مخزّن في content/*.json */
export interface ContentQuestion {
  id: string;
  category: string;
  prompt: string;
  difficulty: Difficulty;
  answers: ContentAnswer[];
  secret: string;
  sources: string[];
}

/** بيانات السؤال بدون الأجوبة (تنحمل مع بداية اللعبة) */
export interface QuestionMeta {
  id: string;
  category: string;
  prompt: string;
  difficulty: Difficulty;
  /** اسم ملف الأجوبة المشفّر داخل q/ */
  file: string;
}

export interface ContentIndex {
  version: string;
  categories: string[];
  questions: QuestionMeta[];
}

/** أجوبة سؤال بعد فك التشفير */
export interface AnswerSet {
  id: string;
  answers: ContentAnswer[];
  secretIndex: number;
}

/** ٠ = ما فيه نقاط (خطأ أو تخطي أو انتهى الوقت) */
export type Tier = 0 | 1 | 2 | 3 | 4;
