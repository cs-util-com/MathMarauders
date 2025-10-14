import { computeReverseTick, rollNextTargetLane } from './reverse.js';

// why this test matters: reverse chase attrition should reward good steering while keeping survival predictable.
test('computeReverseTick reduces losses when player tracks the target lane', () => {
  const aligned = computeReverseTick({
    units: 30,
    sliderPosition: 0.5,
    targetLane: 0.5,
    dt: 1,
    baseLossRate: 0.04,
    penaltyLossRate: 0.12,
  });

  const misaligned = computeReverseTick({
    units: 30,
    sliderPosition: 0.1,
    targetLane: 0.9,
    dt: 1,
    baseLossRate: 0.04,
    penaltyLossRate: 0.12,
  });

  expect(aligned.units).toBeGreaterThan(misaligned.units);
  expect(misaligned.units).toBeGreaterThan(0);
});

// why this test matters: when units drop to zero the run should immediately fail to avoid negative counts.
test('computeReverseTick clamps units at zero', () => {
  const result = computeReverseTick({
    units: 1,
    sliderPosition: 0,
    targetLane: 1,
    dt: 5,
    baseLossRate: 0.1,
    penaltyLossRate: 0.3,
  });
  expect(result.units).toBe(0);
  expect(result.exhausted).toBe(true);
});

// why this test matters: steering targets must stay within slider bounds for accessibility.
test('rollNextTargetLane stays within slider range', () => {
  const lane = rollNextTargetLane(() => 0.7);
  expect(lane).toBeGreaterThanOrEqual(0);
  expect(lane).toBeLessThanOrEqual(1);
});
