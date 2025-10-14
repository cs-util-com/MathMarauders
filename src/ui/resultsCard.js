import { formatNumber } from '../utils/format.js';

export function renderResultsCard(container, results, { survivors }) {
  if (!results) {
    container.classList.remove('is-visible');
    container.querySelector('[data-testid="results-stars"]').innerHTML = '';
    container.querySelector('[data-testid="results-summary"]').textContent = '';
    return;
  }

  container.classList.add('is-visible');
  const starsEl = container.querySelector('[data-testid="results-stars"]');
  const summaryEl = container.querySelector('[data-testid="results-summary"]');
  starsEl.innerHTML = '';
  const totalStars = Math.max(1, Math.min(3, results.stars));
  for (let i = 0; i < 3; i += 1) {
    const star = document.createElement('span');
    star.textContent = i < totalStars ? '★' : '☆';
    starsEl.appendChild(star);
  }

  summaryEl.textContent = `${results.summary} Score ${formatNumber(results.score)} · Survivors ${formatNumber(
    survivors
  )}.`;
}
