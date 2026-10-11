/** غلاف آمن حول localStorage (ممكن يكون مقفل في التصفح الخاص) */
const PREFIX = 'ghatsa:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* التخزين ممتلئ أو مقفل: نكمل بدون حفظ */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* تجاهل */
  }
}
