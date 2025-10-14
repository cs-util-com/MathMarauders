const DEFAULT_BASE_LOSS = 0.05;
const DEFAULT_PENALTY_LOSS = 0.18;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function computeReverseTick({
  units,
  sliderPosition,
  targetLane,
  dt,
  baseLossRate = DEFAULT_BASE_LOSS,
  penaltyLossRate = DEFAULT_PENALTY_LOSS,
}) {
  const clampedUnits = Math.max(0, units);
  const alignment =
    1 - clamp(Math.abs(sliderPosition - targetLane) / 0.5, 0, 1);
  const lossRate = baseLossRate + (1 - alignment) * penaltyLossRate;
  const lostUnits = clampedUnits * lossRate * dt;
  const nextUnits = Math.max(0, clampedUnits - lostUnits);
  return {
    units: Math.round(nextUnits),
    exhausted: nextUnits <= 0.5,
    lossRate,
  };
}

export function rollNextTargetLane(rng = Math.random) {
  const lane = 0.2 + rng() * 0.6;
  return clamp(lane, 0, 1);
}
