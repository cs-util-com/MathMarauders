/**
 * @file GameController.js
 * Orchestrates wave start/end, transitions between forward and retreat phases, win/lose handling.
 */

/**
 * Represents the different states of the game.
 * @enum {string}
 */
const GameState = {
    MENU: 'MENU',
    FORWARD_RUN: 'FORWARD_RUN',
    RETREAT_CHASE: 'RETREAT_CHASE',
    POPUP: 'POPUP', // For displaying end-of-wave summary
};

/**
 * Manages the overall game flow and state.
 */
class GameController {
    /**
     * Initializes the GameController.
     * @param {object} uiManager - Instance of UIManager for UI interactions.
     * @param {object} waveGenerator - Instance of WaveGenerator for wave data.
     * @param {object} flockSystem - Instance of FlockSystem for player flock.
     * @param {object} battleSystem - Instance of BattleSystem for combat.
     * @param {object} gateSystem - Instance of GateSystem for gates.
     * @param {object} persistenceManager - Instance of PersistenceManager for saving scores.
     * @param {object} telemetry - Instance of Telemetry for analytics.
     */
    constructor(uiManager, waveGenerator, flockSystem, battleSystem, gateSystem, persistenceManager, telemetry) {
        this.uiManager = uiManager;
        this.waveGenerator = waveGenerator;
        this.flockSystem = flockSystem;
        this.battleSystem = battleSystem;
        this.gateSystem = gateSystem;
        this.persistenceManager = persistenceManager;
        this.telemetry = telemetry;
        // battleSystem is already passed in constructor and assigned to this.battleSystem

        this.currentWave = 1;
        this.gameState = GameState.MENU;
        this.isGameActive = false;

        this.optimalPathArmySize = 0;
        this.playerArmySize = 0;

        console.log("GameController initialized");
        this.telemetry.trackEvent('game_controller_init', { wave: this.currentWave });
    }

    /**
     * Starts the game, usually called when the "Play" button is pressed.
     */
    startGame() {
        this.currentWave = this.persistenceManager.getNextUncompletedWave(1); // Start from wave 1 or next uncompleted
        this.isGameActive = true;
        this.uiManager.hidePlayButton();
        this.uiManager.showHUD();
        this.startNewWave();
        this.telemetry.trackEvent('game_start', { start_wave: this.currentWave });
    }

    /**
     * Initializes and starts a new wave.
     */
    startNewWave() {
        if (!this.isGameActive && this.gameState !== GameState.POPUP) {
            this.setGameState(GameState.MENU);
            this.uiManager.showPlayButton();
            return;
        }

        this.setGameState(GameState.FORWARD_RUN);
        this.uiManager.updateWaveNumber(this.currentWave);
        this.uiManager.hidePopup();

        const waveData = this.waveGenerator.generateWaveData(this.currentWave);
        this.currentWaveData = waveData; // Store for later use (e.g. by GateSystem, BattleSystem)

        this.optimalPathArmySize = waveData.optimalArmySizeAtEnd; // This is the target for star rating
        this.playerArmySize = 10; // Player always starts with a fixed amount, e.g. 10
        // Or use: this.playerArmySize = this.waveGenerator.MATH_CONFIG.INITIAL_ARMY_SIZE;


        this.flockSystem.resetFlock(this.playerArmySize);
        this.uiManager.updateArmySize(this.playerArmySize);

        this.gateSystem.setupGates(waveData.gates);
        this.battleSystem.reset(); // Reset battle system for the new wave

        console.log(`Starting Wave ${this.currentWave}. Optimal Path End Size: ${this.optimalPathArmySize}, Player Starts with: ${this.playerArmySize}`);
        console.log("Wave Data:", waveData);
        this.telemetry.trackEvent('wave_start', {
            wave: this.currentWave,
            initial_army: this.playerArmySize,
            optimal_end_army: this.optimalPathArmySize,
            gate_count: waveData.gateCount
        });

        // Game loop is managed externally in main.js for now
        // this.gameLoop();
    }

    /**
     * Called by GateSystem when the player has passed through a gate choice.
     * @param {number} gateIndexInWave - The index of the gate just passed.
     * @param {object} chosenOperation - The math operation object that was applied.
     * @param {number} resultingArmySize - The player's army size after the gate.
     */
    playerMadeGateChoice(gateIndexInWave, chosenOperation, resultingArmySize) {
        this.updatePlayerArmy(resultingArmySize); // Update internal count and UI
        this.telemetry.trackEvent('gate_passed', {
            wave: this.currentWave,
            gate_index: gateIndexInWave,
            choice: chosenOperation.text,
            army_after_gate: resultingArmySize
        });

        // Trigger skirmish immediately after the gate
        // Skirmish data is in this.currentWaveData.skirmishes[gateIndexInWave]
        const skirmishData = this.currentWaveData.skirmishes[gateIndexInWave];
        if (skirmishData) {
            this.battleSystem.startSkirmish(skirmishData);
        } else {
            console.warn(`No skirmish data found for gate index ${gateIndexInWave} in wave ${this.currentWave}`);
        }
    }

    /**
     * Called by GateSystem when all forward gates in the current wave are cleared.
     */
    allForwardGatesCleared() {
        if (this.gameState === GameState.FORWARD_RUN) {
            console.log("All forward gates cleared for wave " + this.currentWave);
            this.telemetry.trackEvent('forward_run_complete', { wave: this.currentWave, army_size: this.playerArmySize });
            this.startRetreatPhase();
        }
    }

    /**
     * Transitions the game to the retreat phase.
     */
    startRetreatPhase() {
        this.setGameState(GameState.RETREAT_CHASE);
        this.flockSystem.reverseCameraDirection(); // Tell flock system to adjust camera

        // TODO: Setup retreat gates using WaveGenerator/GateSystem
        // const retreatGateCount = this.currentWaveData.retreatGateCount;
        // const retreatGatesData = this.waveGenerator.generateGatesData(retreatGateCount, this.playerArmySize); // Base retreat gate math on current army
        // this.gateSystem.setupGates(retreatGatesData, true); // true for retreat mode (e.g. different Z direction or color)

        // TODO: Spawn large enemy flock via BattleSystem

        console.log("Transitioning to Retreat Chase. Player army: " + this.playerArmySize);
        this.telemetry.trackEvent('retreat_phase_start', { wave: this.currentWave, army_at_transition: this.playerArmySize });
    }

    /**
     * Ends the current wave, calculates score, and shows the summary popup.
     * @param {boolean} success - Whether the player successfully completed the wave.
     */
    endWave(success) {
        this.setGameState(GameState.POPUP);
        let stars = 0;
        if (success) {
            // const stars = this.calculateStars(this.playerArmySize, this.optimalPathArmySize);
            // TODO: Placeholder for star calculation
            stars = Math.floor(Math.random() * 5) + 1; // Random stars for now
            this.persistenceManager.saveStarRating(this.currentWave, stars);
            this.uiManager.showPopup(`Wave ${this.currentWave} Complete!`, stars);
            this.telemetry.trackEvent('wave_complete_success', { wave: this.currentWave, final_army: this.playerArmySize, stars: stars });
        } else {
            this.uiManager.showPopup(`Wave ${this.currentWave} Failed!`, 0);
            this.telemetry.trackEvent('wave_complete_fail', { wave: this.currentWave, final_army: this.playerArmySize });
            this.currentWave = 1; // Reset to wave 1 on failure as per spec
        }
    }

    /**
     * Handles the player's choice to proceed to the next wave.
     */
    nextWave() {
        if (this.gameState === GameState.POPUP) {
            this.currentWave++;
            this.startNewWave();
        }
    }

    /**
     * Handles the player's choice to retry the current wave.
     */
    retryWave() {
        if (this.gameState === GameState.POPUP) {
            // If it was a failure, currentWave is already 1.
            // If it was a success, we retry the same wave.
            // No change to this.currentWave is needed here if failure resets to 1.
            // However, if failure *doesn't* reset to 1 immediately, then this.currentWave should be used.
            // Spec says: "game immediately restarts at wave 1" on failure.
            // So, if they failed, this.currentWave is 1. If they succeeded and retry, it's the wave they just did.
            // This logic implies that if they failed, "Retry" means retry Wave 1.
            // If they won Wave 5 and hit "Retry", they retry Wave 5.
            this.startNewWave();
        }
    }

    /**
     * Main game loop, called every frame.
     * @param {number} timestamp - The current time.
     */
    gameLoop(timestamp) {
        if (!this.isGameActive && this.gameState !== GameState.POPUP) return;

        // Update game systems based on state
        // switch (this.gameState) {
        //     case GameState.FORWARD_RUN:
        //         this.flockSystem.update(timestamp);
        //         // Check for gate collisions, skirmishes, etc.
        //         break;
        //     case GameState.RETREAT_CHASE:
        //         this.flockSystem.update(timestamp);
        //         // Check for retreat gate collisions, enemy pursuit, arrow volleys
        //         break;
        // }

        // For now, just a placeholder
        // if (this.gameState === GameState.FORWARD_RUN || this.gameState === GameState.RETREAT_CHASE) {
        //     console.log(`Game Loop Running - State: ${this.gameState}`);
        // }


        // requestAnimationFrame(this.gameLoop.bind(this)); // Keep the loop going
    }

    /**
     * Sets the current game state and logs it.
     * @param {GameState} newState - The new state to set.
     */
    setGameState(newState) {
        if (this.gameState !== newState) {
            console.log(`Game State changing from ${this.gameState} to ${newState}`);
            this.gameState = newState;
            this.telemetry.trackEvent('game_state_change', { old_state: this.gameState, new_state: newState, wave: this.currentWave });
        }
    }

    /**
     * Updates player army size.
     * @param {number} newSize - The new army size.
     */
    updatePlayerArmy(newSize) {
        this.playerArmySize = Math.max(0, newSize); // Army can't be negative
        this.uiManager.updateArmySize(this.playerArmySize);
        if (this.playerArmySize === 0 && this.gameState === GameState.RETREAT_CHASE) {
            this.endWave(false); // Defeat
        }
    }
}

// Export the class and enum
export { GameController, GameState };
