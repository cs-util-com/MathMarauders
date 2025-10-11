import { describe, expect, test } from "@jest/globals";
import { GateSystem } from "./GateSystem.js";

describe("GateSystem", () => {
  const gates = [
    {
      id: 1,
      operations: [
        { label: "+10", evaluate: (value) => value + 10 },
        { label: "×2", evaluate: (value) => value * 2 }
      ],
      enemySize: 50,
      optimalAfter: 100
    },
    {
      id: 2,
      operations: [
        { label: "-5", evaluate: (value) => value - 5 },
        { label: "÷2", evaluate: (value) => value / 2 }
      ],
      enemySize: 20,
      optimalAfter: 40
    }
  ];

  test("iterates through gates and applies the chosen operation", () => {
    const system = new GateSystem(gates);
    const first = system.nextGate();
    expect(first.gate.id).toBe(1);
    const result = system.resolveGate(50, 1);
    expect(result.playerAfterGate).toBe(100);
    expect(result.enemySize).toBe(50);
    const second = system.nextGate();
    expect(second.gate.id).toBe(2);
  });
});
