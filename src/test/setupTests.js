class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, value);
  }

  removeItem(key) {
    this.store.delete(key);
  }
}

if (typeof window === "undefined") {
  global.window = {};
}

if (!window.localStorage) {
  window.localStorage = new MemoryStorage();
  global.localStorage = window.localStorage;
}

global.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
