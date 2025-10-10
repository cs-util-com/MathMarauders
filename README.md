# Math Marauders

Math Marauders is a wave-based strategy runner inspired by the project brief in this repository. Instead of relying on WebGL or
GPGPU simulations, this version provides a lightweight HTML interface that lets you steer an abstract flock of soldiers through
the core systems described in the specification:

- **Forward run** gates that apply deterministic math operations.
- **Skirmishes** sized off the optimal path after each forward gate.
- A **showdown → retreat chase** where automatic arrow volleys whittle down the pursuing enemy.
- **Star ratings**, persistence, and telemetry hooks ready for future integrations.

The app focuses on surfacing the math and progression logic so the systems can be verified through unit tests and easily evolved
into a richer visual experience later.

## Getting started

```bash
npm install
npm start # optional if you add your own static server
```

The project is entirely static. Opening `index.html` in a browser is enough to play the simulation.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run lint` | ESLint using the flat config in `eslint.config.js`. |
| `npm run check:all` | Alias for the lint script. |
| `npm test` | Jest unit tests configured for ESM via Babel. |
| `npm run validate:all` | Lint + test, matching the project instructions. |

## Architecture overview

The implementation leans on small modules inside `src/core` and `src/ui`:

| Module | Responsibility |
| --- | --- |
| `WaveGenerator` | Deterministically generates gate operations, enemy sizing, and optimal-path reference data for each wave. |
| `GateSystem` | Resolves player choices and reports telemetry. |
| `BattleSystem` | Handles skirmish subtraction, retreat arrow volleys, and star rating calculations. |
| `FlockSystem` | Tracks player/enemy counts and notifies listeners (the UI). |
| `GameController` | Orchestrates wave flow, progression, and persistence. |
| `UIManager` | Renders the HUD, slider controls, and end-of-wave popups. |
| `PersistenceManager` | Wraps `localStorage` and exposes helper methods for storing star ratings. |
| `Telemetry` | Provides an abstract interface plus the default console-backed implementation. |

All public classes include JSDoc annotations to make the data flow explicit.

## Testing strategy

Unit tests cover the deterministic core systems:

- Wave generation rules (gate count, operation tiers, skirmish sizing).
- Star rating thresholds and failure cases.
- Persistence logic around star upgrades.
- Telemetry behavior.

Run the full suite with:

```bash
npm test
```

## Future work

- Swap the abstract UI for an actual WebGL flock simulation (Three.js + GPU boids).
- Model obstacle avoidance and flock splitting per the original brief.
- Persist additional analytics via the telemetry interface.
- Expand tests to cover retreat pacing, timer behavior, and UI flows.
