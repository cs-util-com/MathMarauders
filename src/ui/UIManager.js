/**
 * Handles DOM interactions for the game.
 */
export class UIManager {
  constructor() {
    this.waveLabel = document.querySelector("#wave-label");
    this.phaseLabel = document.querySelector("#phase-label");
    this.playerCount = document.querySelector("#player-count");
    this.enemyCount = document.querySelector("#enemy-count");
    this.gateTitle = document.querySelector("#gate-title");
    this.optionLeft = document.querySelector("#option-left");
    this.optionRight = document.querySelector("#option-right");
    this.slider = /** @type {HTMLInputElement} */ (document.querySelector("#lane-slider"));
    this.advanceButton = document.querySelector("#advance-button");
    this.playButton = document.querySelector("#play-button");
    this.logContainer = document.querySelector("#log");
    this.modal = document.querySelector("#summary-modal");
    this.modalTitle = document.querySelector("#summary-title");
    this.modalStars = document.querySelector("#summary-stars");
    this.modalBody = document.querySelector("#summary-body");
    this.modalPrimary = document.querySelector("#summary-primary");
    this.modalSecondary = document.querySelector("#summary-secondary");
  }

  /**
   * Updates the HUD labels.
   * @param {{wave: number, phase: string, player: number, enemy: number}} data
   */
  updateHud(data) {
    this.waveLabel.textContent = String(data.wave);
    this.phaseLabel.textContent = data.phase;
    this.playerCount.textContent = String(Math.round(data.player));
    this.enemyCount.textContent = String(Math.round(data.enemy));
  }

  /**
   * Shows the current gate information.
   * @param {{index: number, total: number, options: string[]}} gate
   */
  showGate(gate) {
    if (!gate) {
      this.gateTitle.textContent = "Gate";
      this.optionLeft.textContent = "";
      this.optionRight.textContent = "";
      return;
    }
    this.gateTitle.textContent = `Gate ${gate.index + 1} / ${gate.total}`;
    this.optionLeft.textContent = gate.options[0];
    this.optionRight.textContent = gate.options[1];
  }

  /**
   * Resets the slider to neutral.
   */
  resetSlider() {
    this.slider.value = "0";
  }

  /**
   * Returns the slider bias in the range [-1, 1].
   * @returns {number}
   */
  getSliderBias() {
    return Number.parseInt(this.slider.value, 10) / 100;
  }

  /**
   * Appends a log line to the HUD log window.
   * @param {string} message
   */
  log(message) {
    const line = document.createElement("div");
    line.textContent = message;
    this.logContainer.prepend(line);
    const lines = Array.from(this.logContainer.children);
    if (lines.length > 12) {
      lines.slice(12).forEach((node) => node.remove());
    }
  }

  /**
   * Configures the summary modal.
   * @param {{title: string, stars: number, body: string, primaryLabel: string, secondaryLabel: string}} data
   */
  showSummary(data) {
    const stars = "★★★★★";
    this.modalTitle.textContent = data.title;
    this.modalStars.textContent = stars
      .split("")
      .map((char, index) => (index < data.stars ? char : "☆"))
      .join("");
    this.modalBody.textContent = data.body;
    this.modalPrimary.textContent = data.primaryLabel;
    this.modalSecondary.textContent = data.secondaryLabel;
    this.modal.classList.remove("hidden");
  }

  hideSummary() {
    this.modal.classList.add("hidden");
  }

  /**
   * Enables or disables the advance button.
   * @param {boolean} disabled
   */
  setAdvanceDisabled(disabled) {
    this.advanceButton.disabled = disabled;
  }

  /**
   * Registers event handlers for core UI actions.
   * @param {{onAdvance: () => void, onPlay: () => void, onSummaryPrimary: () => void, onSummarySecondary: () => void}} handlers
   */
  registerHandlers(handlers) {
    this.advanceButton.addEventListener("click", handlers.onAdvance);
    this.playButton.addEventListener("click", handlers.onPlay);
    this.modalPrimary.addEventListener("click", handlers.onSummaryPrimary);
    this.modalSecondary.addEventListener("click", handlers.onSummarySecondary);
  }
}
