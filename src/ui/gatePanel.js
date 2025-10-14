import { describeGate } from '../logic/gates.js';
import { formatNumber } from '../utils/format.js';

function renderGateButton(gate, onSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gate-card';
  button.style.setProperty('border-color', `${gate.color}55`);
  button.style.setProperty('box-shadow', `0 12px 24px ${gate.color}22`);

  const symbol = document.createElement('div');
  symbol.className = 'gate-card__symbol';
  symbol.textContent = describeGate(gate);
  symbol.style.color = gate.color;

  const description = document.createElement('p');
  description.className = 'gate-card__description';
  description.textContent = gate.description;

  const telemetry = document.createElement('p');
  telemetry.className = 'gate-card__description';
  telemetry.innerHTML = `Risk <strong>${(gate.risk * 100).toFixed(0)}%</strong> · Yield <strong>${formatNumber(
    gate.reward
  )}</strong>`;

  button.append(symbol, description, telemetry);
  button.addEventListener('click', () => onSelect(gate));
  button.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onSelect(gate);
    }
  });

  return button;
}

export function renderGateOptions(container, gates, { onSelect }) {
  container.innerHTML = '';

  if (!gates || gates.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.textContent = 'All gates cleared. Skirmish ready.';
    container.appendChild(emptyState);
    return;
  }

  gates.forEach((gate) => {
    container.appendChild(
      renderGateButton(gate, (selected) => onSelect?.(selected))
    );
  });
}
