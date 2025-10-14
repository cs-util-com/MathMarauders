import { formatNumber } from '../utils/format.js';

export function renderSkirmishLog(container, volleyLog) {
  if (!volleyLog || volleyLog.length === 0) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  container.hidden = false;
  container.innerHTML = '';
  const heading = document.createElement('h3');
  heading.textContent = 'Skirmish Volleys';
  heading.style.margin = '0';
  heading.style.textTransform = 'uppercase';
  heading.style.fontSize = '0.82rem';
  heading.style.letterSpacing = '0.08em';
  container.appendChild(heading);

  volleyLog.forEach((entry) => {
    const line = document.createElement('p');
    line.innerHTML = `Volley <strong>${entry.volley}</strong>: Lost <strong class="player-loss">${formatNumber(
      entry.playerLoss
    )}</strong>, Struck <strong class="enemy-loss">${formatNumber(entry.enemyLoss)}</strong>`;
    container.appendChild(line);
  });
}
