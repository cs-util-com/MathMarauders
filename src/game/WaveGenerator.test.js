import { describe, expect, test } from "@jest/globals";
import { WaveGenerator, generateGateSequence } from "./WaveGenerator.js";
import { INITIAL_ARMY_SIZE, SKIRMISH_ENEMY_RATIO } from "../core/constants.js";

describe("WaveGenerator", () => {
  test("wave 1 starts with five gates and deterministic operations", () => {
    const generator = new WaveGenerator();
    const waveA = generator.generateWave(1);
    const waveB = generator.generateWave(1);
    expect(waveA.forward).toHaveLength(5);
    expect(waveA.forward.map((gate) => gate.operations[0].label)).toEqual(
      waveB.forward.map((gate) => gate.operations[0].label)
    );
  });

  test("wave 6 introduces composite operations", () => {
    const generator = new WaveGenerator();
    const wave = generator.generateWave(6);
    expect(wave.forward).toHaveLength(10);
    const hasComposite = wave.forward.some((gate) =>
      gate.operations.some((op) => op.label.includes("→"))
    );
    expect(hasComposite).toBe(true);
  });

  test("wave 11 introduces exponent operations", () => {
    const generator = new WaveGenerator();
    const wave = generator.generateWave(11);
    expect(wave.forward).toHaveLength(15);
    const hasExponent = wave.forward.every((gate) =>
      gate.operations.some(
        (op) => op.label.includes("^") && op.label.includes("(")
      )
    );
  expect(hasExponent).toBe(true);
  });

  test("skirmish enemy ratio remains near constant", () => {
    const gates = generateGateSequence(3, 0);
    let current = INITIAL_ARMY_SIZE;
    for (const gate of gates) {
      const best = Math.max(...gate.operations.map((op) => op.evaluate(current)));
      expect(gate.enemySize).toBe(Math.round(best * SKIRMISH_ENEMY_RATIO));
      current = gate.optimalAfter;
    }
  });
});
