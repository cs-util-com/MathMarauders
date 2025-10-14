import {
  applyGate,
  createGateOption,
  describeGate,
  evaluateGateQuality,
  generateGateDeck,
} from './gates.js';

const stubRng = () => 0.5;

describe('gates', () => {
  test('applyGate handles each operator with rounding and clamps', () => {
    // why this test matters: deterministic gate math underpins balance and tests downstream systems.
    const addGate = { op: 'add', value: 5 };
    const subGate = { op: 'sub', value: 40 };
    const mulGate = { op: 'mul', value: 1.3 };
    const divGate = { op: 'div', value: 3.2 };

    expect(applyGate(20, addGate)).toBe(25);
    expect(applyGate(20, subGate)).toBe(0);
    expect(applyGate(10, mulGate)).toBe(13);
    expect(applyGate(10, divGate)).toBe(3);
  });

  test('createGateOption encodes stage based risk/reward', () => {
    // why this test matters: UI needs consistent telemetry for progressive difficulty cues.
    const gate = createGateOption('mul', 2, stubRng);
    expect(gate.id).toBe('2-mul');
    expect(gate.symbol).toBe('×');
    expect(gate.description).toContain('×');
    expect(gate.risk).toBeGreaterThan(0.3);
    expect(gate.reward).toBeGreaterThan(0);
  });

  test('generateGateDeck is deterministic for a given seed', () => {
    // why this test matters: sharing seeds between players must produce identical gate layouts.
    const a = generateGateDeck({ stages: 2, seed: 'sync-seed' });
    const b = generateGateDeck({ stages: 2, seed: 'sync-seed' });
    expect(a).toEqual(b);
  });

  test('evaluateGateQuality averages qualities for HUD feedback', () => {
    // why this test matters: score screen references quality for player coaching cues.
    const quality = evaluateGateQuality([
      createGateOption('add', 0, stubRng),
      createGateOption('mul', 1, stubRng),
    ]);
    expect(quality).toBeGreaterThan(0);
    expect(evaluateGateQuality([])).toBe(0);
  });

  test('guards against invalid gates', () => {
    // why this test matters: protects against bad data in procedural generation.
    expect(() => applyGate(10, null)).toThrow('Gate is required');
    expect(() => createGateOption('pow', 0, stubRng)).toThrow(
      'Unknown gate op'
    );
    expect(describeGate(null)).toBe('');
    expect(describeGate({ op: 'pow', value: 2 })).toBe('');
  });

  test('clamps stage bias extremes', () => {
    // why this test matters: keeps generator stable for authored stage counts.
    const highClamp = createGateOption('mul', 8, () => 1);
    const lowClamp = createGateOption('sub', -5, () => 0);
    expect(highClamp.value).toBeGreaterThan(0);
    expect(lowClamp.value).toBeGreaterThanOrEqual(4);
  });
});
