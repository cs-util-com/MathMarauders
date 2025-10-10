import {BattleSystem, calculateStarRating} from '../BattleSystem.js';
import {FlockSystem} from '../FlockSystem.js';
import {RETREAT_ARROW_RATIO, STAR_THRESHOLDS} from '../constants.js';

describe('BattleSystem', () => {
  let telemetry;
  let flocks;
  let battles;

  beforeEach(() => {
    telemetry = {trackEvent: jest.fn()};
    flocks = new FlockSystem();
    battles = new BattleSystem({flocks, telemetry});
  });

  it('reduces the player army during skirmishes', () => {
    flocks.setPlayer(50);
    const survivors = battles.resolveSkirmish(50, 20);
    expect(survivors).toBe(30);
    expect(flocks.player).toBe(30);
    expect(telemetry.trackEvent).toHaveBeenCalled();
  });

  it('never returns negative survivors', () => {
    const survivors = battles.resolveSkirmish(10, 25);
    expect(survivors).toBe(0);
  });

  it('derives volley size from player army ratio', () => {
    const volley = battles.calculateArrowVolley(120);
    expect(volley).toBe(Math.floor(120 * RETREAT_ARROW_RATIO));
  });
});

describe('calculateStarRating', () => {
  it('returns zero stars when everyone is lost', () => {
    expect(calculateStarRating(0, 100, STAR_THRESHOLDS)).toBe(0);
  });

  it('assigns the correct star bands', () => {
    expect(calculateStarRating(30, 100, STAR_THRESHOLDS)).toBe(1);
    expect(calculateStarRating(55, 100, STAR_THRESHOLDS)).toBe(2);
    expect(calculateStarRating(80, 100, STAR_THRESHOLDS)).toBe(4);
    expect(calculateStarRating(95, 100, STAR_THRESHOLDS)).toBe(5);
  });

  it('handles degenerate optimal totals', () => {
    expect(calculateStarRating(10, 0, STAR_THRESHOLDS)).toBe(5);
  });
});
