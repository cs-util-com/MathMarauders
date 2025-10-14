const HP_PER_UNIT = 10;
const BASE_DAMAGE = 7;
const TICK_INTERVAL_MS = 150;

export function simulateSkirmish({
  playerCount,
  enemyCount,
  rng = Math.random,
}) {
  let attackers = Math.max(0, Math.round(playerCount));
  let defenders = Math.max(0, Math.round(enemyCount));
  const ticks = [];
  let elapsed = 0;

  while (attackers > 0 && defenders > 0 && ticks.length < 24) {
    const attackerDamage =
      BASE_DAMAGE * Math.pow(Math.min(attackers, defenders), 0.85);
    const defenderDamage =
      BASE_DAMAGE * Math.pow(Math.min(attackers, defenders), 0.85);

    const enemyLoss = Math.min(
      defenders,
      Math.ceil(attackerDamage / HP_PER_UNIT + rng() * 0.3)
    );
    const playerLoss = Math.min(
      attackers,
      Math.ceil(defenderDamage / HP_PER_UNIT + rng() * 0.3)
    );

    defenders -= enemyLoss;
    attackers -= playerLoss;
    elapsed += TICK_INTERVAL_MS;

    ticks.push({
      tick: ticks.length,
      time: elapsed,
      enemyLoss,
      playerLoss,
      playerRemaining: Math.max(0, attackers),
      enemyRemaining: Math.max(0, defenders),
    });
  }

  return {
    playerRemaining: Math.max(0, attackers),
    enemyRemaining: Math.max(0, defenders),
    ticks,
    durationMs: elapsed,
  };
}
