import { renderGateOptions } from './gatePanel.js';

describe('gate panel', () => {
  test('renders gate options and fires select callback', () => {
    // why this test matters: forward choices drive the entire math loop.
    const container = document.createElement('div');
    const gate = {
      id: '0-add',
      stage: 0,
      op: 'add',
      value: 6,
      color: '#33d6a6',
      symbol: '+',
      description: 'Recruit 6 runners',
      risk: 0.1,
      reward: 12,
    };
    const handler = jest.fn();

    renderGateOptions(container, [gate], { onSelect: handler });
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    button.click();
    button.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenCalledWith(gate);
  });

  test('renders empty state when no gates remain', () => {
    // why this test matters: communicates phase transitions without silent failures.
    const container = document.createElement('div');
    renderGateOptions(container, [], { onSelect: jest.fn() });
    expect(container.textContent).toContain('All gates cleared');
  });
});
