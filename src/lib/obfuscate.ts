import type { AnswerSet } from '../types';
import { hashString, mulberry32 } from './rng';

/**
 * تشفير بسيط (مو أمني): XOR بمفتاح مشتق من id السؤال ثم base64.
 * الهدف إن الأجوبة ما تبان كنص مقروء لو أحد فتح ملفات اللعبة.
 */
const SALT = 'غطسة-krill-v1';

function keystream(id: string, length: number): Uint8Array {
  const rand = mulberry32(hashString(SALT + id));
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * 256);
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** صيغة مضغوطة: [نص، [أسماء بديلة]، ندرة] */
type Packed = { s: number; a: [string, string[], number][] };

export function encodeAnswerSet(set: AnswerSet): string {
  const packed: Packed = {
    s: set.secretIndex,
    a: set.answers.map((a) => [a.text, a.aliases ?? [], a.baseRarity]),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(packed));
  const key = keystream(set.id, bytes.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i];
  return toBase64(bytes);
}

export function decodeAnswerSet(id: string, data: string): AnswerSet {
  const bytes = fromBase64(data.trim());
  const key = keystream(id, bytes.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i];
  const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed;
  return {
    id,
    secretIndex: packed.s,
    answers: packed.a.map(([text, aliases, baseRarity]) => ({ text, aliases, baseRarity })),
  };
}

/** اسم ملف ثابت ما يكشف id السؤال */
export function fileNameFor(id: string): string {
  return hashString(SALT + 'file' + id).toString(36) + hashString(id + SALT).toString(36) + '.bin';
}
