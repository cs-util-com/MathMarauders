import { describe, expect, test } from "@jest/globals";
import { calculateStars } from "./scoring.js";

describe("calculateStars", () => {
  test.each([
    [0, 100, 1],
    [35, 100, 1],
    [55, 100, 2],
    [70, 100, 3],
    [85, 100, 4],
    [95, 100, 5]
  ])("survivors %i against optimal %i yields %i stars", (survivors, optimal, stars) => {
    expect(calculateStars(survivors, optimal).stars).toBe(stars);
  });

  test("ratio is clamped between 0 and 1", () => {
    expect(calculateStars(-5, 100).ratio).toBe(0);
    expect(calculateStars(120, 100).ratio).toBe(1);
  });
});
