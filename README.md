# Math Marauders

Math Marauders is a browser-based wave runner where a flock of soldiers charges through procedural math gates, clashes with opportunistic enemies, and then retreats through the same gauntlet while under pressure from a pursuing army. The project follows a lightweight, no-build architecture: every module ships as a native ES module, rendering occurs on a `<canvas>` element, and the UI overlay is regular HTML.

## Gameplay Loop

1. **Forward Run** – Each wave begins with five math gates (plus one per additional wave). Gates present two expressions; the player steers toward the higher-valued lane. Immediately after clearing the gate a skirmish resolves against an enemy sized at 80 % of the optimal path at that checkpoint.
2. **Showdown & Retreat** – Surviving soldiers trigger a massive enemy gate and must sprint back through a mirrored set of math gates. Arrow volleys fire automatically every gate, removing 10 % of the current army from the pursuers.
3. **Scoring & Progression** – Stars are awarded based on final survivors vs. the optimal path and best scores are persisted in `localStorage`.

## Architecture

The codebase is organised into a small set of focused modules:

| Module | Responsibility |
| ------ | -------------- |
| `core/GameController` | Orchestrates wave state, phase transitions, scoring, and telemetry events. |
| `game/WaveGenerator` | Procedurally generates math gates and pre-computes optimal-path checkpoints. |
| `game/GateSystem` | Steps through gates, evaluates player choices, and exposes enemy sizing. |
| `game/BattleSystem` | Resolves forward skirmishes, showdown spawning, and retreat-phase volleys. |
| `game/FlockSystem` | Renders a GPU-free boids-style visualisation with obstacle avoidance and straggler clean-up. |
| `ui/UIManager` | Manages DOM overlays, slider input, logs, and summary modals. |
| `core/PersistenceManager` | Stores best star ratings in `localStorage`. |
| `core/Telemetry` | Small abstraction with a console-backed default implementation. |

Utility modules in `src/utils` provide deterministic random number generation and star-rating helpers. Every public class includes JSDoc, and Jest tests cover the procedural math logic, scoring, persistence, and telemetry stubs.

## Development

The project purposely avoids a bundler. Use any static file server (or run `npm start`) and open `http://localhost:8080` in a modern browser.

```bash
npm install
npm start
```

### Quality Gates

| Command | Purpose |
| ------- | ------- |
| `npm run lint` | ESLint across all source modules. |
| `npm run test:unit` | Jest unit tests for procedural logic and persistence. |
| `npm test` | Convenience command running linting and unit tests. |

## Testing Strategy

Unit tests live next to the modules they exercise:

- `WaveGenerator.test.js` verifies gate counts, math tiers, and skirmish percentages.
- `scoring.test.js` checks star thresholds.
- `PersistenceManager.test.js` ensures best-star persistence and error handling.
- `Telemetry.test.js` guards the console-backed stub.

Run `npm test` before committing to keep the procedural logic deterministic and to surface regression bugs quickly.

## Telemetry & Extensibility

Telemetry is intentionally abstract: swap in a real analytics provider by subclassing `Telemetry` and passing it into the `GameController` constructor. The rest of the game interacts solely through `trackEvent` calls, keeping the implementation loosely coupled and testable.
