import type { RollResult } from './types';

export const nowIso = (): string => new Date().toISOString();

export const createId = (prefix: string): string => {
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Date.now().toString(36)}_${bytes[0].toString(36)}${bytes[1].toString(36)}`;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const rollDice = (formula: string): RollResult => {
  const match = formula.trim().match(/^([1-9]\d*)d([1-9]\d*)([+-]\d+)?$/i);
  if (!match) {
    throw new Error(`rollDice invalid formula: ${formula}`);
  }
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;
  if (count > 100 || sides > 1000) {
    throw new Error(`rollDice formula too large: ${formula}`);
  }
  const dice = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = dice.reduce((sum, value) => sum + value, 0) + modifier;
  return { formula, total, dice, modifier };
};

export const extractJsonObject = (value: string): unknown => {
  const direct = value.trim();
  try {
    return JSON.parse(direct);
  } catch {
    const start = direct.indexOf('{');
    const end = direct.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(direct.slice(start, end + 1));
    }
    throw new Error('extractJsonObject failed to locate valid JSON');
  }
};
