/**
 * Lightweight wrapper around localStorage that falls back to an in-memory map
 * when the environment (e.g. Jest) does not provide a DOM storage implementation.
 */
export class PersistenceManager {
  constructor(namespace = "math-marauders") {
    this.namespace = namespace;
    this.memory = new Map();
    this.storage = this.resolveStorage();
  }

  /**
   * @returns {Storage | null}
   */
  resolveStorage() {
    if (
      typeof window === "undefined" ||
      typeof window.localStorage === "undefined"
    ) {
      return null;
    }
    try {
      const key = `${this.namespace}__test`;
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return window.localStorage;
    } catch {
      return null;
    }
  }

  storageKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  save(key, value) {
    const payload = JSON.stringify(value);
    if (this.storage) {
      this.storage.setItem(this.storageKey(key), payload);
    } else {
      this.memory.set(key, payload);
    }
  }

  /**
   * @param {string} key
   * @param {unknown} fallback
   * @returns {unknown}
   */
  load(key, fallback = null) {
    const raw = this.storage
      ? this.storage.getItem(this.storageKey(key))
      : (this.memory.get(key) ?? null);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
}
