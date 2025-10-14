export function normalizeSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed)).toString();
  }

  if (typeof seed === 'string' && seed.trim()) {
    return seed.trim();
  }

  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

export function createSeededRng(seedInput) {
  const seed = normalizeSeed(seedInput);
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;

  return function rng() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(array, rng) {
  if (!Array.isArray(array) || array.length === 0) {
    throw new Error('pick requires a non-empty array');
  }

  const index = Math.floor(rng() * array.length);
  return array[index];
}
