import type { ContentIndex } from '../types';

export function Practice({ index }: { index: ContentIndex }) {
  return <p className="card text-center">قريباً ({index.questions.length} سؤال)</p>;
}
