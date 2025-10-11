import { STAR_THRESHOLDS } from "../constants.js";

/**
 * Calculates the star rating for a wave based on the ratio of actual survivors
 * to the optimal path result.
 */
export function calculateStars(actual, optimal) {
  if (optimal <= 0) {
    return 0;
  }
  const ratio = actual / optimal;
  let stars = 0;
  STAR_THRESHOLDS.forEach((threshold) => {
    if (ratio >= threshold) {
      stars += 1;
    }
  });
  return Math.min(5, stars + 1);
}

export function formatStars(stars) {
  const filled = "★".repeat(stars);
  const empty = "☆".repeat(5 - stars);
  return `${filled}${empty}`;
}
