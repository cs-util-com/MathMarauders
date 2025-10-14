import {
  applyGate,
  generateGateOptions,
  formatGateLabel,
  getGateColor,
} from './gate.js';
import { mulberry32 } from '../utils/random.js';

// why this test matters: gate math must be deterministic so strategy choices line up with UI feedback.
test('applyGate respects rounding and clamping rules', () => {
  expect(applyGate(10, { type: 'add', value: 5 })).toBe(15);
  expect(applyGate(10, { type: 'subtract', value: 15 })).toBe(0);
  expect(applyGate(10, { type: 'multiply', value: 1.6 })).toBe(16);
  expect(applyGate(10, { type: 'divide', value: 3.2 })).toBe(3);
  expect(applyGate(1, { type: 'divide', value: 99 })).toBe(1);
});

// why this test matters: players need meaningful strategic differences between gates to keep the loop engaging.
test('generateGateOptions creates two gates with distinct projected outcomes', () => {
  const rng = mulberry32(123);
  const [left, right] = generateGateOptions({ rng, wave: 1, currentCount: 12 });
  const leftResult = applyGate(12, left);
  const rightResult = applyGate(12, right);
  const delta = Math.abs(leftResult - rightResult) / 12;
  expect(delta).toBeGreaterThanOrEqual(0.15);
  expect(formatGateLabel(left)).toMatch(/^[+−×÷]/u);
  expect(getGateColor(left)).toMatch(/^#/);
});
