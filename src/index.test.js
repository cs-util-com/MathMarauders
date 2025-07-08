import GateSystem from './game/GateSystem.js';
import WaveGenerator from './game/WaveGenerator.js';
import PersistenceManager from './game/PersistenceManager.js';
import Telemetry from './game/Telemetry.js';

describe('GateSystem optimal path', () => {
  test('chooses max outcome', () => {
    const gate = [[{label:'+2', fn:x=>x+2},{label:'-1', fn:x=>x-1}]];
    const gs = new GateSystem(gate);
    expect(gs.optimalOutcome(5)).toBe(7);
  });
});

describe('WaveGenerator', () => {
  test('gate count increases with wave', () => {
    const gen = new WaveGenerator();
    expect(WaveGenerator.gateCount(1)).toBe(5);
    expect(WaveGenerator.gateCount(2)).toBe(6);
  });
});

describe('Star rating thresholds', () => {
  function computeStars(ratio) {
    if (ratio <= 0.4) return 1;
    if (ratio <= 0.6) return 2;
    if (ratio <= 0.75) return 3;
    if (ratio <= 0.9) return 4;
    return 5;
  }
  test('rating boundaries', () => {
    expect(computeStars(0.3)).toBe(1);
    expect(computeStars(0.5)).toBe(2);
    expect(computeStars(0.7)).toBe(3);
    expect(computeStars(0.85)).toBe(4);
    expect(computeStars(0.95)).toBe(5);
  });
});

describe('PersistenceManager', () => {
  test('saves and loads stars', () => {
    const storage = new Map();
    const fakeStorage = {
      getItem: key => storage.get(key),
      setItem: (key, val) => storage.set(key, val)
    };
    const p = new PersistenceManager(fakeStorage);
    p.setStarRating(1, 3);
    expect(p.getStarRating(1)).toBe(3);
  });
});

describe('Telemetry', () => {
  test('logs events', () => {
    const t = new Telemetry();
    console.log = jest.fn();
    t.trackEvent('test', {a:1});
    expect(console.log).toHaveBeenCalled();
  });
});
