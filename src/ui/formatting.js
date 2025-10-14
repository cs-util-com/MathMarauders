export function formatGateSymbol(gate) {
  switch (gate.op) {
    case 'add':
      return '+';
    case 'subtract':
      return '−';
    case 'multiply':
      return '×';
    case 'divide':
      return '÷';
    default:
      return '?';
  }
}

export function formatGateValue(gate) {
  if (gate.op === 'multiply' || gate.op === 'divide') {
    return gate.value.toFixed(1);
  }
  return gate.value.toString();
}

export function formatTimer(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
