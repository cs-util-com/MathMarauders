/**
 * @file BattleSystem.js
 * Manages skirmishes, final showdown combat, arrow volleys, and enemy flock behavior.
 */

import * as THREE from 'three'; // Might be needed later for enemy flock visuals

class BattleSystem {
    /**
     * Initializes the BattleSystem.
     * @param {THREE.Scene} scene - The main Three.js scene.
     * @param {GameController} gameController - Reference to the game controller.
     * @param {FlockSystem} playerFlockSystem - Reference to the player's flock system.
     */
    constructor(scene, gameController, playerFlockSystem) {
        this.scene = scene;
        this.gameController = gameController;
        this.playerFlockSystem = playerFlockSystem;

        this.activeSkirmish = null; // Data for the currently active skirmish
        this.enemyFlocks = []; // Array to manage enemy flock objects if visualized

        console.log("BattleSystem initialized");
    }

    /**
     * Starts a skirmish based on data provided (typically after a gate).
     * For now, resolves by straight subtraction.
     * @param {{ enemyCount: number }} skirmishData - Object containing skirmish parameters.
     */
    startSkirmish(skirmishData) {
        if (!skirmishData || skirmishData.enemyCount <= 0) {
            console.log("BattleSystem: No skirmish or zero enemies.");
            this.gameController.telemetry.trackEvent('skirmish_skipped', {
                wave: this.gameController.currentWave,
                reason: 'no_enemies'
            });
            return;
        }

        this.activeSkirmish = skirmishData;
        const playerArmySizeBefore = this.playerFlockSystem.getFlockSize();
        const enemies = skirmishData.enemyCount;

        console.log(`BattleSystem: Skirmish started! Player army: ${playerArmySizeBefore}, Enemies: ${enemies}`);
        this.gameController.telemetry.trackEvent('skirmish_start', {
            wave: this.gameController.currentWave,
            player_army_before: playerArmySizeBefore,
            enemy_count: enemies
        });

        // Resolve by straight subtraction
        this.playerFlockSystem.removeSoldiers(enemies);
        const playerArmySizeAfter = this.playerFlockSystem.getFlockSize();

        const casualties = playerArmySizeBefore - playerArmySizeAfter; // Actual soldiers lost by player
        const enemiesDefeated = casualties; // In simple subtraction, this is how many enemies were "defeated"

        console.log(`BattleSystem: Skirmish resolved. Player army: ${playerArmySizeAfter}. Player lost ${casualties}. Enemies defeated: ${enemiesDefeated}`);
        this.gameController.telemetry.trackEvent('skirmish_end', {
            wave: this.gameController.currentWave,
            player_army_after: playerArmySizeAfter,
            player_casualties: casualties,
            enemies_defeated: enemiesDefeated // For simple subtraction, this equals player_casualties up to enemy_count
        });

        this.activeSkirmish = null; // Skirmish resolved instantly

        // Check for game over condition (e.g. if player army is wiped out during forward run)
        if (playerArmySizeAfter === 0 && this.gameController.gameState === GameState.FORWARD_RUN) {
            // While spec says failure is "If the player returns to the start with zero soldiers",
            // it might be good to handle total wipeout during forward run as an immediate loss too.
            // For now, strictly adhering to spec: failure is only at end of retreat.
            // If player reaches 0 here, they just continue with 0.
            console.log("BattleSystem: Player army wiped out during forward run skirmish.");
        }
    }

    /**
     * Updates the battle system (e.g., enemy movement, arrow volleys in later stages).
     * @param {number} deltaTime - Time since the last frame.
     */
    update(deltaTime) {
        // Placeholder for future logic:
        // - Move enemy flocks
        // - Handle arrow volleys (spawn, move, check collisions)
        // - Check for pursuit conditions in retreat phase
    }

    /**
     * Resets the battle system state for a new wave or game start.
     */
    reset() {
        this.activeSkirmish = null;
        // Clear any visual enemy flocks if they exist
        this.enemyFlocks.forEach(enemy => {
            // Assuming enemy might have a mesh or group to remove from scene
            if (enemy.visual) this.scene.remove(enemy.visual);
        });
        this.enemyFlocks = [];
        console.log("BattleSystem: Reset for new wave.");
    }

    // --- Methods for Retreat Phase (to be implemented later) ---

    /**
     * Spawns the large enemy gate and the pursuing enemy flock for the final showdown.
     * @param {number} initialEnemyCount - Size of the pursuing army.
     */
    startFinalShowdown(initialEnemyCount) {
        console.log(`BattleSystem: Final Showdown started! Spawning pursuing army of ${initialEnemyCount}`);
        // TODO: Create visual representation for the enemy gate
        // TODO: Create and manage the large enemy flock (e.g., using another InstancedMesh)
        // For now, just log it.
        this.gameController.telemetry.trackEvent('final_showdown_start', {
            wave: this.gameController.currentWave,
            initial_enemy_army: initialEnemyCount
        });
    }

    /**
     * Handles automatic arrow volleys from the player during retreat.
     */
    fireArrowVolley() {
        // const volleySize = Math.floor(this.playerFlockSystem.getFlockSize() * 0.10);
        // if (volleySize <= 0) return;
        // console.log(`BattleSystem: Firing arrow volley of ${volleySize} arrows.`);
        // TODO: Implement arrow spawning and collision logic
    }

    /**
     * Adjusts enemy speed, e.g., for surges.
     * @param {number} speed - New speed for the enemy flock.
     * @param {number} duration - How long the speed change lasts (in seconds, optional).
     */
    setEnemySpeed(speed, duration = null) {
        // console.log(`BattleSystem: Setting enemy speed to ${speed}` + (duration ? ` for ${duration}s` : ''));
        // TODO: Implement enemy flock movement and speed control
    }
}

export { BattleSystem };
