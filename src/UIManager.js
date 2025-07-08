/**
 * @file UIManager.js
 * Manages all HTML/CSS UI elements, including HUD, popups, buttons, and input slider.
 */

class UIManager {
    /**
     * Initializes the UIManager by grabbing references to DOM elements.
     */
    constructor() {
        this.waveNumberDisplay = document.getElementById('wave-number');
        this.armySizeDisplay = document.getElementById('army-size');
        this.slider = document.getElementById('slider');
        this.popupElement = document.getElementById('popup');
        this.popupTitle = document.getElementById('popup-title');
        this.popupStars = document.getElementById('popup-stars');
        this.popupNextButton = document.getElementById('popup-next');
        this.popupRetryButton = document.getElementById('popup-retry');
        this.playButton = document.getElementById('play-button');
        this.hudElement = document.getElementById('hud');
        this.gateLabelsContainer = document.getElementById('gate-labels'); // For CSS2DRenderer managed by GateSystem

        if (!this.waveNumberDisplay || !this.armySizeDisplay || !this.slider || !this.popupElement || !this.playButton || !this.hudElement) {
            console.error("UIManager: One or more required UI elements are missing from the DOM!");
        }
        console.log("UIManager initialized");
    }

    /**
     * Updates the displayed wave number.
     * @param {number} wave - The current wave number.
     */
    updateWaveNumber(wave) {
        if (this.waveNumberDisplay) this.waveNumberDisplay.textContent = wave;
    }

    /**
     * Updates the displayed army size.
     * @param {number} size - The current army size.
     */
    updateArmySize(size) {
        if (this.armySizeDisplay) this.armySizeDisplay.textContent = size;
    }

    /**
     * Shows the end-of-wave popup.
     * @param {string} titleText - The title for the popup (e.g., "Wave X Complete!").
     * @param {number} stars - Number of stars achieved (0-5).
     */
    showPopup(titleText, stars) {
        if (this.popupTitle) this.popupTitle.textContent = titleText;
        if (this.popupStars) this.popupStars.textContent = '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars));
        if (this.popupElement) this.popupElement.style.display = 'block';
    }

    /**
     * Hides the end-of-wave popup.
     */
    hidePopup() {
        if (this.popupElement) this.popupElement.style.display = 'none';
    }

    /**
     * Shows the main play button.
     */
    showPlayButton() {
        if (this.playButton) this.playButton.style.display = 'block';
    }

    /**
     * Hides the main play button.
     */
    hidePlayButton() {
        if (this.playButton) this.playButton.style.display = 'none';
    }

    /**
     * Shows the Heads-Up Display (HUD).
     */
    showHUD() {
        if (this.hudElement) this.hudElement.style.display = 'block';
    }

    /**
     * Hides the Heads-Up Display (HUD).
     */
    hideHUD() {
        if (this.hudElement) this.hudElement.style.display = 'none';
    }

    /**
     * Gets the current value of the steering input slider.
     * @returns {number} Value from -1 (left) to 1 (right).
     */
    getSteeringInput() {
        return this.slider ? parseFloat(this.slider.value) : 0;
    }

    /**
     * Adds event listeners for UI elements like buttons.
     * @param {GameController} gameController - The game controller to handle actions.
     */
    bindEvents(gameController) {
        if (this.playButton) {
            this.playButton.addEventListener('click', () => {
                gameController.startGame();
            });
        }
        if (this.popupNextButton) {
            this.popupNextButton.addEventListener('click', () => {
                gameController.nextWave();
            });
        }
        if (this.popupRetryButton) {
            this.popupRetryButton.addEventListener('click', () => {
                gameController.retryWave();
            });
        }
        console.log("UIManager events bound.");
    }
}

export { UIManager };
