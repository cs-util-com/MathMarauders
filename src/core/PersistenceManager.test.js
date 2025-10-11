import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { PersistenceManager } from "./PersistenceManager.js";

describe("PersistenceManager", () => {
  let storage;

  beforeEach(() => {
    storage = {
      store: new Map(),
      getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
      },
      setItem(key, value) {
        this.store.set(key, value);
      },
      removeItem(key) {
        this.store.delete(key);
      }
    };
  });

  test("stores the best star rating only when higher", () => {
    const persistence = new PersistenceManager(storage);
    persistence.recordStars(1, 2);
    expect(persistence.getBestStars(1)).toBe(2);
    persistence.recordStars(1, 1);
    expect(persistence.getBestStars(1)).toBe(2);
    persistence.recordStars(1, 5);
    expect(persistence.getBestStars(1)).toBe(5);
  });

  test("handles malformed JSON gracefully", () => {
    storage.setItem("math-marauders-stars", "not-json");
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const persistence = new PersistenceManager(storage);
    expect(() => persistence.load()).not.toThrow();
    expect(persistence.getBestStars(1)).toBe(0);
    spy.mockRestore();
  });
});
