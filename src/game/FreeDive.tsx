import type { ContentIndex } from '../types';

export function FreeDive({ index }: { index: ContentIndex }) {
  return <p className="card text-center">قريباً ({index.questions.length} سؤال)</p>;
}
