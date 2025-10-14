export function computeScore({
  initialUnits,
  remainingUnits,
  elapsedSeconds,
  gatesTaken,
  skirmishVolleys,
  chaseOutcome,
}) {
  const gateBonus = gatesTaken * 60;
  const survivalBonus = Math.max(0, remainingUnits) * 15;
  const speedBonus = Math.max(0, 180 - Math.round(elapsedSeconds)) * 2;
  const volleyEfficiency = Math.max(0, (5 - skirmishVolleys) * 20);
  const chasePenalty = chaseOutcome === 'escape' ? 0 : 120;
  const attritionPenalty = Math.max(0, initialUnits - remainingUnits) * 2;

  const total =
    gateBonus +
    survivalBonus +
    speedBonus +
    volleyEfficiency -
    chasePenalty -
    attritionPenalty;
  return {
    total,
    breakdown: {
      gateBonus,
      survivalBonus,
      speedBonus,
      volleyEfficiency,
      chasePenalty,
      attritionPenalty,
    },
  };
}

export function computeStarRating({ score, survivalRate, elapsedSeconds }) {
  const thresholds = [180, 320, 460];
  let stars = 0;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (score >= thresholds[i]) {
      stars += 1;
    }
  }

  if (survivalRate < 0.5 && stars > 2) {
    stars = 2;
  }
  if (elapsedSeconds > 210 && stars > 1) {
    stars -= 1;
  }

  return { stars, thresholds };
}
