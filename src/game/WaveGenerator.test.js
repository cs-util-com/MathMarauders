import { WaveGenerator } from "./WaveGenerator.js";
import { SKIRMISH_ENEMY_FACTOR } from "../constants.js";

describe("WaveGenerator", () => {
  const generator = new WaveGenerator({ seed: 42 });

  test("wave 1 has five gates and deterministic choices", () => {
    const wave = generator.generateWave(1);
    expect(wave.gateCount).toBe(5);
    expect(wave.forward).toHaveLength(5);
    expect(wave.retreat).toHaveLength(5);
    const firstGate = wave.forward[0];
    const a = firstGate.choices[0].apply(wave.initialArmy);
    const b = firstGate.choices[1].apply(wave.initialArmy);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    const secondWave = generator.generateWave(1);
    expect(secondWave.forward[0].choices[0].expression).toBe(
      firstGate.choices[0].expression,
    );
  });

  test("each subsequent wave adds a gate", () => {
    const waveTwo = generator.generateWave(2);
    const waveThree = generator.generateWave(3);
    expect(waveTwo.gateCount).toBe(6);
    expect(waveThree.gateCount).toBe(7);
  });

  test("skirmish strength tracks optimal outcome", () => {
    const wave = generator.generateWave(4);
    wave.optimal.forward.steps.forEach((step) => {
      const skirmish = wave.skirmishes.find(
        (item) => item.gateId === step.gateId,
      );
      expect(skirmish.enemySize).toBe(
        Math.round(step.result * SKIRMISH_ENEMY_FACTOR),
      );
    });
  });

  test("retreat gates mirror forward count", () => {
    const wave = generator.generateWave(5);
    expect(wave.forward).toHaveLength(wave.retreat.length);
  });
});
