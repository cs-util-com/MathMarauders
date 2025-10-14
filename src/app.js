import { createPerformanceGuard } from './logic/performance.js';
import { createGameState } from './state/gameState.js';
import { createHud } from './ui/hud.js';
import { renderGateOptions } from './ui/gatePanel.js';
import { renderResultsCard } from './ui/resultsCard.js';
import { renderReverseStatus } from './ui/reverseStatus.js';
import { renderSkirmishLog } from './ui/skirmishLog.js';
import { setupPauseMenu } from './ui/pauseMenu.js';

function getSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('seed');
}

export function initApp(rootDocument = document) {
  const appRoot = rootDocument.getElementById('app');
  const gateGrid = rootDocument.querySelector('[data-testid="gate-grid"]');
  const skirmishLogEl = rootDocument.querySelector(
    '[data-testid="skirmish-log"]'
  );
  const reverseStatusEl = rootDocument.querySelector(
    '[data-testid="reverse-status"]'
  );
  const resultsCardEl = rootDocument.querySelector(
    '[data-testid="results-card"]'
  );
  const scoreValueEl = rootDocument.querySelector('.hud__score-value');
  const timerValueEl = rootDocument.querySelector('.hud__timer-value');
  const deltaEl = rootDocument.querySelector('[data-testid="hud-delta"]');
  const startButton = rootDocument.querySelector(
    '[data-testid="start-button"]'
  );
  const steeringSlider = rootDocument.querySelector(
    '[data-testid="steering-slider"]'
  );
  const steeringValue = rootDocument.querySelector(
    '[data-testid="steering-value"]'
  );

  const game = createGameState();
  let performanceGuard;

  const pauseMenu = setupPauseMenu(
    {
      overlay: rootDocument.querySelector('[data-testid="pause-overlay"]'),
      pauseButton: rootDocument.querySelector('[data-testid="pause-button"]'),
      resumeButton: rootDocument.querySelector('[data-testid="resume-button"]'),
      restartButton: rootDocument.querySelector(
        '[data-testid="restart-button"]'
      ),
      muteToggle: rootDocument.querySelector('[data-testid="mute-toggle"]'),
      lowModeToggle: rootDocument.querySelector(
        '[data-testid="low-mode-toggle"]'
      ),
    },
    {
      onPause: () => {
        const snapshot = game.getSnapshot();
        if (!snapshot.isPaused) {
          game.togglePause();
        }
      },
      onResume: () => {
        const snapshot = game.getSnapshot();
        if (snapshot.isPaused) {
          game.togglePause();
        }
      },
      onRestart: () => {
        game.reset();
      },
      onMuteChange: (muted) => {
        game.setMuted(muted);
      },
      onLowModeToggle: (enabled) => {
        performanceGuard?.forceLowMode(enabled);
        game.setVfxMode(enabled ? 'low' : 'ultra');
        const degradedActive =
          enabled || (performanceGuard?.isDegraded?.() ?? false);
        appRoot.classList.toggle('degraded', degradedActive);
      },
    }
  );

  const hud = createHud({ scoreValueEl, timerValueEl, deltaEl });

  performanceGuard = createPerformanceGuard({
    onDegrade: () => {
      appRoot.classList.add('degraded');
      game.setVfxMode('low');
    },
    onRecover: () => {
      appRoot.classList.remove('degraded');
      game.setVfxMode('ultra');
    },
  });
  performanceGuard.start();

  let isPaused = false;

  function handleUpdate(snapshot) {
    const derivedScore = snapshot.results
      ? snapshot.score
      : snapshot.playerCount * 12;
    hud.updateScore(derivedScore);
    hud.updateTimer(snapshot.elapsedMs);
    hud.updateDelta(snapshot.delta);
    steeringValue.textContent = `${Math.round(snapshot.steering)}%`;

    renderGateOptions(gateGrid, snapshot.gateOptions, {
      onSelect: (gate) => game.chooseGate(gate.id),
    });
    renderSkirmishLog(skirmishLogEl, snapshot.skirmishLog);
    renderReverseStatus(reverseStatusEl, snapshot.reverse);
    renderResultsCard(resultsCardEl, snapshot.results, {
      survivors: snapshot.playerCount,
    });

    pauseMenu.setMute(snapshot.isMuted);
    pauseMenu.setLowMode(snapshot.vfxMode === 'low');
    isPaused = snapshot.isPaused;

    startButton.textContent =
      snapshot.phase === 'idle' ? 'Start Run' : 'Restart Run';
  }

  game.on('update', handleUpdate);

  function updateSteeringLabel() {
    const value = Number.parseInt(steeringSlider.value, 10);
    steeringValue.textContent = `${value}%`;
  }

  steeringSlider.addEventListener('input', (event) => {
    const value = Number.parseInt(event.target.value, 10);
    game.updateSteering(value);
    updateSteeringLabel();
  });

  startButton.addEventListener('click', () => {
    game.startRun({
      seed: getSeedFromUrl(),
      steering: Number.parseInt(steeringSlider.value, 10),
    });
  });

  updateSteeringLabel();
  handleUpdate(game.getSnapshot());

  let lastTimestamp = null;
  function tick(timestamp) {
    if (lastTimestamp !== null && !isPaused) {
      const delta = timestamp - lastTimestamp;
      game.updateElapsed(delta);
    }
    lastTimestamp = timestamp;
    window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);

  return {
    game,
    hud,
    performanceGuard,
  };
}
