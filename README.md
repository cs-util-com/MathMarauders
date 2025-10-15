# Math Marauders

## Current state: Playable Web Slice

Math Marauders is a quick-hit, mobile-first arcade run where every wave forces tight arithmetic choices under pressure. Pick a gate to grow or trim your squad, march straight into a deterministic skirmish, then drag a steering slider to outrun the chaser on the sprint back home. Runs are fully seeded, wrap in roughly two minutes, and persist highscores, stars, and starting seeds locally so each attempt can be replayed or shared.

### Feature Highlights

- **Snackable sessions:** 90–180s target length with instant restarts and minimal UI friction.
- **Intuitive controls:** Touch-friendly steering and simple tap interactions make it easy to pick up and play.
- **A clear path:** Your troops march forward, passing gates and engaging enemies in a fixed sequence that’s easy to follow.
- **Forward gate dilemmas:** Two math gates per checkpoint, each with a distinct operation and value. Choose wisely to keep your squad healthy.
- **Deterministic skirmishes:** Volley exchanges resolve on a fixed cadence with transparent casualty tracking, making tuning and replay comparisons straightforward.
- **Reverse chase pressure:** Touch-friendly steering keeps the formation aligned while reverse gates and chaser surges test leftover strength.
- **Persistent arcade loop:** Local storage tracks scores, stars, and seeds, keeping restarts instant and competition alive.

# Next goals: 3D implementation requirements (active scope)

- Ship and iterate on the production three.js scene. UI-only or 2D stand-ins do
  not satisfy this spec.
- Maintain real meshes, instancing, selective bloom, and particle systems in
  line with the “Visual Direction” and “Particles & VFX” sections.
- Drive performance guards from actual renderer metrics; stand-in animations or
  fake effects are prohibited.
- Keep DOM HUD elements lightweight, but all world entities must exist as
  three.js assets with deterministic behaviour.

The remainder of this README is the authoritative implementation brief for the
current game and must be followed as-is.

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

- The camera moves with the players soldiers on a smooth rail path that varies per beat (forward, skirmish, reverse). It follows the center of the soldiers group (player centroid) with a slight lag for smoothness. Camera shakes on big hits.

## 5) UI & HUD (Minimal Arcade)

- **Top-center:** score + wave timer (tabular-nums).
- **Bottom-left:** steering slider (thumb enlarges while dragging, hit-area ≥44×44px).
- **Bottom:** big Start/Restart pill. Only shown when not running.
- **Top-right:** pause menu (resume/restart/mute).
- **Gate labels (in-scene):** giant operator + number, color-coded (+ green, − red, × yellow, ÷ blue); the numeral card is in the **bloom include list**.
- **Number formatting:** compact (1.2k); 
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
  - WebGL scene boots, renders lane/units/trails, and responds to performance guard toggles.

- **Visual checks:** screenshot diff of HUD & gate legibility across DPRs (1.0/2.0/3.0) plus WebGL captures that confirm meshes, bloom, and particle budgets stay within spec.

## 15) Build & Delivery

- **Project shape:** single-page app; ES modules; no mandatory build step (can add bundler later).
- **Assets:** glTF (embedded) or inline BufferGeometry for ultra-light meshes; matcap PNGs (sRGB).
- **Hosting:** static hosting (GitHub Pages/Netlify/etc.).
- **Shareable seed:** via querystring; copy-to-clipboard button on end card (optional later).
- **Documentation:** Inline JSDoc on public APIs; keep architecture and tooling notes current in `README.md`/`docs/`.
- **3D deliverable:** deployments must include the live three.js scene with all world entities active; UI-only fallbacks are not acceptable.

## 16) Non-Goals (v1)

- Multiplayer, accounts, cloud saves.
- Heavy post-processing (DOF, motion blur, OutlinePass).
- Complex physics or per-soldier IK.
- Replacing three.js rendering with DOM-only or flat UI mockups.

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

---

# Iteration plan (TDD, one task each)

The following is an **iteration-by-iteration TDD build plan** that is bottom-up, one focused task per iteration, CI-friendly, and aligned with the locked spec. Each iteration lists goal, prep, tests-first items (with Given/When/Then + short “why this test matters”), implementation notes, and the exact commands to run. After every iteration, append a short note to `docs/implementation-progress.md`.

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

# Notes & guardrails (apply throughout)

2. **TDD:** tests first; minimal implementation; re-run `npm run check` before/after.
3. **“Why this test matters”** comment in every new/changed test.
4. **Search before implement.** If functionality exists, prefer refactor over duplication.
5. **Append learnings** to `docs/implementation-progress.md` after each iteration (serves as project memory & devlog).
6. **CI-friendly:** avoid interactive prompts; stable output; use line reporters.
7. **Performance budgets:** draw calls < 150; active particles ≤ ~250; watch dev HUD (optional) that prints counters.
8. **Keep it 3D:** never replace the three.js scene with UI-only stand-ins; every iteration should evolve the live renderer.
