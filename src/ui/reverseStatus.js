export function renderReverseStatus(container, reverse) {
  if (!reverse) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  const valueEl = container.querySelector('.reverse-status__value');
  if (!valueEl) {
    return;
  }

  valueEl.textContent = reverse.success
    ? 'Stable Escape Corridor'
    : 'Critical Pressure';
  valueEl.style.color = reverse.success ? '#33d6a6' : '#ff5fa2';
}
