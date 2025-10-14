import {
  formatGateSymbol,
  formatGateValue,
  formatTimer,
} from './formatting.js';

// why this test matters: HUD formatting must stay consistent for readability.
describe('formatting helpers', () => {
  it('maps operators to symbols with fallback', () => {
    expect(formatGateSymbol({ op: 'add' })).toBe('+');
    expect(formatGateSymbol({ op: 'subtract' })).toBe('−');
    expect(formatGateSymbol({ op: 'multiply' })).toBe('×');
    expect(formatGateSymbol({ op: 'divide' })).toBe('÷');
    expect(formatGateSymbol({ op: 'boost' })).toBe('?');
  });

  it('formats gate values by operator type', () => {
    expect(formatGateValue({ op: 'add', value: 7 })).toBe('7');
    expect(formatGateValue({ op: 'multiply', value: 1.25 })).toBe('1.3');
    expect(formatGateValue({ op: 'divide', value: 2.0 })).toBe('2.0');
  });

  it('formats timers as mm:ss', () => {
    expect(formatTimer(90000)).toBe('01:30');
    expect(formatTimer(0)).toBe('00:00');
  });
});
