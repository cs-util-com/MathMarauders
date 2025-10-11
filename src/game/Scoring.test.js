import { calculateStars, formatStars } from "./Scoring.js";

describe("Scoring", () => {
  test("returns zero stars when optimal is zero", () => {
    expect(calculateStars(10, 0)).toBe(0);
  });

  test("assigns correct thresholds", () => {
    expect(calculateStars(40, 100)).toBe(2);
    expect(calculateStars(60, 100)).toBe(3);
    expect(calculateStars(75, 100)).toBe(4);
    expect(calculateStars(90, 100)).toBe(5);
    expect(calculateStars(100, 100)).toBe(5);
  });

  test("formats stars into glyph string", () => {
    expect(formatStars(3)).toBe("★★★☆☆");
  });
});
