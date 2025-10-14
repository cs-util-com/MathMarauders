import { createSeededRng } from './random.js';

export const MAX_ARMY = 9999;

const SINGLE_STEP_TEMPLATES = [
  {
    segments: [{ type: 'add', range: [5, 25], precision: 0 }],
    tone: 'positive',
  },
  {
    segments: [{ type: 'subtract', range: [4, 18], precision: 0 }],
    tone: 'negative',
  },
  {
    segments: [{ type: 'multiply', range: [1.2, 1.8], precision: 1 }],
    tone: 'boost',
  },
  {
    segments: [{ type: 'divide', range: [1.2, 2.1], precision: 1 }],
    tone: 'hazard',
  },
];

const TWO_STEP_TEMPLATES = [
  {
    segments: [
      { type: 'multiply', range: [1.3, 1.7], precision: 1 },
      { type: 'subtract', range: [4, 10], precision: 0 },
    ],
    tone: 'boost',
  },
  {
    segments: [
      { type: 'add', range: [6, 18], precision: 0 },
      { type: 'multiply', range: [1.2, 1.5], precision: 1 },
    ],
    tone: 'positive',
  },
  {
    segments: [
      { type: 'subtract', range: [4, 12], precision: 0 },
      { type: 'multiply', range: [1.3, 1.6], precision: 1 },
    ],
    tone: 'negative',
  },
  {
    segments: [
      { type: 'multiply', range: [1.4, 1.9], precision: 1 },
      { type: 'divide', range: [1.3, 1.6], precision: 1 },
    ],
    tone: 'hazard',
  },
];

const OPERATOR_METADATA = {
  add: { symbol: '+', color: 'positive' },
  subtract: { symbol: '−', color: 'negative' },
  multiply: { symbol: '×', color: 'boost' },
  divide: { symbol: '÷', color: 'hazard' },
};

let gateIdCounter = 0;

export function generateGateSet({ wave, baseCount, seed }) {
  const rng = typeof seed === 'function' ? seed : createSeededRng(seed);
  const templatePool =
    wave <= 5
      ? SINGLE_STEP_TEMPLATES
      : [...SINGLE_STEP_TEMPLATES, ...TWO_STEP_TEMPLATES];
  const options = [];
  while (options.length < 2) {
    const template = templatePool[Math.floor(rng() * templatePool.length)];
    const gate = instantiateGate(template, rng);
    if (!options.some((option) => areGatesEquivalent(option, gate))) {
      options.push(gate);
    }
  }

  ensureMeaningfulDifference(options, baseCount, rng);

  return {
    id: `gate-${wave}-${(gateIdCounter += 1)}`,
    options,
  };
}

function instantiateGate(template, rng) {
  const segments = template.segments.map((segment) => ({
    type: segment.type,
    value: generateValue(segment, rng),
  }));

  const preview = createPreview(segments);
  return {
    id: `option-${Math.floor(rng() * 1_000_000)}`,
    segments,
    label: preview.label,
    dominantTone: determineDominantTone(template, segments),
    description: preview.description,
  };
}

function createPreview(segments) {
  const label = segments
    .map((segment) => {
      const { symbol } = OPERATOR_METADATA[segment.type];
      return `${symbol}${formatValue(segment.value, segment.type)}`;
    })
    .join(' ');

  const description = segments
    .map(
      (segment) =>
        `${wordForOperator(segment.type)} ${formatValue(segment.value, segment.type)}`
    )
    .join(', then ');

  return { label, description };
}

function determineDominantTone(template, segments) {
  if (template.tone) {
    return template.tone;
  }
  const last = segments[segments.length - 1];
  return OPERATOR_METADATA[last.type].color;
}

function wordForOperator(type) {
  switch (type) {
    case 'add':
      return 'add';
    case 'subtract':
      return 'subtract';
    case 'multiply':
      return 'multiply by';
    case 'divide':
      return 'divide by';
    default:
      return type;
  }
}

function generateValue(segment, rng) {
  const [min, max] = segment.range;
  const raw = min + (max - min) * rng();
  if (segment.type === 'add' || segment.type === 'subtract') {
    return Math.round(raw);
  }
  const factor = 10 ** (segment.precision ?? 1);
  return Math.round(raw * factor) / factor;
}

function ensureMeaningfulDifference(options, baseCount, rng) {
  const targetRatio = 0.15;
  const [first, second] = options;
  const firstOutcome = projectGateOutcome(baseCount, first).ratio;
  let secondOutcome = projectGateOutcome(baseCount, second).ratio;
  let tries = 0;
  while (Math.abs(firstOutcome - secondOutcome) < targetRatio && tries < 5) {
    options[1] = instantiateGate(randomTemplateLike(second), rng);
    secondOutcome = projectGateOutcome(baseCount, options[1]).ratio;
    tries += 1;
  }
}

function randomTemplateLike(gate) {
  const dominantType = gate.segments[0].type;
  if (gate.segments.length === 1) {
    return (
      SINGLE_STEP_TEMPLATES.find(
        (template) => template.segments[0].type === dominantType
      ) ?? SINGLE_STEP_TEMPLATES[0]
    );
  }
  return (
    TWO_STEP_TEMPLATES.find(
      (template) => template.segments[0].type === dominantType
    ) ?? TWO_STEP_TEMPLATES[0]
  );
}

function areGatesEquivalent(a, b) {
  if (a.segments.length !== b.segments.length) {
    return false;
  }
  return a.segments.every((segment, index) => {
    const other = b.segments[index];
    return (
      segment.type === other.type &&
      Math.abs(segment.value - other.value) < 0.01
    );
  });
}

export function projectGateOutcome(baseCount, gate) {
  const raw = gate.segments.reduce(
    (acc, segment) => applySegment(acc, segment),
    baseCount
  );
  const adjusted = clampArmy(raw, gate.segments);
  const delta = adjusted - baseCount;
  const ratio = baseCount === 0 ? 1 : adjusted / baseCount;
  return { raw, adjusted, delta, ratio };
}

export function applyGate(baseCount, gate) {
  const outcome = projectGateOutcome(baseCount, gate);
  return {
    newCount: outcome.adjusted,
    delta: outcome.delta,
  };
}

function applySegment(value, segment) {
  switch (segment.type) {
    case 'add':
      return value + segment.value;
    case 'subtract':
      return value - segment.value;
    case 'multiply':
      return value * segment.value;
    case 'divide':
      return value / segment.value;
    default:
      return value;
  }
}

function clampArmy(value, segments) {
  const hasMultiplicative = segments.some(
    (segment) => segment.type === 'multiply' || segment.type === 'divide'
  );
  let result = value;
  if (hasMultiplicative) {
    result = Math.round(result);
    result = Math.max(1, result);
  } else {
    result = Math.max(0, result);
  }
  return Math.min(MAX_ARMY, result);
}

function formatValue(value, type) {
  if (type === 'multiply' || type === 'divide') {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}
