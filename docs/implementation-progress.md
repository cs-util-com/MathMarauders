# Implementation progress

## Iteration 1 — Arcade run loop skeleton

- Established deterministic math-gate generation, combat, and chase logic modules to anchor the core loop.
- Built responsive HUD and control surface aligning with README arcade spec (score/timer, slider, pause/start controls).
- Wired run flow (forward gate pick, skirmish, reverse chase) with instant restart behaviour and FPS degrade hooks.
- Added tests for gate math, combat flow, and performance guard evaluation to keep balancing logic deterministic.
- Outstanding: expand 3D presentation + particle systems described in README once rendering stack is introduced.

## Iteration 2 — Shareable seeds and restart parity

- Added query-string seed bootstrap so designers can reproduce specific runs instantly and wired URL updates on start.
- Preserved identical seeds for pause-menu restarts while rotating fresh seeds for new runs to keep variation high.
- Extended integration tests to lock the seed workflow and hook coverage for QA automation.
- Outstanding: expose copy-to-clipboard helper on end card and surface current seed in HUD for quicker sharing.
