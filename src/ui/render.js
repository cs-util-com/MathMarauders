import { formatCompactNumber, formatTimer } from '../utils/format.js';

export function createRenderer(elements) {
  const previous = {
    units: null,
    score: null,
  };

  return function render(state) {
    renderScoreboard(state, elements, previous);
    renderPhase(state, elements);
    renderGateOptions(state, elements);
    renderLogs(state, elements);
    renderEndCard(state, elements);
    renderPauseMenu(state, elements);
    renderMeta(state, elements);
  };
}

function renderScoreboard(state, elements, previous) {
  const {
    scoreValue,
    timeValue,
    unitsValue,
    unitsDelta,
    effectsValue,
    pauseStatus,
  } = elements.scoreboard;
  const displayScore = state.score?.total ?? 0;
  scoreValue.textContent = formatCompactNumber(displayScore);
  timeValue.textContent = formatTimer(state.elapsedSeconds);
  const previousUnits = previous.units;
  const currentUnits = state.units.current;
  unitsValue.textContent = formatCompactNumber(currentUnits);
  effectsValue.textContent =
    state.effectsMode === 'ultra' ? 'Ultra-Lean' : 'Low';
  pauseStatus.textContent = state.isPaused ? 'Paused' : 'Live';

  if (previousUnits !== null && previousUnits !== currentUnits) {
    const delta = currentUnits - previousUnits;
    const sign = delta > 0 ? '+' : '';
    unitsDelta.textContent = `${sign}${delta}`;
    unitsDelta.dataset.deltaTone = delta >= 0 ? 'positive' : 'negative';
    unitsDelta.classList.add('delta--active');
    setTimeout(() => {
      unitsDelta.classList.remove('delta--active');
    }, 260);
  }
  previous.units = currentUnits;
  previous.score = displayScore;
}

function renderPhase(state, elements) {
  const { phaseValue, waveValue, muteBadge } = elements.hud;
  const phaseLabel = mapPhaseToLabel(state.phase, state.isPaused);
  phaseValue.textContent = phaseLabel;
  waveValue.textContent = `Wave ${state.wave}`;
  muteBadge.hidden = !state.muted;
}

function mapPhaseToLabel(phase, isPaused) {
  if (isPaused) {
    return 'Paused';
  }
  switch (phase) {
    case 'idle':
      return 'Ready';
    case 'forward':
      return 'Forward Run';
    case 'skirmish':
      return 'Skirmish';
    case 'reverse':
      return 'Reverse Chase';
    case 'end':
      return 'End Card';
    default:
      return phase;
  }
}

function renderGateOptions(state, elements) {
  const { gateContainer, forwardHint } = elements.forward;
  gateContainer.innerHTML = '';

  if (state.phase !== 'forward') {
    forwardHint.textContent =
      state.forward.decisionIndex >= state.forward.totalDecisions
        ? 'All gates cleared.'
        : 'Awaiting next run.';
    return;
  }

  forwardHint.textContent = `Pick gate ${state.forward.decisionIndex + 1} of ${state.forward.totalDecisions}`;
  const currentSet = state.forward.current;
  if (!currentSet) {
    return;
  }

  currentSet.options.forEach((option) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `gate-card gate-card--${option.dominantTone}`;
    card.dataset.optionId = option.id;
    card.innerHTML = `
      <span class="gate-card__label">${option.label}</span>
      <span class="gate-card__description">${option.description}</span>
    `;
    gateContainer.appendChild(card);
  });
}

function renderLogs(state, elements) {
  const { logList } = elements;
  logList.innerHTML = '';
  const recent = state.logs.slice(-6).reverse();
  recent.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = entry;
    logList.appendChild(item);
  });
}

function renderEndCard(state, elements) {
  const { endCard, starList, summary, restartCta } = elements.end;
  if (state.phase !== 'end' || !state.score) {
    endCard.hidden = true;
    restartCta.textContent = 'Start Run';
    return;
  }

  endCard.hidden = false;
  summary.textContent = `Score ${formatCompactNumber(state.score.total)} | Units ${state.units.current}`;
  restartCta.textContent = 'Restart';
  starList.innerHTML = '';
  for (let i = 1; i <= 3; i += 1) {
    const star = document.createElement('span');
    star.className = `star ${i <= state.stars.stars ? 'star--filled' : ''}`;
    star.textContent = '★';
    starList.appendChild(star);
  }
}

function renderPauseMenu(state, elements) {
  const { pauseButton } = elements.controls;
  const { muteButton, effectsButton } = elements.pauseMenu;
  pauseButton.textContent = state.isPaused ? 'Resume' : 'Pause';
  if (state.isPaused) {
    pauseButton.classList.add('control--active');
  } else {
    pauseButton.classList.remove('control--active');
  }

  muteButton.textContent = state.muted ? 'Unmute' : 'Mute';
  effectsButton.textContent =
    state.effectsMode === 'ultra' ? 'Switch to Low FX' : 'Switch to Ultra FX';
}

function renderMeta(state, elements) {
  const { seedValue, chaseStatus } = elements.meta;
  seedValue.textContent = state.seed;
  const reverse = state.reverse;
  if (!reverse) {
    chaseStatus.textContent = 'Horde quiet...';
    return;
  }
  switch (reverse.outcome) {
    case 'escape':
      chaseStatus.textContent = `Escape in ${reverse.timeElapsed.toFixed(1)}s`;
      break;
    case 'caught':
      chaseStatus.textContent = 'Caught by the horde';
      break;
    case 'eliminated':
      chaseStatus.textContent = 'Units exhausted';
      break;
    default:
      chaseStatus.textContent = 'Chase unresolved';
  }
}
