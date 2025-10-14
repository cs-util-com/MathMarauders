export function createSeededRng(seed) {
  const normalized = typeof seed === 'string' ? stringToNumber(seed) : seed;
  let state = normalized >>> 0;
  if (state === 0) {
    state = 0x6d2b79f5;
  }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToNumber(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Keep it 32-bit
  }
  return Math.abs(hash) || 0x6d2b79f5;
}
