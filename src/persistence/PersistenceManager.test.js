import { PersistenceManager } from "./PersistenceManager.js";

describe("PersistenceManager", () => {
  test("falls back to memory storage when localStorage is unavailable", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: undefined,
    });
    const manager = new PersistenceManager("test-namespace");
    expect(manager.storage).toBeNull();
    manager.save("foo", { value: 42 });
    expect(manager.load("foo", null)).toEqual({ value: 42 });
    if (original) {
      Object.defineProperty(window, "localStorage", original);
    } else {
      delete window.localStorage;
    }
  });

  test("returns fallback when data missing", () => {
    const manager = new PersistenceManager("fallback-test");
    expect(manager.load("missing", 7)).toBe(7);
  });
});
