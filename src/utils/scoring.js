import { STAR_THRESHOLDS } from "../core/constants.js";

/**
 * Calculates the star rating based on final survivors vs the optimal path.
 * @param {number} survivors
 * @param {number} optimal
 * @returns {{stars: number, ratio: number}}
 */
export function calculateStars(survivors, optimal) {
  if (optimal <= 0) {
    return { stars: 0, ratio: 0 };
  }
  const ratio = Math.max(0, Math.min(1, survivors / optimal));
  let stars = 0;
  for (const threshold of STAR_THRESHOLDS) {
    if (ratio >= threshold.minRatio) {
      stars = Math.max(stars, threshold.stars);
    }
  }
  return { stars, ratio };
}
