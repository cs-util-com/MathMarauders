import {STAR_THRESHOLDS} from '../core/constants.js';

const STAR_SYMBOL = '★';
const EMPTY_STAR_SYMBOL = '☆';

function formatStars(count) {
  return `${STAR_SYMBOL.repeat(count)}${EMPTY_STAR_SYMBOL.repeat(5 - count)}`;
}

/**
 * Lightweight HTML UI used to orchestrate the simulation without WebGL.
 */
export class UIManager {
  /**
   * @param {HTMLElement} root
   */
  constructor(root = document.body) {
    this.root = root;
    this.onPlay = () => {};
    this.onGateCommit = () => {};
    this.stateView = null;
    this.popup = null;
    this.slider = null;
    this.leftLabel = null;
    this.rightLabel = null;
    this.choiceLabel = null;
    this.gateButton = null;
    this.phaseLabel = null;
    this.waveLabel = null;
    this.gateLabel = null;
    this.enemyLabel = null;
    this.playerLabel = null;
    this.statusLabel = null;
    this.starsLabel = null;
  }

  /**
   * Builds the DOM structure and wires events.
   * @param {object} params
   * @param {() => void} params.onPlay
   * @param {(choice: 'left'|'right') => void} params.onGateCommit
   */
  initialize({onPlay, onGateCommit}) {
    this.onPlay = onPlay;
    this.onGateCommit = onGateCommit;
    this.root.innerHTML = '';
    this.root.classList.add('math-marauders');
    this.root.append(this.#buildLayout());
  }

  #buildLayout() {
    const container = document.createElement('div');
    container.className = 'hud';

    const header = document.createElement('header');
    header.className = 'hud__header';

    this.waveLabel = document.createElement('span');
    this.waveLabel.className = 'hud__wave';
    this.waveLabel.textContent = 'Wave —';

    this.phaseLabel = document.createElement('span');
    this.phaseLabel.className = 'hud__phase';
    this.phaseLabel.textContent = 'Phase: —';

    header.append(this.waveLabel, this.phaseLabel);

    const status = document.createElement('div');
    status.className = 'hud__status';

    this.playerLabel = document.createElement('div');
    this.playerLabel.className = 'hud__army hud__army--player';
    this.playerLabel.textContent = 'Player: 0';

    this.enemyLabel = document.createElement('div');
    this.enemyLabel.className = 'hud__army hud__army--enemy';
    this.enemyLabel.textContent = 'Enemy: 0';

    this.starsLabel = document.createElement('div');
    this.starsLabel.className = 'hud__stars';
    this.starsLabel.textContent = `${STAR_SYMBOL.repeat(5)}`;

    status.append(this.playerLabel, this.enemyLabel, this.starsLabel);

    const gatePanel = document.createElement('section');
    gatePanel.className = 'hud__gate-panel';

    this.gateLabel = document.createElement('h2');
    this.gateLabel.className = 'hud__gate-title';
    this.gateLabel.textContent = 'Gate';

    const optionRow = document.createElement('div');
    optionRow.className = 'hud__gate-options';

    this.leftLabel = document.createElement('div');
    this.leftLabel.className = 'hud__gate-option hud__gate-option--left';
    this.leftLabel.textContent = 'Left';

    this.rightLabel = document.createElement('div');
    this.rightLabel.className = 'hud__gate-option hud__gate-option--right';
    this.rightLabel.textContent = 'Right';

    optionRow.append(this.leftLabel, this.rightLabel);

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '100';
    this.slider.value = '50';
    this.slider.className = 'hud__gate-slider';

    this.choiceLabel = document.createElement('div');
    this.choiceLabel.className = 'hud__choice';
    this.choiceLabel.textContent = 'Slide to choose';

    this.gateButton = document.createElement('button');
    this.gateButton.className = 'hud__button';
    this.gateButton.type = 'button';
    this.gateButton.textContent = 'Engage Gate';

    this.statusLabel = document.createElement('p');
    this.statusLabel.className = 'hud__log';

    const playButton = document.createElement('button');
    playButton.className = 'hud__button hud__button--primary';
    playButton.type = 'button';
    playButton.textContent = 'Play Wave';

    gatePanel.append(
      this.gateLabel,
      optionRow,
      this.slider,
      this.choiceLabel,
      this.gateButton,
      playButton,
      this.statusLabel
    );

    this.slider.addEventListener('input', () => this.#updateChoicePreview());
    this.gateButton.addEventListener('click', () => this.#commitChoice());
    playButton.addEventListener('click', () => this.onPlay());

    container.append(header, status, gatePanel);

    this.popup = document.createElement('div');
    this.popup.className = 'hud__popup hidden';
    container.append(this.popup);

    this.#updateChoicePreview();
    return container;
  }

  #commitChoice() {
    const choice = this.#currentChoice();
    this.onGateCommit(choice);
  }

  #updateChoicePreview() {
    const choice = this.#currentChoice();
    this.choiceLabel.textContent = `Current choice: ${choice.toUpperCase()}`;
    this.leftLabel.classList.toggle('hud__gate-option--active', choice === 'left');
    this.rightLabel.classList.toggle('hud__gate-option--active', choice === 'right');
  }

  #currentChoice() {
    const value = Number(this.slider.value);
    return value >= 50 ? 'right' : 'left';
  }

  /**
   * Updates the current wave display.
   * @param {number} wave
   */
  setWave(wave) {
    this.waveLabel.textContent = `Wave ${wave}`;
  }

  /**
   * Updates the phase label.
   * @param {string} phase
   */
  setPhase(phase) {
    this.phaseLabel.textContent = `Phase: ${phase}`;
  }

  /**
   * Updates the gate counter and labels.
   * @param {number} index
   * @param {number} total
   * @param {object} gate
   */
  showGate(index, total, gate) {
    this.gateLabel.textContent = `Gate ${index + 1} / ${total}`;
    this.leftLabel.textContent = gate.options[0].label;
    this.rightLabel.textContent = gate.options[1].label;
    this.slider.disabled = false;
    this.gateButton.disabled = false;
  }

  /**
   * Shows player/enemy counts.
   * @param {{player: number, enemy: number}} state
   */
  updateFlocks(state) {
    this.playerLabel.textContent = `Player: ${state.player}`;
    this.enemyLabel.textContent = `Enemy: ${state.enemy}`;
  }

  /**
   * Displays a status message.
   * @param {string} message
   */
  setStatus(message) {
    this.statusLabel.textContent = message;
  }

  /**
   * Updates the star hint text.
   * @param {number} stars
   */
  setStarPreview(stars) {
    this.starsLabel.textContent = formatStars(stars);
  }

  /**
   * Locks gate controls while animations resolve.
   * @param {boolean} locked
   */
  lockGateControls(locked) {
    this.slider.disabled = locked;
    this.gateButton.disabled = locked;
  }

  /**
   * Presents the summary popup.
   * @param {object} params
   * @param {string} params.title
   * @param {number} params.stars
   * @param {string} params.message
   * @param {() => void} params.onNext
   * @param {() => void} params.onRetry
   */
  showPopup({title, stars, message, onNext, onRetry, nextLabel = "Next", retryLabel = "Retry"}) {
    this.popup.innerHTML = '';
    this.popup.classList.remove('hidden');

    const heading = document.createElement('h3');
    heading.textContent = title;

    const summary = document.createElement('p');
    summary.textContent = message;

    const starsEl = document.createElement('div');
    starsEl.className = 'hud__popup-stars';
    starsEl.textContent = formatStars(stars);

    const buttons = document.createElement('div');
    buttons.className = 'hud__popup-actions';

    const nextButton = document.createElement('button');
    nextButton.className = 'hud__button hud__button--primary';
    nextButton.textContent = nextLabel;

    const retryButton = document.createElement('button');
    retryButton.className = 'hud__button';
    retryButton.textContent = retryLabel;

    nextButton.addEventListener('click', () => {
      this.hidePopup();
      onNext();
    });
    retryButton.addEventListener('click', () => {
      this.hidePopup();
      onRetry();
    });

    buttons.append(nextButton, retryButton);
    this.popup.append(heading, starsEl, summary, buttons);
  }

  /**
   * Hides the popup if visible.
   */
  hidePopup() {
    this.popup.classList.add('hidden');
  }

  /**
   * Displays the current star thresholds.
   */
  showThresholds() {
    const thresholds = STAR_THRESHOLDS.map((t) => `${Math.round(t * 100)}%`).join(' / ');
    this.setStatus(`Star thresholds: ${thresholds}`);
  }
}
