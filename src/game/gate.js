const OPERATION_CONFIG = {
  add: { color: '#33d6a6', symbol: '+' },
  subtract: { color: '#ff5fa2', symbol: '−' },
  multiply: { color: '#ffd166', symbol: '×' },
  divide: { color: '#00d1ff', symbol: '÷' },
};

const MAX_ARMY = 9999;
const MIN_SUBTRACT_RESULT = 1;
const COMPOSITE_UNLOCK_WAVE = 6;
const ADVANCED_COMPOSITE_WAVE = 11;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(rng, min, max) {
  const floorMin = Math.ceil(min);
  const floorMax = Math.floor(max);
  if (floorMax <= floorMin) {
    return floorMin;
  }
  const sample = rng();
  const clamped = sample >= 1 ? 0.999999 : sample;
  return floorMin + Math.floor(clamped * (floorMax - floorMin + 1));
}

function pickFrom(list, rng) {
  if (!list.length) {
    return null;
  }
  const index = Math.floor(rng() * list.length) % list.length;
  return list[index];
}

function finalizeResult(value, requiresMinOne) {
  if (!Number.isFinite(value)) {
    return requiresMinOne ? 1 : 0;
  }
  const rounded = Math.round(value);
  const min = requiresMinOne ? 1 : 0;
  return clamp(rounded, min, MAX_ARMY);
}

function normalizeSteps(gate) {
  if (!gate) {
    return [];
  }
  if (Array.isArray(gate.steps) && gate.steps.length) {
    return gate.steps;
  }
  if (gate.type && typeof gate.value === 'number') {
    return [{ type: gate.type, value: gate.value }];
  }
  return [];
}

function applySteps(count, steps) {
  let value = count;
  let requiresMinOne = false;

  for (const step of steps) {
    switch (step.type) {
      case 'add':
        value += step.value;
        break;
      case 'subtract':
        value -= step.value;
        break;
      case 'multiply':
        requiresMinOne = true;
        value *= step.value;
        break;
      case 'divide': {
        requiresMinOne = true;
        const divisor = step.value <= 0 ? 1 : step.value;
        value /= divisor;
        break;
      }
      default:
        break;
    }
  }

  return finalizeResult(value, requiresMinOne);
}

export function applyGate(count, gate) {
  const steps = normalizeSteps(gate);
  if (!steps.length) {
    return clamp(count, 0, MAX_ARMY);
  }
  return applySteps(count, steps);
}

function hasComposite(gates) {
  return gates.some((gate) => gate?.type === 'composite');
}

function makeAddStep({ rng, currentCount, ratio = 0.2, min = 3, max }) {
  const upper = max ?? Math.max(min, Math.round(currentCount * ratio));
  return { type: 'add', value: randomInt(rng, min, upper) };
}

function makeSubtractStep({ rng, currentCount, ratio = 0.3, min = 1 }) {
  const upper = Math.max(min, Math.round(currentCount * ratio));
  return { type: 'subtract', value: randomInt(rng, min, upper) };
}

function makeMultiplyStep({
  rng,
  wave,
  min = 2,
  max = Math.min(4, 2 + Math.floor(wave / 3)),
}) {
  const upper = Math.max(min, max);
  return { type: 'multiply', value: randomInt(rng, min, upper) };
}

function makeDivideStep({ rng, currentCount }) {
  const upper = Math.max(2, Math.min(5, Math.floor(currentCount / 2) || 2));
  return { type: 'divide', value: randomInt(rng, 2, upper) };
}

function labelFromSteps(steps) {
  return steps
    .map((step) => `${OPERATION_CONFIG[step.type]?.symbol ?? ''}${step.value}`)
    .join('');
}

function createSingleStepGate({ type, value }) {
  const config = OPERATION_CONFIG[type];
  return {
    type,
    value,
    steps: [{ type, value }],
    color: config?.color ?? '#ffffff',
    label: `${config?.symbol ?? ''}${value}`,
  };
}

function createAddGate({ rng, currentCount, wave }) {
  const maxGain = Math.max(4, Math.round(currentCount * (0.22 + wave * 0.01)));
  const value = randomInt(rng, 3, maxGain);
  return createSingleStepGate({ type: 'add', value });
}

function createSubtractGate({ rng, currentCount }) {
  if (currentCount <= MIN_SUBTRACT_RESULT) {
    return null;
  }
  const maxLoss = Math.max(1, currentCount - MIN_SUBTRACT_RESULT);
  const value = randomInt(rng, 1, Math.max(1, Math.round(maxLoss * 0.6)));
  const gate = createSingleStepGate({ type: 'subtract', value });
  const outcome = applyGate(currentCount, gate);
  return outcome < MIN_SUBTRACT_RESULT ? null : gate;
}

function createMultiplyGate({ rng, wave }) {
  const maxMultiplier = Math.min(4, 2 + Math.floor(wave / 3));
  const value = randomInt(rng, 2, Math.max(2, maxMultiplier));
  return createSingleStepGate({ type: 'multiply', value });
}

function createDivideGate({ rng, currentCount }) {
  const maxDivisor = Math.max(
    2,
    Math.min(5, Math.floor(currentCount / 2) || 2)
  );
  if (maxDivisor < 2) {
    return null;
  }
  const value = randomInt(rng, 2, maxDivisor);
  const gate = createSingleStepGate({ type: 'divide', value });
  const outcome = applyGate(currentCount, gate);
  return outcome < 1 ? null : gate;
}

function buildCompositeGate(steps, label = labelFromSteps(steps)) {
  const primary = steps[0]?.type ?? 'add';
  return {
    type: 'composite',
    steps,
    label,
    color: OPERATION_CONFIG[primary]?.color ?? '#ffffff',
  };
}

function ensureValidComposite({ gate, currentCount }) {
  if (!gate) {
    return null;
  }
  const result = applyGate(currentCount, gate);
  const hasSubtract = gate.steps.some((step) => step.type === 'subtract');
  if (hasSubtract && result < MIN_SUBTRACT_RESULT) {
    return null;
  }
  const hasDivide = gate.steps.some((step) => step.type === 'divide');
  if (hasDivide) {
    const invalidDivisor = gate.steps.some(
      (step) => step.type === 'divide' && step.value < 1
    );
    if (invalidDivisor || result < 1) {
      return null;
    }
  }
  return gate;
}

function compositeTemplates(ctx) {
  const base = [
    {
      key: 'mul-sub',
      build() {
        return [
          makeMultiplyStep(ctx),
          makeSubtractStep({
            rng: ctx.rng,
            currentCount: ctx.currentCount,
            ratio: 0.25,
          }),
        ];
      },
    },
    {
      key: 'div-add',
      build() {
        return [
          makeDivideStep(ctx),
          makeAddStep({
            rng: ctx.rng,
            currentCount: ctx.currentCount,
            ratio: 0.22,
          }),
        ];
      },
    },
    {
      key: 'add-mul',
      build() {
        const addStep = makeAddStep({
          rng: ctx.rng,
          currentCount: ctx.currentCount,
          ratio: 0.18,
        });
        const multiplyStep = makeMultiplyStep({
          rng: ctx.rng,
          wave: ctx.wave,
          min: 2,
          max: Math.min(3, 1 + Math.floor(ctx.wave / 4)),
        });
        return [addStep, multiplyStep];
      },
    },
  ];

  if (ctx.wave < ADVANCED_COMPOSITE_WAVE) {
    return base;
  }

  return [
    ...base,
    {
      key: 'mul-sub-add',
      build() {
        return [
          makeMultiplyStep(ctx),
          makeSubtractStep({
            rng: ctx.rng,
            currentCount: ctx.currentCount,
            ratio: 0.2,
          }),
          makeAddStep({
            rng: ctx.rng,
            currentCount: ctx.currentCount,
            ratio: 0.15,
            min: 2,
          }),
        ];
      },
    },
  ];
}

function createCompositeGate(ctx) {
  const templates = compositeTemplates(ctx);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const template = pickFrom(templates, ctx.rng);
    if (!template) {
      continue;
    }
    const steps = template.build();
    const gate = buildCompositeGate(steps);
    const valid = ensureValidComposite({
      gate,
      currentCount: ctx.currentCount,
    });
    if (valid) {
      return valid;
    }
  }
  return null;
}

function pickSingleStepGate({ rng, wave, currentCount }) {
  const factories = [
    () => createAddGate({ rng, currentCount, wave }),
    () => createSubtractGate({ rng, currentCount }),
    () => createMultiplyGate({ rng, wave }),
    () => createDivideGate({ rng, currentCount }),
  ];

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const factory = pickFrom(factories, rng);
    if (!factory) {
      continue;
    }
    const gate = factory();
    if (!gate) {
      continue;
    }
    const result = applyGate(currentCount, gate);
    if (gate.type === 'subtract' && result < MIN_SUBTRACT_RESULT) {
      continue;
    }
    if (gate.type === 'divide' && (gate.value < 1 || result < 1)) {
      continue;
    }
    return gate;
  }

  return createAddGate({ rng, currentCount, wave });
}

function pickGate({ rng, wave, currentCount, forceComposite = false }) {
  if (wave >= COMPOSITE_UNLOCK_WAVE) {
    if (forceComposite) {
      return (
        createCompositeGate({ rng, wave, currentCount }) ??
        pickSingleStepGate({ rng, wave, currentCount })
      );
    }
    if (rng() < 0.5) {
      const composite = createCompositeGate({ rng, wave, currentCount });
      if (composite) {
        return composite;
      }
    }
  }
  return pickSingleStepGate({ rng, wave, currentCount });
}

function populateGatePair({ rng, wave, currentCount }) {
  const pair = [];
  let attempts = 0;

  while (pair.length < 2 && attempts < 16) {
    const candidate = pickGate({
      rng,
      wave,
      currentCount,
      forceComposite:
        wave >= COMPOSITE_UNLOCK_WAVE &&
        pair.length === 1 &&
        !hasComposite(pair),
    });
    attempts += 1;
    if (!candidate) {
      continue;
    }
    const label = formatGateLabel(candidate);
    const duplicate = pair.some((gate) => formatGateLabel(gate) === label);
    if (duplicate) {
      continue;
    }
    pair.push(candidate);
  }

  while (pair.length < 2) {
    pair.push(createAddGate({ rng, currentCount, wave }));
  }

  if (wave >= COMPOSITE_UNLOCK_WAVE && !hasComposite(pair)) {
    const composite = pickGate({
      rng,
      wave,
      currentCount,
      forceComposite: true,
    });
    if (composite) {
      pair[pair.length - 1] = composite;
    }
  }

  return pair;
}

function gateDelta({ gates, currentCount }) {
  if (gates.length < 2) {
    return 0;
  }
  const [left, right] = gates;
  const leftResult = applyGate(currentCount, left);
  const rightResult = applyGate(currentCount, right);
  return Math.abs(leftResult - rightResult) / Math.max(1, currentCount);
}

function enforceDeltaThreshold({ rng, wave, currentCount, threshold, gates }) {
  const pair = [...gates];
  for (let adjust = 0; adjust < 24; adjust += 1) {
    if (gateDelta({ gates: pair, currentCount }) >= threshold) {
      return pair;
    }
    const projected = pair.map((gate) => applyGate(currentCount, gate));
    const replaceIndex = projected[0] > projected[1] ? 1 : 0;
    const candidate = pickGate({
      rng,
      wave,
      currentCount,
      forceComposite: wave >= COMPOSITE_UNLOCK_WAVE && !hasComposite(pair),
    });
    if (!candidate) {
      continue;
    }
    const label = formatGateLabel(candidate);
    const duplicate = pair.some(
      (gate, idx) => idx !== replaceIndex && formatGateLabel(gate) === label
    );
    if (duplicate) {
      continue;
    }
    pair[replaceIndex] = candidate;
  }
  return pair;
}

export function generateGateOptions({ rng, wave, currentCount }) {
  const threshold = wave < 6 ? 0.15 : wave < 11 ? 0.25 : 0.35;
  const initialPair = populateGatePair({ rng, wave, currentCount });
  return enforceDeltaThreshold({
    rng,
    wave,
    currentCount,
    threshold,
    gates: initialPair,
  });
}

export function formatGateLabel(gate) {
  if (!gate) {
    return '';
  }
  if (typeof gate.label === 'string') {
    return gate.label;
  }
  return labelFromSteps(normalizeSteps(gate));
}

export function getGateColor(gate) {
  if (!gate) {
    return '#ffffff';
  }
  if (gate.color) {
    return gate.color;
  }
  const primaryStep = normalizeSteps(gate)[0];
  return OPERATION_CONFIG[primaryStep?.type]?.color ?? '#ffffff';
}
