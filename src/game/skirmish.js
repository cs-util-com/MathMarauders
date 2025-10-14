import { createSeededRng } from './random.js';

const HP_PER_UNIT = 10;
const PLAYER_BASE_DAMAGE = 2.8;
const ENEMY_BASE_DAMAGE = 2.5;
const MAX_TICKS = 6;

export function runSkirmish({ playerCount, enemyCount, seed }) {
  const rng = typeof seed === 'function' ? seed : createSeededRng(seed);
  const timeline = [];
  let players = playerCount;
  let enemies = enemyCount;
  let tick = 0;

  while (players > 0 && enemies > 0 && tick < MAX_TICKS) {
    const playerCasualties = computeCasualties({
      attackers: players,
      defenders: enemies,
      baseDamage: PLAYER_BASE_DAMAGE,
      rng,
    });
    const enemyCasualties = computeCasualties({
      attackers: enemies,
      defenders: players,
      baseDamage: ENEMY_BASE_DAMAGE,
      rng,
    });

    enemies = Math.max(0, enemies - playerCasualties);
    players = Math.max(0, players - enemyCasualties);

    timeline.push({
      tick,
      playerCasualties: enemyCasualties,
      enemyCasualties: playerCasualties,
      playersRemaining: players,
      enemiesRemaining: enemies,
    });
    tick += 1;
  }

  const outcome = players > 0 ? 'victory' : 'defeat';
  return {
    outcome,
    playersRemaining: players,
    enemiesRemaining: enemies,
    volleys: timeline.length,
    timeline,
  };
}

function computeCasualties({ attackers, defenders, baseDamage, rng }) {
  if (attackers === 0 || defenders === 0) {
    return 0;
  }
  const intensity = Math.min(attackers, defenders) ** 0.85;
  const jitter = 0.85 + rng() * 0.3;
  const damage = baseDamage * intensity * jitter;
  const casualties = Math.ceil(damage / HP_PER_UNIT);
  return Math.min(defenders, casualties);
}
