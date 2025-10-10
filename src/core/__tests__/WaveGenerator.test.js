import {WaveGenerator} from '../WaveGenerator.js';
import {BASE_FORWARD_GATE_COUNT, SKIRMISH_RATIO} from '../constants.js';

const generator = new WaveGenerator(42);

describe('WaveGenerator', () => {
  it('increments gate count per wave', () => {
    const wave1 = generator.generate(1, 50);
    const wave3 = generator.generate(3, 50);
    expect(wave1.gateCount).toBe(BASE_FORWARD_GATE_COUNT);
    expect(wave3.gateCount).toBe(BASE_FORWARD_GATE_COUNT + 2);
  });

  it('selects the expected operation tiers for early waves', () => {
    const wave1 = generator.generate(1, 60);
    expect(wave1.forwardGates.every((gate) => gate.tier === 'basic')).toBe(true);
  });

  it('uses compound tiers for mid waves and advanced for late waves', () => {
    const wave6 = generator.generate(6, 60);
    const wave11 = generator.generate(11, 60);
    expect(wave6.forwardGates.some((gate) => gate.tier === 'compound')).toBe(true);
    expect(wave11.forwardGates.some((gate) => gate.tier === 'advanced')).toBe(true);
  });

  it('tracks optimal checkpoints and skirmish sizing', () => {
    const wave = generator.generate(2, 60);
    const checkpoint = wave.optimal.forward.checkpoints[0];
    expect(checkpoint.enemy).toBe(Math.floor(checkpoint.bestValue * SKIRMISH_RATIO));
    expect(checkpoint.postBattle).toBeLessThanOrEqual(checkpoint.bestValue);
    expect(wave.optimal.forward.finalArmy).toBeGreaterThanOrEqual(0);
  });
});
