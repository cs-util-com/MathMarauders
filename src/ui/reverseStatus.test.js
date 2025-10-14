import { renderReverseStatus } from './reverseStatus.js';

describe('reverse status panel', () => {
  test('hides when no reverse data and shows status when present', () => {
    // why this test matters: communicates chase pressure clearly during the reverse phase.
    const container = document.createElement('div');
    const valueEl = document.createElement('span');
    valueEl.className = 'reverse-status__value';
    container.appendChild(valueEl);

    renderReverseStatus(container, null);
    expect(container.hidden).toBe(true);

    const reverse = { success: false };
    renderReverseStatus(container, reverse);
    expect(container.hidden).toBe(false);
    expect(valueEl.textContent).toBe('Critical Pressure');
    reverse.success = true;
    renderReverseStatus(container, reverse);
    expect(valueEl.textContent).toBe('Stable Escape Corridor');
  });
});
