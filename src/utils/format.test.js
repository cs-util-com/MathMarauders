import { formatCompactNumber, formatTimer } from './format.js';

// why this test matters: HUD readability depends on consistent formatting for scores and timers.
test('formatCompactNumber compacts values', () => {
  expect(formatCompactNumber(1250)).toBe('1.3K');
  expect(formatCompactNumber(12)).toBe('12');
});

// why this test matters: the wave timer must remain legible with leading zeros.
test('formatTimer pads minutes and seconds', () => {
  expect(formatTimer(0)).toBe('00:00');
  expect(formatTimer(65)).toBe('01:05');
});
