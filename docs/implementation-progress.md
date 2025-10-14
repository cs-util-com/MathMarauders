# Implementation progress

## Iteration 01 — Core loop scaffolding

- **What changed:** Delivered a static ES module app with seeded gate generation,
  combat/resolution math, HUD + pause suite, and responsive styling that echoes
  the "Candy Arcade" direction within the constraints of DOM/CSS.
- **Why it matters:** Establishes the full forward → skirmish → reverse → end
  card loop so future visual or systems upgrades can plug into a working game
  skeleton.
- **Decisions:** Simplified visuals to UI states (no WebGL), leaned on seeded
  PRNG for deterministic runs, and hooked FPS guard output to CSS-based low-mode
  cues.
- **Open questions:** What flavour of rendering (Three.js? WebGPU?) should back
  the eventual 3D lane, and how should the combat math tune once actual enemy
  counts and animations are in place?
- **Next iteration:** Prototype minimal WebGL lane render or expand the combat
  model with formation-based modifiers while keeping deterministic outputs for
  tests.
