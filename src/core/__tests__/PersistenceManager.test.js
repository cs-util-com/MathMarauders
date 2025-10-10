import {PersistenceManager} from '../PersistenceManager.js';
import {STORAGE_KEY} from '../constants.js';

describe('PersistenceManager', () => {
  let manager;

  beforeEach(() => {
    window.localStorage.clear();
    manager = new PersistenceManager(window.localStorage);
  });

  it('returns an empty map when nothing is stored', () => {
    expect(manager.loadStars()).toEqual({});
  });

  it('saves and retrieves star ratings', () => {
    const updated = manager.updateStars(2, 4);
    expect(updated[2]).toBe(4);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBe(JSON.stringify({2: 4}));
    const loaded = manager.loadStars();
    expect(loaded[2]).toBe(4);
  });

  it('preserves the higher star rating', () => {
    manager.updateStars(3, 2);
    manager.updateStars(3, 1);
    expect(manager.loadStars()[3]).toBe(2);
    manager.updateStars(3, 5);
    expect(manager.loadStars()[3]).toBe(5);
  });
});
