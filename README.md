## 1. Overview

A wave-based runner where the player leads a flock of soldiers through a series of forward math-choice gates and skirmishes, then reverses course in a “showdown chase” back through retreat-phase gates while being pursued by a massive enemy army. All locomotion and obstacle avoidance is handled by a GPU boids system (Three.js GPGPU birds demo).

---

## 2. Game Flow

1. **Forward Run**

   * **Gate Count**: Wave 1 = 5 gates; each new wave adds +1 gate.
   * **Math Gates**: Full mix of +N, –N, ×M, ÷M in waves 1–5; waves 6–10 introduce two-step (e.g. x\*4–2); waves 11+ allow parentheses and exponents.
   * **Optimal-Path**: At each gate, pick the larger outcome; chain through all gates to compute “optimal army” size.
   * **Skirmishes**: Immediately after each gate, spawn an enemy group sized at **80 % of optimal-army** at that point. Resolve by straight subtraction.
   * **Obstacles**: Static rocks with a 0.5 m soft-tolerance buffer around the divider; boids slide along rocks naturally; any boid outside the buffer for >2 s is removed. Use e.g. const rockGeo = new THREE.DodecahedronGeometry(1.2);

2. **Final Showdown → Retreat Chase**

   * Upon clearing the last forward gate, a single large enemy gate opens and a huge enemy flock pours out.
   * **Camera**: Same angled top-down tilt, but target and dolly direction reverse so the player retreats back to the start.
   * **Retreat Gates**: Mirror the forward-run count (e.g. 5 gates in wave 1). Same math-choice logic applies to your shrinking army.
   * **Chase Pacing**: Both sides run at 6 m/s; **each time you clear a retreat-phase gate**, the enemy surges to 8 m/s for 1 s.
   * **Arrow volleys**:

     * Automatic burst every 0.8 s, equal to 10 % of current player-army size.
     * Each arrow removes one enemy on contact (straight subtraction).
     * Implement via instanced `ArrowHelper` or pooled custom arrow mesh.
   * **Failure**: If the player returns to the start with zero soldiers, the wave ends as a defeat and the game **immediately restarts at wave 1**.

3. **Progression & Scoring**

   * **Stars**: 1–5 stars per wave based on final survivors ÷ optimal-path:

     * ★1: 0–40 %
     * ★2: 41–60 %
     * ★3: 61–75 %
     * ★4: 76–90 %
     * ★5: 91–100 %
   * **Persistence**: Store best star rating per wave in `localStorage`.
   * **Navigation**: Single “Play” button always advances to next uncompleted wave; after each wave show a **minimalist popup**:

     * “Wave X Complete”
     * ★★☆☆☆ stars
     * “Next” or “Retry”

---

## 3. Architecture & Module Breakdown

* **`GameController`**

  * Orchestrates wave start/end, transitions between forward and retreat phases, win/lose handling.
* **`WaveGenerator`** (procedural)

  * Calculates gate count, selects operations (tiered unlock), computes skirmish sizes, retreat-gate count.
* **`FlockSystem`**

  * GPU boids simulation (based on three.js GPGPU birds).
  * Obstacle avoidance (rocks), cohesion radius, buffer timing for stragglers.
* **`GateSystem`**

  * Spawns math gates, displays floating labels, evaluates player vs optimal choices.
* **`BattleSystem`**

  * Resolves skirmishes and final showdown subtraction, arrow volley logic, enemy spawn/pursuit.
* **`UIManager`**

  * Renders HTML/CSS slider overlay (`<input type="range">` or custom div), floating soldier counts above flocks, gate-pop labels.
  * Summary popup, Play button, responsive layout for mouse/touch.
* **`PersistenceManager`**

  * Wraps `localStorage` for saving/loading star ratings.
* **`Telemetry`** (abstract interface)

  * Default → console logging only; can plug in other analytics later.

---

## 4. Data & Configuration

* **Wave configuration** is **fully procedural**—no external JSON. All parameters derive from formulas and rules in code.
* **Math-expression tiers** and **skirmish percentage (80 %)** are constants defined in `WaveGenerator`.
* **Star thresholds** and **movement speeds** are constants configurable at the top of each relevant module.

---

## 5. Visuals & Performance

* **Models**: Low-poly soldier mesh instanced via `InstancedMesh`. Use e.g. new THREE.BoxGeometry(0.6, 1.2, 0.6); for soldiers. 
* **Boids**: Thousands of agents at 60 fps desktop, 30 fps mobile.
* **HUD**: Minimal floating labels (CSS2DRenderer or sprite text).
* **Slider**: HTML/CSS overlay over the canvas; pointer events for drag/steer.
* **Camera**: Single `PerspectiveCamera` at a fixed angle; follow-rig that lerps to the flock’s center, reversing direction on showdown.
* **Performance Targets**:

  * Desktop → 60 fps, Mobile → 30 fps (select quality preset at startup).
  * No dynamic LOD or quality scaling beyond that.

---

## 6. Build & Deployment

* **Pure ES6 modules**: drop all `.js` files in a `src/` folder; no build step if browser supports modules.
* **Fallback**: If older-browser support is needed, use **Vite + native ESM** with zero-config for fast HMR and bundling.

---

## 7. Error Handling

* **Resource load failures** (models, shaders, textures): catch, log to console, and **retry** up to N attempts before giving up silently.
* **Runtime errors**: surface in console; game continues where possible.

---

## 8. Testing & QA

* **Unit tests only** (Jest or equivalent) covering:

  * Math-gate evaluation and optimal-path logic.
  * `WaveGenerator` formulas (gate count, skirmish sizing, tiered unlock).
  * Star-rating thresholds.
  * Persistence read/write.
  * Telemetry stub behavior.

---

## 9. Documentation

* **Inline JSDoc** on all public classes, methods, and data structures.
* A small `README.md` describing architecture, module responsibilities, and how to run tests.

---

## 10. Analytics & Telemetry

* **Abstract `Telemetry` interface** with methods like `trackEvent(name, payload)`.
* Default implementation logs to console; ready for remote analytics plug-in in future.