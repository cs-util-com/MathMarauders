import { formatStars } from "../game/Scoring.js";

function ensureElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing UI element: ${id}`);
  }
  return element;
}

function renderChoiceElement({ choice, index, currentArmy }) {
  const container = document.createElement("div");
  container.className = "gate-option";
  container.dataset.index = String(index);

  const label = document.createElement("div");
  label.textContent = index === 0 ? "Left Path" : "Right Path";

  const expression = document.createElement("div");
  expression.textContent = choice.expression;

  const result = document.createElement("div");
  result.className = "gate-option__result";
  result.textContent = choice.apply(currentArmy).toLocaleString();

  container.append(label, expression, result);
  return container;
}

export class UIManager {
  constructor({ persistence }) {
    this.persistence = persistence;
    this.waveEl = ensureElement("hud-wave");
    this.phaseEl = ensureElement("hud-phase");
    this.playerEl = ensureElement("hud-player");
    this.enemyEl = ensureElement("hud-enemy");
    this.gateCounterEl = ensureElement("gate-counter");
    this.optionsEl = ensureElement("gate-options");
    this.actionButton = ensureElement("action-button");
    this.logEl = ensureElement("game-log");
    this.popupEl = ensureElement("wave-popup");
    this.popupTitle = ensureElement("popup-title");
    this.popupStars = ensureElement("popup-stars");
    this.popupSummary = ensureElement("popup-summary");
    this.popupNext = ensureElement("popup-next");
    this.popupRetry = ensureElement("popup-retry");
    this.slider = /** @type {HTMLInputElement} */ (
      ensureElement("decision-slider")
    );
    this.isAwaitingDecision = false;
    this.currentActionHandler = null;
  }

  setWave(waveNumber) {
    this.waveEl.textContent = String(waveNumber);
  }

  setPhase(phase) {
    this.phaseEl.textContent =
      phase === "forward" ? "Advance" : phase === "retreat" ? "Retreat" : phase;
  }

  updatePlayerCount(count) {
    this.playerEl.textContent = count.toLocaleString();
  }

  updateEnemyCount(count) {
    this.enemyEl.textContent = count.toLocaleString();
  }

  setGateCounter(current, total) {
    this.gateCounterEl.textContent = `${current} / ${total}`;
  }

  logEvent(message) {
    const entry = document.createElement("div");
    const stamp = new Date().toLocaleTimeString();
    entry.textContent = `[${stamp}] ${message}`;
    this.logEl.prepend(entry);
  }

  setPrimaryAction(label, handler, { disabled = false } = {}) {
    if (this.currentActionHandler) {
      this.actionButton.removeEventListener("click", this.currentActionHandler);
    }
    this.currentActionHandler = handler ?? null;
    this.actionButton.textContent = label;
    this.actionButton.disabled = disabled;
    if (handler) {
      this.actionButton.addEventListener("click", handler);
    }
  }

  async promptGateDecision({ gate, currentArmy, phase }) {
    this.optionsEl.innerHTML = "";
    this.slider.value = "50";
    this.setPhase(phase);
    this.isAwaitingDecision = true;
    this.setGateCounter(gate.index + 1, gate.total ?? gate.index + 1);

    gate.choices.forEach((choice, index) => {
      const element = renderChoiceElement({ choice, index, currentArmy });
      if (index === 0) {
        element.classList.add("is-active");
      }
      this.optionsEl.appendChild(element);
    });

    const updateSelection = (value) => {
      const index = Number(value) < 50 ? 0 : 1;
      [...this.optionsEl.children].forEach((child, childIndex) => {
        child.classList.toggle("is-active", childIndex === index);
      });
    };

    const handleInput = (event) => {
      updateSelection(event.target.value);
    };

    this.slider.addEventListener("input", handleInput);
    updateSelection(this.slider.value);

    const choice = await new Promise((resolve) => {
      const confirm = () => {
        if (!this.isAwaitingDecision) {
          return;
        }
        const index = Number(this.slider.value) < 50 ? 0 : 1;
        const selected = gate.choices[index];
        this.isAwaitingDecision = false;
        this.slider.removeEventListener("input", handleInput);
        resolve({
          choice: selected,
          index,
          current: currentArmy,
        });
      };
      const label =
        gate.index === 0 && phase === "forward" ? "Advance" : "Commit";
      this.setPrimaryAction(label, confirm, { disabled: false });
    });

    this.setPrimaryAction("Waiting", null, { disabled: true });
    this.optionsEl.innerHTML = "";
    return choice;
  }

  showPopup({ title, stars, summary, canAdvance }) {
    this.popupTitle.textContent = title;
    this.popupStars.textContent = formatStars(stars);
    this.popupSummary.textContent = summary;
    this.popupNext.textContent = canAdvance ? "Next Wave" : "Restart";
    this.popupNext.disabled = !canAdvance;
    this.popupEl.classList.add("is-visible");
  }

  hidePopup() {
    this.popupEl.classList.remove("is-visible");
  }

  onPopupNext(handler) {
    this.popupNext.addEventListener("click", handler);
  }

  onPopupRetry(handler) {
    this.popupRetry.addEventListener("click", handler);
  }
}
