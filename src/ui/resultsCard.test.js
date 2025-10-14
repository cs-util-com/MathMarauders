import { renderResultsCard } from './resultsCard.js';

describe('results card', () => {
  test('displays stars and summary for results', () => {
    // why this test matters: the end card sells success/failure and must present accurate totals.
    const container = document.createElement('article');
    const starsEl = document.createElement('div');
    starsEl.setAttribute('data-testid', 'results-stars');
    const summaryEl = document.createElement('p');
    summaryEl.setAttribute('data-testid', 'results-summary');
    container.append(starsEl, summaryEl);

    renderResultsCard(container, null, { survivors: 0 });
    expect(container.classList.contains('is-visible')).toBe(false);

    const results = {
      score: 1234,
      stars: 2,
      summary: 'Escaped with 24 marauders in 32.0s.',
    };
    renderResultsCard(container, results, { survivors: 24 });
    expect(container.classList.contains('is-visible')).toBe(true);
    expect(starsEl.textContent).toBe('★★☆');
    expect(summaryEl.textContent).toContain('Score 1.2K');
  });
});
