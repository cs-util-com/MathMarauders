# Math Marauders — Minimal Arcade Loop Prototype

This repository currently ships a lightweight prototype of the Math Marauders loop that runs entirely in the browser with native ES modules. The focus is delivering the forward gate selection, deterministic skirmish simulation, and reverse chase scoring described below so designers can start tuning the arithmetic and pacing without waiting for the full 3D build. Open `index.html` in any static server (e.g. `npm run serve:static`) to play the current iteration.

## 1) Goal & Core Loop

- **Target session length:** 90–180s.
- **Loop:**
  1. **Forward run** → choose math gates (+ / − / × / ÷).
  2. **Skirmish** vs enemy squad (quick volley exchange, deterministic).
  3. **Reverse chase** back toward start; survive to finish.
  4. **End card** with star rating & restart.

- **Pace:** Instant restarts, no loading hitches, minimal UI friction.

## 2) Platforms & Performance

- **Web (mobile-first)**, responsive desktop support.
- **Min perf targets:** 60 FPS on mid-tier mobile; stable 30 FPS on low-end.
- **Draw calls:** < 150 during peak. **Active particles:** ≤ ~250.
- **Fallbacks:** If avg FPS < 50 for 2s → auto degrade (see §8 Perf Guards).

## 3) Visual Direction

- **Style:** Low-poly “Candy Arcade”; bright, juicy, extremely readable.
- **Palette (Mobile-First Snap):**
  - Primary set: `#ff5fa2` (pink), `#33d6a6` (teal), `#ffd166` (yellow), background gradient `#12151a → #1e2633`.
  - **Unit colors:** **Blue vs Orange** — Player `#00d1ff`, Enemy `#ff7a59`.

- **Lighting:** Use **MeshMatcapMaterial** for units/props (lighting-independent). Simple hemi+dir light for environment props (no real shadows).
- **Post-FX:** **FXAA**; **Selective Bloom** only on gate numerals/symbols and arrow trails (intensity ~0.6, threshold ~0.85, smoothing ~0.1). No OutlinePass.

## 4) Camera, Feel & Timing

- **Rig:** **Rail-Follow** (Catmull-Rom) with 3 segments: Forward → Skirmish → Reverse. Prebake ~120 samples/segment.
- **Defaults:**
  - Forward: height 8, behind 10, FOV 60, easeInOutQuad.
  - Skirmish: height 7, behind 12, tiny ±6° yaw sway.
  - Reverse: height 6.5, behind 9, snap-zoom +1.5% FOV at start.
  - Look target: player centroid with lerp 0.12.
  - Shake: 0.25 amp, 90 ms on big hits (≤1/500 ms).

- **Clip:** near/far = 0.1 / 200. Motion blur: none.

## 5) UI & HUD (Minimal Arcade)

- **Top-center:** score + wave timer (tabular-nums).
- **Bottom-left:** steering slider (thumb enlarges while dragging, hit-area ≥44×44px).
- **Bottom:** big Start/Restart pill.
- **Top-right:** pause menu (resume/restart/mute).
- **Gate labels (in-scene):** giant operator + number, color-coded (+ green, − red, × yellow, ÷ blue); the numeral card is in the **bloom include list**.
- **Number formatting:** compact (1.2k); deltas flash 250 ms (green gain / red loss).
- **Transitions:** 120–160 ms fades/slides; no bounces.

## 6) Particles & VFX (Ultra-Lean Clarity)

- **Arrow trails:** billboard quads (instanced), **6 segments**, lifetime **220 ms**, additive blend, 64×64 soft-glow texture. Max concurrent emitters: 12.
- **Hit sparks:** 8 sprite particles on impact, 160 ms, size 6→2 px.
- **Damage flash:** enemy `emissiveIntensity` 0→0.8 over 60 ms, back to 0 in 80 ms.
- **Gate glow:** via selective bloom only on numerals/symbols.
- **Camera juice:** as §4.
- **Auto-degrade:** halve trail segments (3), cap emitters 6, disable sparks when <50 FPS (see §8).

## 7) World, Assets & Props

### 7.1 Terrain — **Candy Speedway**

- **Lane:** 10 m wide strip with two pastel edge lines + dashed center (vertex colors; no textures).
- **Gradient sky/backdrop:** `#12151a → #1e2633`.
- **Fog:** linear start 25 m, end 60 m (masks strip pooling).

### 7.2 Gates — **Pillar Arch + Floating Numeral**

- **Mesh:** Two chunky pillars + shallow arch (≤200 tris).
- **Numeral card:** separate emissive quad above arch; in bloom include list.
- **Dims:** W 3.2 m, H 2.8 m, D 0.4 m.

### 7.3 Units & Arrows — **Ultra-Light kit**

- **Scale:** 1 unit = 1 meter; Y-up.
- **Tris budgets:** Soldier 350–450, Enemy 400–500, Arrow ≤20.
- **Instancing:** players, enemies, arrows, sparks, props.
- **Pivots:** characters at foot center (0,0,0); gate ground center; arrow pivot at tail.

### 7.4 Props — **MEDIUM density (~1 per 10 m)** with **Arcade Flair kit**

- **Baseline:**
  - **Flag post** ≤120 tris, H≈1.6 m.
  - **Cone** ≤80 tris, H≈0.45 m (placed as pairs 0.6 m apart).

- **Flair:**
  - **Track marker** ≤100 tris, H≈0.35 m; two markers 2 m before **every other** gate.

- **Placement rules:** Per 10 m segment place **either** 1 cone pair **or** 1 flag (70/30). Keep ≥0.6 m off lane edge; ≥1.5 m clear of gate pillars. Markers desaturated so numerals remain brightest.
- **Culling:** frustum + CPU early-out > 65 m behind camera.
- **Spawn:** deterministic from run seed.

### 7.5 Obstacles & Straggler Culling

- **Rocks:** Low-poly gumdrop rocks (≤150 tris) intermittently hug the divider with a 0.5 m buffer; they appear on seeded intervals independent of props.
- **Avoidance:** Player flock pathing treats obstacles as soft-collide volumes—agents slide along them but remain within lane bounds.
- **Straggler rule:** Any unit that drifts outside the lane or stays beyond the buffer for >2 s is despawned with a subtle dissolve so the formation stays tight.

## 8) Performance Guards & Feature Flags

- **FPS monitor:** rolling avg over 2 s.
- **Degrade step 1 (auto):** trails 6→3 segments, emitters 12→6, disable sparks, tighten bloom resolution.
- **Upgrade (auto):** if ≥58 FPS for 4 s, revert to full Ultra-Lean.
- **Hard-safe mode:** manual setting “Low” = **No-Bloom Fallback** (no composer bloom; baked trail glow texture).

## 9) Systems & Mechanics

### 9.1 Gate Generation & Math

- **Operators:** Base operations `+a`, `−b`, `×c`, `÷d` (a,b,c,d are per-gate values in ranges tuned per wave).
- **Rounding:**
  - After `+`/`−`: clamp ≥0.
  - After `×`/`÷`: **round to nearest integer**, min 1; clamp to [1, MAX_ARMY].

- **Balance rules:** never generate `−` that would kill all units; `÷` never below 1.
- **Operation tiers:** Waves 1–5 use single-step expressions; waves 6–10 unlock two-step combos (e.g. `×4−2`); waves 11+ may introduce short parenthetical or exponent variants. Every composite gate resolves to the same clamp/round pipeline above.
- **Evaluation pipeline:** Composite gates are generated from a vetted template set (mul-add, add-mul, pow-div, etc.) and evaluate deterministically left-to-right unless parentheses are present. Apply rounding/clamping only after the full expression resolves; intermediate steps must stay ≥0 (designers drop any template that would violate this with configured ranges).
- **Two-gate choice:** place two gates per decision point; values drawn to create meaningful deltas (≥15% difference at early waves, ≥25% later).
- **Color coding:** + green, − red, × yellow, ÷ blue.

### 9.2 Forward Run

- **Speed:** base lane speed `v0`, ramps up slightly each wave.
- **Steer input:** horizontal factor ∈ [−1, +1] from slider.
- **Flock simulation:** Use a lightweight GPU boids pass (inspired by three.js GPGPU birds) to keep large formations cohesive while responding to steering and obstacle avoidance. For low-spec fallback, degrade to CPU formation offsets.

### 9.3 Skirmish Resolution (deterministic & fast)

- **Tick:** every 150 ms both sides exchange damage.
- **Damage model:** `damage = base * min(attackerCount, defenderCount) ^ 0.85`.
- **Casualty calc:** casualties per tick = `ceil(damage / HP_PER_UNIT)`; clamp ≤ current count.
- **Enemy sizing:** Enemy squads spawn at ~80% of the optimal player count projected for that decision, keeping pressure while preserving a winnable path.
- **Volleys:** spawn **arrow particles** proportional to casualties (capped) for visual feedback.
- **End of skirmish:** side reaching 0 loses; survivor proceeds with remaining units. Time to kill must fit the snackable pace (2–4 ticks typical).
- **Determinism:** seeded RNG for slight spread; same seed → same result.

### 9.4 Reverse Chase

- **Setup:** spawn a chasing enemy horde at distance `D0`; speed slightly higher than player (`vChase = v0*1.05`).
- **Gate mirror:** Reverse phase reuses the forward-run gate count for the current wave, with the same math rules applied to shrinking army sizes.
- **Volley pressure:** Fire an automatic arrow volley every 0.8 s sized to ~10% of the current player army; arrows target and remove chasers on hit using the skirmish arrow FX/pools.
- **Speed profile:** Baseline forward/reverse travel speed is 6 m/s; clearing a reverse gate triggers a 1 s chase surge where the horde spikes to 8 m/s before easing back to baseline.
- **Win/Lose:** reach finish line with ≥1 unit → win; if caught or unit count hits 0 → fail; a failed chase resets progression to wave 1 before the next attempt.
- **Difficulty envelope:** Tune surge distance and volley effectiveness so a player who maintains ≥70% of the optimal count survives with a small buffer, while dropping below ~50% creates a credible fail risk without feeling impossible.

### 9.5 Scoring, Stars, & Persistence

- **Score:** gated on efficiency and remaining units. Example:
  - Gate choice bonus (+perfect bonus if >90% of theoretical optimum across decisions).
  - Skirmish speed bonus (fewer ticks).
  - Survival multiplier for reverse chase.

- **Star bands:** 1★ / 2★ / 3★ at ~40% / 70% / 90% of level’s theoretical max.
- **Persistence:** LocalStorage stores `{ highScore, bestStars, lastSeed }` plus a per-wave map of best star ratings to drive progression UI.
- **Wave flow:** After each wave, show a minimalist "Wave X Complete" popup with the current 1–3★ result (optionally show a 5★ breakdown for deeper post-run insights) and `Next` / `Retry` options; the global Play button advances to the next unfinished wave by default.
- **Seeded runs:** shareable seed param (`?seed=XXXX`).

### 9.6 Wave Structure & Progression

- **Gate counts:** Wave 1 features 5 forward-run gates; each new wave adds +1 gate (tunable cap) before transitioning to the skirmish beat and mirrored reverse run.
- **Deterministic pairing:** Forward and reverse gate sets derive from the same seeded generator so that a given `seed+wave` produces identical layouts across sessions.

## 10) Architecture & Code Structure

- **Stack:** `three.js` + pmndrs **postprocessing** (FXAA, Selective Bloom). Optional **troika-three-text** for desktop counters (mobile uses DOM).
- **Renderer:** `antialias:false` (AA via composer), powerPreference `"high-performance"`.
- **Core modules:**
  - `Game.ts` (state machine: PreRun → Running → Skirmish → Reverse → EndCard).
  - `World.ts` (lane pooling, fog, gradient backdrop).
  - `Gates.ts` (spawn, math values, color, bloom list control).
  - `Units.ts` (instancing, counts, simple formation layout).
  - `Combat.ts` (skirmish ticks, damage model, arrow spark emit).
  - `VFX.ts` (trails, sparks, flashes; performance guards).
  - `CameraRig.ts` (rail samples, beat transitions, shake).
  - `UI.tsx` or `ui.ts` (DOM HUD & slider; pause; end card).
  - `Flock.ts` (GPU boids update step + CPU fallback, straggler cleanup hooks).
  - `SeedRng.ts` (seedable PRNG).
  - `Perf.ts` (FPS monitor, degrade/upgrade).
  - `Telemetry.ts` (abstract event interface with `trackEvent(name, payload)`; default console logger; ready for external analytics).

- **Object pooling:** arrows, sparks, props are pooled; **InstancedMesh** per type; per-instance attributes for color/scale/opacity.
- **Selective bloom list:** numeral cards, trail material. Everything else excluded.

## 11) Data & Config

```json
{
  "VFX": {
    "TRAIL_SEGMENTS": 6,
    "TRAIL_LIFETIME_MS": 220,
    "SPARK_COUNT": 8,
    "BLOOM_INTENSITY": 0.6,
    "BLOOM_THRESHOLD": 0.85,
    "BLOOM_SMOOTHING": 0.1,
    "SHAKE_AMP": 0.25,
    "SHAKE_MS": 90
  },
  "CAMERA": {
    "FOV": 60,
    "FORWARD": { "height": 8, "behind": 10 },
    "SKIRMISH": { "height": 7, "behind": 12, "yawSwayDeg": 6 },
    "REVERSE": { "height": 6.5, "behind": 9 },
    "LOOK_LERP": 0.12
  },
  "TERRAIN": { "FOG_START": 25, "FOG_END": 60 },
  "GATES": { "WIDTH": 3.2, "HEIGHT": 2.8, "DEPTH": 0.4 },
  "PROPS": { "DENSITY": "MEDIUM" }
}
```

## 12) Controls & Accessibility

- **Controls:** one-hand slider, tap buttons; Arrow keys/A/D on desktop as mirror input (optional).
- **Readability:** high contrast HUD; color-coding supplemented by symbols/operators (color-blind friendly).
- **Haptics (optional mobile):** short vibration on perfect gate and win.

## 13) Error Handling & Edge Cases

- **WebGL unavailable:** show lightweight fallback screen with instructions to enable hardware acceleration.
- **Lost context / tab hidden:** pause and show resume.
- **Bad seed / params:** validate and clamp to defaults.
- **Division gates:** enforce min result 1 after rounding; never generate `÷0` or `÷` that yields <1.

## 14) Testing Plan (high level)

- **Unit (Jest):**
  - Gate math & rounding rules (Given/When/Then).
  - Gate generator never emits invalid combos.
  - Combat tick determinism for a fixed seed.
  - Performance guard thresholds (simulate FPS series).
  - Score & star band calculations.
  - Telemetry adapter routes events to console without throwing.

- **Integration (Playwright):**
  - Start → finish happy path; restart is instant.
  - Two known seeds produce identical runs and scores.
  - UI responsiveness: slider drag latency under threshold.

- **Visual checks:** screenshot diff of HUD & gate legibility across DPRs (1.0/2.0/3.0).

## 15) Build & Delivery

- **Project shape:** single-page app; ES modules; no mandatory build step (can add bundler later).
- **Assets:** glTF (embedded) or inline BufferGeometry for ultra-light meshes; matcap PNGs (sRGB).
- **Hosting:** static hosting (GitHub Pages/Netlify/etc.).
- **Shareable seed:** via querystring; copy-to-clipboard button on end card (optional later).
- **Documentation:** Inline JSDoc on public APIs; keep architecture and tooling notes current in `README.md`/`docs/`.

## 16) Non-Goals (v1)

- Multiplayer, accounts, cloud saves.
- Heavy post-processing (DOF, motion blur, OutlinePass).
- Complex physics or per-soldier IK.

---

# Repo layout & tooling (once, before Iteration 1)

```
/src
  /core        // pure logic (rng, math, scores, perf, state)
  /world       // lane, props, gates (data + spawn policies)
  /units       // formations, combat, pooling
  /render      // three.js glue (composer, matcaps, instancing, trails)
  /ui          // DOM UI (slider, HUD, dialogs)
  /game        // state machine, wiring
/tests
  /unit
  /integration
/docs
  implementation-progress.md
public/index.html   // ESM entry, no bundler required (import maps optional)
```

**Tooling & scripts (package.json)**

- `"test": "jest --runInBand"`
- `"test:watch": "jest --watch"`
- `"lint": "eslint . --max-warnings=0"`
- `"e2e": "playwright test --reporter=line"`
- `"check": "npm run lint && npm run test && npm run e2e"`

> CI-friendly, non-interactive reporters; Node 20+, Jest + JSDOM, Playwright for e2e.

---

# Iteration plan (TDD, one task each)

The following is an **iteration-by-iteration TDD build plan** that is bottom-up, one focused task per iteration, CI-friendly, and aligned with the locked spec. Each iteration lists goal, prep, tests-first items (with Given/When/Then + short “why this test matters”), implementation notes, and the exact commands to run. After every iteration, append a short note to `docs/implementation-progress.md`.

## Iteration 1 — Seedable RNG

**Goal:** Deterministic seeds for gates/props/skirmish spread.
**Prep:** `ripgrep` to ensure no prior RNG.
**Tests (unit):**

- _Given_ seed `1234`, _When_ generating 5 numbers, _Then_ the sequence equals a stored snapshot.
  _why this test matters: locks determinism across machines._
- _Given_ two RNGs with the same seed, _When_ advanced in different batch sizes but same total draws, _Then_ final value matches.
  _why: prevents subtle order bugs._
  **Impl notes:** xorshift32 or mulberry32; exposes `nextFloat()`, `nextInt(min,max)`.
  **Run:** `npm run test && npm run lint`
  **Doc:** Add decisions & sequence snippet to `docs/implementation-progress.md`.

---

## Iteration 2 — Gate Math & Rounding

**Goal:** Central evaluator for `+/-/×/÷` with clamping/rounding per spec.
**Tests (unit):**

- `applyGate(10, "+5") → 15`, `("-20") clamps to 0`. _why: correctness of additive rules._
- `applyGate(10, "×1.5") → 15 (nearest)`, `("÷3.2") → 3 (nearest, min 1)`. _why: rounding consistency._
- Never returns `< 1` after ×/÷. _why: gameplay safety._
  **Impl notes:** pure function; no side effects.
  **Run:** `npm run test`

---

## Iteration 3 — Gate Generator

**Goal:** Produce two valid gate choices with meaningful deltas per wave.
**Tests (unit):**

- Never yields `÷0` or a `−` that kills all units. _why: fail-safe content._
- Delta between options ≥15% (early waves) / ≥25% (later). _why: decision salience._
- Deterministic for a given seed+wave. _why: shareable seeds._
  **Run:** `npm run test`

---

## Iteration 4 — Score & Star Bands

**Goal:** Score formula + 1★/2★/3★ thresholds.
**Tests (unit):**

- Perfect decisions + fast skirmishes reach ≥3★; sloppy reaches <2★ on same seed. _why: curve feels right._
- Band values serialize and re-load correctly. _why: stable end cards._
  **Run:** `npm run test`

---

## Iteration 5 — FPS Monitor & Perf Guards (logic only)

**Goal:** Rolling FPS average + degrade/upgrade signals.
**Tests (unit):**

- _Given_ series below 50 FPS for 2s, _Then_ emits `DEGRADE_STEP1`. _why: protects mobile perf._
- _Given_ ≥58 FPS for 4s, _Then_ emits `UPGRADE`. _why: recovers visuals._
  **Run:** `npm run test`

---

## Iteration 6 — Object Pool (generic)

**Goal:** Reusable pool for arrows/sparks.
**Tests (unit):**

- `acquire` returns recycled instances after `release`. _why: GC stability._
- Pool caps prevent growth beyond limit. _why: predictable memory._
  **Run:** `npm run test`

---

## Iteration 7 — Unit Formation & Counts

**Goal:** Transform count → formation slots (grid arc) with pivot at (0,0,0).
**Tests (unit):**

- 1, 10, 100 units produce non-overlapping positions. _why: visual clarity._
- Formation width/height scales smoothly with count. _why: camera framing._
  **Run:** `npm run test`

---

## Iteration 8 — Combat Tick Simulator (deterministic)

**Goal:** 150 ms volleys; casualties per spec; seedable spread.
**Tests (unit):**

- Fixed attacker/defender counts + seed → deterministic time-to-kill. _why: repeatable runs._
- Casualties never exceed current counts. _why: integrity._
- “Fast win” vs “near parity” produce different tick lengths. _why: pacing._
  **Run:** `npm run test`

---

## Iteration 9 — World Lane Pooling (logic)

**Goal:** Segment recycling, fog window 25→60 m.
**Tests (unit):**

- Camera moving forward reuses segments without gaps/overlap. _why: endless lane._
- Reverse direction mirrors reuse. _why: chase beat support._
  **Run:** `npm run test`

---

## Iteration 10 — Gate Placement Policy

**Goal:** Place two gates per decision, safe distances from pillars/centerline.
**Tests (unit):**

- Gates never overlap; spacing before/after respects min distance. _why: fairness & readability._
- Operator→color mapping correct. _why: accessibility/consistency._
  **Run:** `npm run test`

---

## Iteration 11 — Props Generator (MEDIUM density)

**Goal:** Deterministic flags/cones/markers per 10 m; culling >65 m behind.
**Tests (unit):**

- Seeded prop positions are reproducible; never intersect gates or lane center. _why: stable scenery._
- Density ≈ 1 per 10 m over long run. _why: visual rhythm._
  **Run:** `npm run test`

---

## Iteration 12 — Camera Rail Sampler

**Goal:** Prebaked Catmull-Rom samples for Forward/Skirmish/Reverse.
**Tests (unit):**

- Sampling at t∈[0..1] returns continuous, monotonic path; lookAt lerp stable. _why: jitter-free._
- Beat transitions respect durations (200–220 ms). _why: timing._
  **Run:** `npm run test`

---

## Iteration 13 — UI Slider (DOM) + Input Pipe

**Goal:** Accessible slider → normalized steer ∈ [−1, +1].
**Tests (integration, Playwright):**

- Drag/Touch adjusts value smoothly; keyboard A/D mirrors on desktop. _why: control parity._
- Hit area ≥44 px; thumb enlarges while active. _why: mobile ergonomics._
  **Run:** `npm run e2e`

---

## Iteration 14 — HUD Numbers & Delta Flashes

**Goal:** Top-center score/timer; compact format; ±delta flash 250 ms.
**Tests (integration):**

- Numbers align (tabular-nums); deltas animate and auto-clear. _why: glanceable feedback._
- Pause hides timer, resume restores. _why: state integrity._
  **Run:** `npm run e2e`

---

## Iteration 15 — Game State Machine

**Goal:** PreRun → Running → Skirmish → Reverse → EndCard transitions.
**Tests (unit):**

- Given seed X, driving inputs across beats reaches EndCard without illegal transitions. _why: flow safety._
- Restart returns to PreRun with clean state. _why: instant retries._
  **Run:** `npm run test`

---

## Iteration 16 — Three.js Boot & Composer (FXAA only)

**Goal:** Renderer (`antialias:false`), FXAA in composer, gradient backdrop, fog.
**Tests (integration/smoke):**

- Canvas mounts; frame count > 0; gradient & fog uniforms applied. _why: render pipeline sanity._
- Toggling low-perf flag disables bloom path (stub for now). _why: future guard._
  **Run:** `npm run e2e`

---

## Iteration 17 — Instanced Units & Formation Render

**Goal:** Single `InstancedMesh` for player/enemy; matcap material.
**Tests (integration/visual diff):**

- Counts 1→100 render within formation bounds (screenshots diff threshold). _why: layout fidelity._
- Material sRGB output toggled correctly. _why: color correctness._
  **Run:** `npm run e2e`

---

## Iteration 18 — Gates Render: Pillar Arch + Floating Numeral

**Goal:** Gate mesh (≤200 tris) + emissive numeral quad in bloom-include list.
**Tests (integration):**

- Gate symbols color-coded; two choices visible and non-overlapping. _why: legibility._
- Numeral cards flagged for bloom list (data check now; visual in next iteration). _why: post-FX hookup._
  **Run:** `npm run e2e`

---

## Iteration 19 — Selective Bloom (numerals + arrow trails)

**Goal:** Add Bloom effect; include only numeral/arrow materials.
**Tests (integration/visual):**

- Numeral quads glow; pillars do not; FXAA retained. _why: attention focus._
- Fallback flag disables bloom cleanly. _why: low-end mode._
  **Run:** `npm run e2e`

---

## Iteration 20 — Arrow Trails (instanced billboards) + Hit Sparks

**Goal:** Ultra-Lean: 6 segments, 220 ms lifetime; sparks burst on casualties.
**Tests (integration):**

- Max emitters capped; lifetime respected; object pool reuse verified (counter). _why: perf ceiling._
- Trail materials on bloom include list only. _why: effect budget._
  **Run:** `npm run e2e`

---

## Iteration 21 — Skirmish Wiring (logic→VFX)

**Goal:** Drive volleys from combat ticks; damage flash (emissive pop).
**Tests (integration):**

- Known seed results in expected volley count & duration; end state matches unit tests. _why: logic/render parity._
- Flash intensity animates 0→0.8→0 over 140 ms. _why: feedback timing._
  **Run:** `npm run e2e`

---

## Iteration 22 — Reverse Chase

**Goal:** Spawn chase horde at D0; speed vChase=1.05×; win/lose.
**Tests (integration):**

- With low player count, fail condition triggers before finish; with high, succeed. _why: balance envelope._
- Transition adds snap-zoom +1.5% FOV. _why: beat emphasis._
  **Run:** `npm run e2e`

---

## Iteration 23 — Props (MEDIUM) & Culling

**Goal:** Flags, cones, track markers with placement rules & CPU early-out.
**Tests (integration):**

- Density ~1/10 m over 300 m lane; no intersections with gates/lane center. _why: spatial rules._
- Frustum + “>65 m behind” culling active (counter stats). _why: perf._
  **Run:** `npm run e2e`

---

## Iteration 24 — Scoring, Stars, End Card, Restart

**Goal:** Show score, 1–3★ bands; Restart resets instantly; share seed link.
**Tests (integration):**

- Perfect path seed ≥3★; sloppy ≤2★ (using fixed run). _why: reward curve._
- Restart clears transient state (pools, counts, timers). _why: replay loop._
  **Run:** `npm run e2e`

---

## Iteration 25 — Perf Guards Hookup (runtime)

**Goal:** Wire FPS monitor to degrade/upgrade VFX.
**Tests (integration):**

- Simulated low FPS → trails segments halve, sparks off, bloom res reduced; recovery restores. _why: mobile resilience._
  **Run:** `npm run e2e`

---

## Iteration 26 — Accessibility & UX Polishing

**Goal:** Color contrast ≥ 4.5:1 HUD; operator symbols alongside colors; pause/resume clarity.
**Tests (integration):**

- Automated contrast check for HUD foreground vs gradient (threshold). _why: readability._
- Gate readability snapshot tests across DPR 1.0/2.0/3.0. _why: device coverage._
  **Run:** `npm run e2e`

---

# Developer workflow per iteration (repeatable)

1. **Pre-check:** `rg "<keyword>" -n` to avoid re-implementing existing logic; refactor if present.
2. **Write tests first** (unit or e2e). Include a brief `// why this test matters: ...` comment.
3. **Implement minimal code** to pass tests.
4. **Run checks:** `npm run check` (lint + unit + e2e).
5. **Docs update:** append to `docs/implementation-progress.md`:
   - _What changed, why it matters, decisions, open questions, next iteration._

6. **Commit message:** `feat(core|world|ui|render): <iteration title> [#iteration-XX]`.

---

# Example Given/When/Then snippets (ready to paste)

**Unit (Jest):**

```ts
// tests/unit/gates.math.test.ts
// why this test matters: rounding and clamps underpin all counts; one mismatch cascades into wrong difficulty.
test('× and ÷ rounding & clamps', () => {
  expect(applyGate(10, { op: 'mul', val: 1.5 })).toBe(15);
  expect(applyGate(10, { op: 'div', val: 3.2 })).toBe(3);
  expect(applyGate(1, { op: 'div', val: 3.2 })).toBe(1);
});
```

**Integration (Playwright):**

```ts
// tests/integration/hud.delta.spec.ts
// why this test matters: players must read gains/losses instantly; animation regressions are common.
test('delta flashes for 250ms then clears', async ({ page }) => {
  await page.goto('/public/index.html?seed=test-seed');
  await startRun(page);
  await chooseGate(page, 'mul', 1.5);
  const delta = page.getByTestId('hud-delta');
  await expect(delta).toBeVisible();
  await page.waitForTimeout(300);
  await expect(delta).toBeHidden();
});
```

---

# Notes & guardrails (apply throughout)

1. **One task per iteration.** Keep PRs small and focused.
2. **TDD:** tests first; minimal implementation; re-run `npm run check` before/after.
3. **“Why this test matters”** comment in every new/changed test.
4. **Search before implement.** If functionality exists, prefer refactor over duplication.
5. **Append learnings** to `docs/implementation-progress.md` after each iteration (serves as project memory & devlog).
6. **CI-friendly:** avoid interactive prompts; stable output; use line reporters.
7. **Performance budgets:** draw calls < 150; active particles ≤ ~250; watch dev HUD (optional) that prints counters.
