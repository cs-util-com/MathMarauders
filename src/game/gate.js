const OPERATION_CONFIG = {
  add: { color: '#33d6a6', symbol: '+' },
  subtract: { color: '#ff5fa2', symbol: '−' },
  multiply: { color: '#ffd166', symbol: '×' },
  divide: { color: '#00d1ff', symbol: '÷' },
};

const MAX_ARMY = 9999;
const MIN_SUBTRACT_RESULT = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function populateGatePair({ rng, wave, currentCount }) {
  const pair = [];
  let attempts = 0;

  while (pair.length < 2 && attempts < 12) {
    const candidate = pickGate({
      rng,
      wave,
      currentCount,
      forceComposite: wave >= 6 && pair.length === 1 && !hasComposite(pair),
    });
    attempts += 1;
    if (!candidate) {
      continue;
    }
    const candidateLabel = formatGateLabel(candidate);
    if (pair.some((gate) => formatGateLabel(gate) === candidateLabel)) {
      continue;
    }
    pair.push(candidate);
  }

  while (pair.length < 2) {
    pair.push(pickSingleStepGate({ rng, wave, currentCount }));
  }

  if (wave >= 6 && !hasComposite(pair)) {
    const composite = pickGate({ rng, wave, currentCount, forceComposite: true });
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
      forceComposite: wave >= 6 && !hasComposite(pair),
    });
    if (!candidate) {
      continue;
    }
    const label = formatGateLabel(candidate);
    const duplicate = pair.some((gate, idx) => idx !== replaceIndex && formatGateLabel(gate) === label);
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

function makeSubtractStep({ rng, currentCount, ratio }) {
  const upper = Math.max(1, Math.round(currentCount * ratio));
  return { type: 'subtract', value: randomInt(rng, 1, Math.max(1, upper)) };
}

function makeMultiplyStep({ rng, wave, min = 2, max = Math.min(4, 2 + Math.floor(wave / 3)) }) {
  const upper = Math.max(min, max);
  return { type: 'multiply', value: randomInt(rng, min, upper) };
}

function makeDivideStep({ rng, currentCount }) {
  const upper = Math.max(2, Math.min(5, Math.floor(currentCount / 2) || 2));
  return { type: 'divide', value: randomInt(rng, 2, upper) };
}

function createSingleStepGate({ type, value }) {
  const config = OPERATION_CONFIG[type];
  const label = `${config.symbol}${value}`;
  return {
    type,
    value,
    steps: [{ type, value }],
    color: config.color,
    label,
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
  if (outcome < MIN_SUBTRACT_RESULT) {
    return null;
  }
  return gate;
}

function createMultiplyGate({ rng, wave }) {
  const maxMultiplier = Math.min(4, 2 + Math.floor(wave / 3));
  const value = randomInt(rng, 2, Math.max(2, maxMultiplier));
  return createSingleStepGate({ type: 'multiply', value });
}

function createDivideGate({ rng, currentCount }) {
  const ratio = Math.min(0.5, 0.2 + wave * 0.02);
  const { value } = makeAddStep({ rng, currentCount, ratio, min: 3 });
  return createSingleStepGate({ type: 'add', value });
  const maxDivisor = Math.max(
    2,
    Math.min(5, Math.floor(currentCount / 2) || 2)
  );
  const value = randomInt(rng, 2, maxDivisor);
  return createSingleStepGate({ type: 'divide', value });
  const maxRatio = Math.min(0.6, (currentCount - MIN_SUBTRACT_RESULT) / Math.max(1, currentCount));
  const { value } = makeSubtractStep({ rng, currentCount, ratio: Math.max(0.1, maxRatio) });
  const gate = createSingleStepGate({ type: 'subtract', value });
  const primary = steps[0]?.type ?? 'add';
  return {
    type: 'composite',
    steps,
    color: OPERATION_CONFIG[primary]?.color ?? '#ffffff',
    label,
  };
}
  const { value } = makeMultiplyStep({ rng, wave });
  return createSingleStepGate({ type: 'multiply', value });
    return null;
  }
  const result = applyGate(currentCount, gate);
  const hasSubtract = gate.steps.some((step) => step.type === 'subtract');
  const hasDivide = gate.steps.some((step) => step.type === 'divide');
  if (hasSubtract && result < MIN_SUBTRACT_RESULT) {
  const { value } = makeDivideStep({ rng, currentCount });
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

function createCompositeGate({ rng, wave, currentCount }) {
  const baseTemplates = [
    {
      key: 'mul-sub',
      steps: () => [
        {
          type: 'multiply',
          value: randomInt(rng, 2, Math.min(4, 2 + Math.floor(wave / 3))),
        },
        {
          type: 'subtract',
          value: randomInt(
            rng,
            1,
            Math.max(2, Math.round(currentCount * 0.25))
          ),
        },
      ],
      label(steps) {
        return (
          `${OPERATION_CONFIG.multiply.symbol}${steps[0].value}` +
          `${OPERATION_CONFIG.subtract.symbol}${steps[1].value}`
        );
      },
    },
    {
      key: 'div-add',
      steps: () => [
        {
          type: 'divide',
          value: randomInt(
            rng,
            2,
            Math.max(2, Math.min(5, Math.floor(currentCount / 2) || 2))
          ),
        },
        {
          type: 'add',
          value: randomInt(
            rng,
            3,
            Math.max(4, Math.round(currentCount * 0.22))
          ),
        },
      ],
      label(steps) {
        return (
          `${OPERATION_CONFIG.divide.symbol}${steps[0].value}` +
          `${OPERATION_CONFIG.add.symbol}${steps[1].value}`
        );
      },
    },
    {
      key: 'add-mul',
      steps: () => [
        {
          type: 'add',
          value: randomInt(
            rng,
            3,
            Math.max(5, Math.round(currentCount * 0.18))
          ),
        },
        {
          type: 'multiply',
          value: randomInt(rng, 2, Math.min(3, 1 + Math.floor(wave / 4))),
        },
      ],
      label(steps) {
        return `(${OPERATION_CONFIG.add.symbol}${steps[0].value})${OPERATION_CONFIG.multiply.symbol}${steps[1].value}`;
      },
    },
  ];

  const advancedTemplates = [
    ...baseTemplates,
    {
      key: 'mul-sub-add',
      steps: () => [
        {
          type: 'multiply',
          value: randomInt(rng, 2, Math.min(4, 2 + Math.floor(wave / 3))),
        },
        {
          type: 'subtract',
          value: randomInt(rng, 1, Math.max(2, Math.round(currentCount * 0.2))),
        },
        {
          type: 'add',
          value: randomInt(
            rng,
            2,
            Math.max(4, Math.round(currentCount * 0.15))
          ),
        },
      ],
      label(steps) {
        return (
          `${OPERATION_CONFIG.multiply.symbol}${steps[0].value}` +
          `${OPERATION_CONFIG.subtract.symbol}${steps[1].value}` +
          `${OPERATION_CONFIG.add.symbol}${steps[2].value}`
        );
      },
    },
  ];

  const templatePool = wave >= 11 ? advancedTemplates : baseTemplates;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const template = pickFrom(templatePool, rng);
    const steps = template.steps();
    const gate = buildCompositeGate(steps, template.label(steps));
    const valid = ensureValidComposite({ gate, currentCount });
    if (valid) {
      return valid;
    }
  }
  return null;
}

function pickSingleStepGate({ rng, wave, currentCount }) {
  const factories = [
    () => createAddGate({ rng, wave, currentCount }),
    () => createSubtractGate({ rng, currentCount }),
    () => createMultiplyGate({ rng, wave }),
    () => createDivideGate({ rng, currentCount }),
  ];

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const factory = pickFrom(factories, rng);
    const gate = factory();
    if (!gate) {
      continue;
    }
    if (gate.type === 'subtract') {
      const result = applyGate(currentCount, gate);
      if (result < MIN_SUBTRACT_RESULT) {
        continue;
      }
    }
    if (gate.type === 'divide') {
      if (gate.value < 1 || applyGate(currentCount, gate) < 1) {
        continue;
      }
    }
    return gate;
  }
  return createAddGate({ rng, wave, currentCount });
}

function pickGate({ rng, wave, currentCount, forceComposite }) {
  if (wave >= 6 && forceComposite) {
    return (
      createCompositeGate({ rng, wave, currentCount }) ??
      pickSingleStepGate({ rng, wave, currentCount })
    );
  }
  if (wave >= 6 && rng() < 0.5) {
    const composite = createCompositeGate({ rng, wave, currentCount });
    if (composite) {
      return composite;
    }
  }
  function createCompositeGate({ rng, wave, currentCount }) {
    const ctx = { rng, wave, currentCount };

    const baseTemplates = [
      {
        key: 'mul-sub',
        build() {
          return [
            makeMultiplyStep(ctx),
            makeSubtractStep({ rng, currentCount, ratio: 0.25 }),
          ];
        },
        format: labelFromSteps,
      },
      {
        key: 'div-add',
        build() {
          return [makeDivideStep(ctx), makeAddStep({ rng, currentCount, ratio: 0.22 })];
        },
        format: labelFromSteps,
      },
      {
        key: 'add-mul',
        build() {
          const addStep = makeAddStep({ rng, currentCount, ratio: 0.18 });
          const multiplyStep = makeMultiplyStep({ rng, wave, min: 2, max: Math.min(3, 1 + Math.floor(wave / 4)) });
          return [addStep, multiplyStep];
        },
        format(steps) {
          const first = labelFromSteps([steps[0]]);
          const second = `${OPERATION_CONFIG.multiply.symbol}${steps[1].value}`;
          return `(${first})${second}`;
        },
      },
    ];

    const advancedTemplates = [
      ...baseTemplates,
      {
        key: 'mul-sub-add',
        build() {
          return [
            makeMultiplyStep(ctx),
            makeSubtractStep({ rng, currentCount, ratio: 0.2 }),
            makeAddStep({ rng, currentCount, ratio: 0.15, min: 2 }),
          ];
        },
        format: labelFromSteps,
      },
    ];

    const templatePool = wave >= 11 ? advancedTemplates : baseTemplates;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const template = pickFrom(templatePool, rng);
      const steps = template.build();
      const label = template.format(steps);
      const gate = buildCompositeGate(steps, label);
      const valid = ensureValidComposite({ gate, currentCount });
      if (valid) {
        return valid;
      }
    }
    return null;
  }
    );
    if (duplicate) {
      continue;
    }
    gatePair[replaceIndex] = candidate;
  }

  return gatePair;
}

export function formatGateLabel(gate) {
  if (!gate) {
    return '';
  }
  if (typeof gate.label === 'string') {
    return gate.label;
  }
  const steps = normalizeSteps(gate);
  return steps
    .map((step, index) => {
      const symbol = OPERATION_CONFIG[step.type]?.symbol ?? '';
      if (index === 0) {
        return `${symbol}${step.value}`;
      }
      return `${symbol}${step.value}`;
    })
    .join('');
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
