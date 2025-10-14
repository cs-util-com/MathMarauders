function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function simulateSkirmish({
  players,
  enemyPower,
  aggression,
  gateQuality = 0,
}) {
  const normalizedAggression = clamp01(aggression);
  let playerCount = Math.max(0, Math.round(players));
  let enemyCount = Math.max(0, Math.round(enemyPower));
  const volleyCount = Math.max(2, Math.round(3 + gateQuality / 25));
  const volleyLog = [];

  for (let volley = 1; volley <= volleyCount; volley += 1) {
    const defensiveMitigation = 0.18 + (1 - normalizedAggression) * 0.22;
    const incoming = Math.round(
      enemyCount * defensiveMitigation * (1 / volleyCount + 0.2)
    );
    const playerLoss = Math.min(playerCount, Math.max(0, incoming));
    playerCount -= playerLoss;

    const retaliationBase = 0.24 + normalizedAggression * 0.38;
    const retaliation = Math.round(
      (playerCount + playerLoss * 0.4) * retaliationBase
    );
    const enemyLoss = Math.min(enemyCount, Math.max(0, retaliation));
    enemyCount -= enemyLoss;

    volleyLog.push({
      volley,
      playerLoss,
      enemyLoss,
      remainingPlayers: playerCount,
      remainingEnemies: enemyCount,
    });

    if (playerCount === 0 || enemyCount === 0) {
      break;
    }
  }

  return {
    volleyLog,
    remainingPlayers: playerCount,
    remainingEnemies: enemyCount,
    volleyCount: volleyLog.length,
  };
}

export function simulateReverseChase({ players, chasePressure, aggression }) {
  const normalizedAggression = clamp01(aggression);
  let playerCount = Math.max(0, Math.round(players));
  const baseDuration =
    26 - normalizedAggression * 6 + (chasePressure > playerCount ? 4 : 0);
  const ticks = Math.max(4, Math.round(baseDuration / 2));
  const pressure = Math.max(0, chasePressure);
  const tickLosses = [];

  for (let tick = 1; tick <= ticks; tick += 1) {
    const tickIntensity = pressure * (0.16 + (1 - normalizedAggression) * 0.28);
    const tickLoss = Math.min(
      playerCount,
      Math.round((tickIntensity / ticks) * (1 + tick / (ticks * 2)))
    );
    playerCount -= tickLoss;
    tickLosses.push(tickLoss);
    if (playerCount === 0) {
      break;
    }
  }

  const success = playerCount > Math.max(3, pressure * 0.08);
  return {
    ticks: tickLosses.length,
    remainingPlayers: playerCount,
    success,
    timeSeconds: Number(baseDuration.toFixed(1)),
    tickLosses,
  };
}

export function scoreRun({
  initialPlayers,
  playersSurvived,
  timeSeconds,
  gateQuality,
  success,
}) {
  const survivalRatio =
    initialPlayers === 0 ? 0 : playersSurvived / initialPlayers;
  const survivalScore = playersSurvived * (success ? 18 : 12);
  const timeScore = Math.max(0, 180 - timeSeconds) * 6;
  const qualityBonus = Math.max(0, gateQuality) * 4;
  const score = Math.round(survivalScore + timeScore + qualityBonus);

  let stars = 1;
  if (success && survivalRatio >= 0.75) {
    stars = 3;
  } else if (survivalRatio >= 0.45) {
    stars = 2;
  }

  const summary = success
    ? `Escaped with ${playersSurvived} marauders in ${timeSeconds.toFixed(1)}s.`
    : `Overrun after ${timeSeconds.toFixed(1)}s.`;

  return {
    score,
    stars,
    survivalRatio: Number(survivalRatio.toFixed(2)),
    summary,
  };
}
