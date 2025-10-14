const OPERATION_CONFIG = {
  add: { color: '#33d6a6' },
  subtract: { color: '#ff5fa2' },
  multiply: { color: '#ffd166' },
  divide: { color: '#00d1ff' },
};

const MAX_ARMY = 9999;

function clampUnits(value) {
  return Math.max(0, Math.min(MAX_ARMY, value));
}

export function applyGate(count, gate) {
  switch (gate.type) {
    case 'add':
      return clampUnits(Math.max(0, Math.round(count + gate.value)));
    case 'subtract':
      return clampUnits(Math.max(0, Math.round(count - gate.value)));
    case 'multiply': {
      const scaled = Math.round(count * gate.value);
      return Math.max(1, clampUnits(scaled));
    }
    case 'divide': {
      const divisor = gate.value <= 0 ? 1 : gate.value;
      const scaled = Math.round(count / divisor);
      return Math.max(1, clampUnits(scaled));
    }
    default:
      return count;
  }
}

function pickOperation(rng, currentCount) {
  const choices = ['add', 'subtract', 'multiply', 'divide'];
  const type = choices[Math.floor(rng() * choices.length)];
  switch (type) {
    case 'add': {
      const val = 3 + Math.round(rng() * 12);
      return {
        type,
        value: val,
        color: OPERATION_CONFIG.add.color,
        label: `+${val}`,
      };
    }
    case 'subtract': {
      const maxSubtract = Math.max(2, Math.round(currentCount * 0.45));
      const val = 2 + Math.round(rng() * Math.max(1, maxSubtract - 2));
      return {
        type,
        value: val,
        color: OPERATION_CONFIG.subtract.color,
        label: `−${val}`,
      };
    }
    case 'multiply': {
      const val = +(1.2 + rng() * 1.1).toFixed(2);
      return {
        type,
        value: val,
        color: OPERATION_CONFIG.multiply.color,
        label: `×${val}`,
      };
    }
    case 'divide': {
      const val = +(1.2 + rng() * 1.0).toFixed(2);
      return {
        type,
        value: val,
        color: OPERATION_CONFIG.divide.color,
        label: `÷${val}`,
      };
    }
    default:
      return {
        type: 'add',
        value: 5,
        color: OPERATION_CONFIG.add.color,
        label: '+5',
      };
  }
}

export function generateGateOptions({ rng, wave, currentCount }) {
  const gatePair = [];
  const threshold = wave < 6 ? 0.15 : wave < 11 ? 0.25 : 0.35;
  let attempts = 0;

  while (gatePair.length < 2 && attempts < 10) {
    const candidate = pickOperation(rng, currentCount);
    const already = gatePair.find(
      (gate) => gate.type === candidate.type && gate.value === candidate.value
    );
    if (already) {
      attempts += 1;
      continue;
    }
    gatePair.push(candidate);
  }

  while (attempts < 20) {
    const projected = gatePair.map((gate) => applyGate(currentCount, gate));
    const delta =
      Math.abs(projected[0] - projected[1]) / Math.max(1, currentCount);
    if (delta >= threshold) {
      return gatePair;
    }
    const replaceIndex = projected[0] > projected[1] ? 1 : 0;
    gatePair[replaceIndex] = pickOperation(rng, currentCount);
    attempts += 1;
  }

  return gatePair;
}

export function formatGateLabel(gate) {
  return gate.label;
}

export function getGateColor(gate) {
  return OPERATION_CONFIG[gate.type]?.color ?? '#ffffff';
}
