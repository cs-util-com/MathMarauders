import { createGameState } from './gameState.js';

describe('game state', () => {
  test('startRun seeds deck and exposes gate options', () => {
    // why this test matters: without predictable seeding the run loop would desync across clients.
    const game = createGameState({ stageCount: 2 });
    game.startRun({ seed: 'alpha', steering: 45 });
    const snapshot = game.getSnapshot();
    expect(snapshot.phase).toBe('forward');
    expect(snapshot.gateOptions).toHaveLength(4);
    expect(snapshot.steering).toBe(45);

    game.updateSteering(70);
    expect(game.getSnapshot().steering).toBe(70);
    game.togglePause();
    expect(game.getSnapshot().isPaused).toBe(true);
    game.togglePause();
    expect(game.getSnapshot().isPaused).toBe(false);

    game.setMuted(true);
    expect(game.getSnapshot().isMuted).toBe(true);
    game.setVfxMode('low');
    expect(game.getSnapshot().vfxMode).toBe('low');
  });

  test('run completion produces results summary', () => {
    // why this test matters: ensures the full forward → skirmish → reverse → end card loop is wired.
    const game = createGameState({ stageCount: 3 });
    game.startRun({ seed: 'omega', steering: 60 });

    for (let stage = 0; stage < 3; stage += 1) {
      const snapshot = game.getSnapshot();
      const gate = snapshot.gateOptions[0];
      game.chooseGate(gate.id);
    }

    const complete = game.getSnapshot();
    expect(complete.phase).toBe('complete');
    expect(complete.results).not.toBeNull();
    expect(complete.results.summary).toContain('s');

    game.updateElapsed(1600);
    expect(game.getSnapshot().elapsedMs).toBeGreaterThan(0);

    game.reset();
    const resetSnapshot = game.getSnapshot();
    expect(resetSnapshot.phase).toBe('forward');
    expect(resetSnapshot.gateOptions).toHaveLength(4);
  });

  test('ignores invalid gate selections safely', () => {
    // why this test matters: protects against UI double clicks or stale gate IDs.
    const game = createGameState({ stageCount: 1 });
    game.updateElapsed(200);
    expect(game.getSnapshot().elapsedMs).toBe(0);
    expect(() => game.chooseGate('0-add')).not.toThrow();
    game.startRun({ seed: 'beta', steering: 55 });
    const snapshotBefore = game.getSnapshot();
    game.togglePause();
    const pausedElapsed = game.getSnapshot().elapsedMs;
    game.updateElapsed(400);
    expect(game.getSnapshot().elapsedMs).toBe(pausedElapsed);
    game.togglePause();
    game.chooseGate('invalid-id');
    const snapshotAfter = game.getSnapshot();
    expect(snapshotAfter.stageIndex).toBe(snapshotBefore.stageIndex);
  });
});
