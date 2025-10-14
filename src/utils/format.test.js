import { formatDelta, formatNumber, toSeconds } from './format.js';

describe('format helpers', () => {
  test('formatNumber uses compact notation for large values', () => {
    // why this test matters: HUD must stay readable for high scores on small screens.
    expect(formatNumber(12500)).toBe('12.5K');
  });

  test('formatDelta adds sign and rounds', () => {
    // why this test matters: players rely on quick feedback about squad gains/losses.
    expect(formatDelta(4.2)).toBe('+4');
    expect(formatDelta(-3.9)).toBe('-4');
    expect(formatDelta(0)).toBeNull();
  });

  test('toSeconds converts milliseconds to seconds with one decimal', () => {
    // why this test matters: run timer precision ensures consistent pacing feedback.
    expect(toSeconds(1234)).toBe('1.2');
  });
});
