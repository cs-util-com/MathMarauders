/**
 * Shared game constants used across systems.
 * @module core/constants
 */

export const BASE_FORWARD_GATE_COUNT = 5;
export const SKIRMISH_RATIO = 0.8;
export const BASE_PLAYER_ARMY = 60;
export const RETREAT_ARROW_INTERVAL_MS = 800;
export const RETREAT_ARROW_RATIO = 0.1;
export const BASE_SPEED_MPS = 6;
export const SURGE_SPEED_MPS = 8;
export const STAR_THRESHOLDS = [0.4, 0.6, 0.75, 0.9];
export const SHOWDOWN_ENEMY_RATIO = 1.4;
export const MAX_OPERATION_FACTOR = 5;
export const MAX_OPERATION_OFFSET = 12;

export const STORAGE_KEY = 'math-marauders-stars';

export const TELEMETRY_EVENTS = {
  WAVE_START: 'wave_start',
  GATE_RESOLVED: 'gate_resolved',
  SKIRMISH: 'skirmish',
  SHOWDOWN_START: 'showdown_start',
  RETREAT_GATE: 'retreat_gate',
  WAVE_COMPLETE: 'wave_complete',
  WAVE_FAILED: 'wave_failed',
};
