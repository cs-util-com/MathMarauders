export function simulateSkirmish({
  playerCount,
  enemyCount,
  volleyDurationMs,
}) {
  const volleys = Math.max(1, Math.round(volleyDurationMs / 1000));
  const playerDamagePerVolley = Math.max(1, Math.round(enemyCount * 0.1));
  const enemyDamagePerVolley = Math.max(1, Math.round(playerCount * 0.12));

  const playerLoss = Math.min(playerCount, playerDamagePerVolley * volleys);
  const enemyLoss = Math.min(enemyCount, enemyDamagePerVolley * volleys);

  const playerRemaining = Math.max(0, playerCount - playerLoss);
  const enemyRemaining = Math.max(0, enemyCount - enemyLoss);
  const scoreDelta = enemyLoss * 2 - playerLoss;

  return {
    volleys,
    playerRemaining,
    enemyRemaining,
    scoreDelta,
  };
}

export function resolveReverseChase({ survivors, chaseStrength }) {
  const pressureThreshold = Math.ceil(chaseStrength * 0.7);
  if (survivors <= pressureThreshold) {
    return {
      success: false,
      casualties: survivors,
      bonusScore: 0,
    };
  }

  const casualties = Math.max(0, Math.round(chaseStrength * 0.35));
  const bonusScore = Math.max(0, survivors - casualties);

  return {
    success: true,
    casualties,
    bonusScore,
  };
}

export function calculateStarRating(score) {
  if (score >= 110) return 3;
  if (score >= 60) return 2;
  return 1;
}
