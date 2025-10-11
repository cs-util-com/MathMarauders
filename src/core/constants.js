/**
 * Shared configuration constants for the Math Marauders simulation.
 */
export const INITIAL_ARMY_SIZE = 64;
export const SKIRMISH_ENEMY_RATIO = 0.8;
export const ARROW_VOLLEY_RATIO = 0.1;
export const PLAYER_SPEED = 6;
export const ENEMY_BASE_SPEED = 6;
export const ENEMY_SURGE_SPEED = 8;
export const ENEMY_SURGE_DURATION_MS = 1000;
export const STRAGGLER_TIMEOUT_MS = 2000;
export const MAX_RENDERED_AGENTS = 180;

export const STAR_THRESHOLDS = [
  { stars: 1, minRatio: 0 },
  { stars: 2, minRatio: 0.41 },
  { stars: 3, minRatio: 0.61 },
  { stars: 4, minRatio: 0.76 },
  { stars: 5, minRatio: 0.91 }
];

export const QUALITY_PRESETS = {
  desktop: {
    agentLimit: 180,
    arrowTrail: 4
  },
  mobile: {
    agentLimit: 90,
    arrowTrail: 2
  }
};

export const DEFAULT_QUALITY = "desktop";
