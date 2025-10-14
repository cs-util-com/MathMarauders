import { createSeededRng } from './random.js';

const BASE_DISTANCE = 90;
const STEP_DURATION = 0.8;
const PLAYER_SPEED = 6;
const CHASER_SPEED = PLAYER_SPEED * 1.05;

export function runReverseChase({ playerCount, gateCount, seed }) {
  const rng = typeof seed === 'function' ? seed : createSeededRng(seed);
  let players = playerCount;
  let progress = 0;
  let chaserProgress = -12;
  let timeElapsed = 0;
  const events = [];

  const gateInterval = BASE_DISTANCE / Math.max(1, gateCount + 1);
  let nextGate = gateInterval;
  let gatesCleared = 0;

  while (players > 0 && progress < BASE_DISTANCE && timeElapsed < 80) {
    timeElapsed += STEP_DURATION;
    progress += PLAYER_SPEED * STEP_DURATION;
    chaserProgress += CHASER_SPEED * STEP_DURATION;

    const volleyLoss = Math.max(1, Math.round(players * (0.08 + rng() * 0.04)));
    players = Math.max(0, players - volleyLoss);
    events.push({ type: 'volley', volleyLoss, playersRemaining: players });

    if (progress >= nextGate && gatesCleared < gateCount) {
      gatesCleared += 1;
      const surgeLoss = Math.round(players * 0.05);
      players = Math.max(0, players - surgeLoss);
      chaserProgress += 8;
      nextGate += gateInterval;
      events.push({
        type: 'surge',
        surgeLoss,
        playersRemaining: players,
        gatesCleared,
      });
    }

    if (chaserProgress >= progress - 2) {
      return {
        outcome: 'caught',
        playersRemaining: players,
        timeElapsed,
        events,
        gatesCleared,
      };
    }
  }

  const outcome = players > 0 ? 'escape' : 'eliminated';
  return {
    outcome,
    playersRemaining: players,
    timeElapsed,
    events,
    gatesCleared,
  };
}
