export interface SeededRng {
  seed: number;
  next: () => number;
  nextInt: (maxExclusive: number) => number;
  shuffle: <T>(values: readonly T[]) => T[];
}

function normalizeSeed(seed: number): number {
  const normalized = Math.floor(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}

export function makeSeed(input: number = Date.now()): number {
  return normalizeSeed(input);
}

export function createRng(seed: number): SeededRng {
  let state = normalizeSeed(seed);

  const next = (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (maxExclusive: number): number => {
    if (maxExclusive <= 0) {
      return 0;
    }
    return Math.floor(next() * maxExclusive);
  };

  const shuffle = <T>(values: readonly T[]): T[] => {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = nextInt(index + 1);
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  };

  return {
    seed: normalizeSeed(seed),
    next,
    nextInt,
    shuffle
  };
}
