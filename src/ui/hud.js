import { formatDelta, formatNumber, toSeconds } from '../utils/format.js';

export function createHud({ scoreValueEl, timerValueEl, deltaEl }) {
  let deltaTimer = null;

  function clearDelta() {
    if (deltaTimer) {
      window.clearTimeout(deltaTimer);
      deltaTimer = null;
    }
    deltaEl.textContent = '';
    deltaEl.classList.remove(
      'is-visible',
      'hud__delta--positive',
      'hud__delta--negative'
    );
  }

  return {
    updateScore(value) {
      scoreValueEl.textContent = formatNumber(value);
    },
    updateTimer(elapsedMs) {
      timerValueEl.textContent = `${toSeconds(elapsedMs)}s`;
    },
    updateDelta(delta) {
      const formatted = formatDelta(delta);
      if (!formatted) {
        clearDelta();
        return;
      }

      deltaEl.textContent = formatted;
      deltaEl.classList.toggle('hud__delta--positive', delta > 0);
      deltaEl.classList.toggle('hud__delta--negative', delta < 0);
      deltaEl.classList.add('is-visible');

      if (deltaTimer) {
        window.clearTimeout(deltaTimer);
      }
      deltaTimer = window.setTimeout(() => {
        deltaEl.classList.remove('is-visible');
      }, 250);
    },
    clearDelta,
  };
}
