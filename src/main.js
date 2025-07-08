// Flock Runner Game - Main Entry Point
import { GameController, GameState } from './GameController.js';
import { FlockSystem } from './FlockSystem.js';
import { WaveGenerator } from './WaveGenerator.js';
import { GateSystem } from './GateSystem.js';
import { BattleSystem } from './BattleSystem.js';
import { UIManager } from './UIManager.js'; // Import UIManager

console.log("Game Initializing...");

const canvas = document.getElementById('game-canvas'); // Still needed for Three.js context

let gameController;
let flockSystem;
let waveGenerator;
let gateSystem;
let battleSystem;
let uiManager; // UIManager instance
let lastTime = 0;

// Instantiate UIManager and other core systems
uiManager = new UIManager();
waveGenerator = new WaveGenerator();

// Mock PersistenceManager and Telemetry for now
const mockPersistenceManager = {
    saveStarRating: (wave, stars) => console.log(`PersistenceManager: Saved ${stars} stars for wave ${wave}`),
    getStarRating: (wave) => 0,
    getNextUncompletedWave: (defaultWave) => defaultWave,
};
const mockTelemetry = {
    trackEvent: (name, payload) => console.log(`Telemetry: ${name}`, payload)
};

// Callback to start the game loop, passed to UIManager
function startGameLoop() {
    if (gameController.isGameActive && lastTime === 0) {
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function initGame() {
    console.log("Game Initialized with all core systems including UIManager.");

    flockSystem = new FlockSystem(canvas);
    gateSystem = new GateSystem(flockSystem.scene, null, flockSystem);
    battleSystem = new BattleSystem(flockSystem.scene, null, flockSystem);

    gameController = new GameController(
        uiManager, // Pass the actual UIManager instance
        waveGenerator,
        flockSystem,
        battleSystem,
        gateSystem,
        mockPersistenceManager,
        mockTelemetry
    );

    // Assign gameController to other systems that need it
    gateSystem.gameController = gameController;
    battleSystem.gameController = gameController;
    flockSystem.gameController = gameController;

    // Bind UIManager events, passing the startGameLoop callback
    uiManager.bindEvents(gameController, startGameLoop);

    // Initial UI state
    uiManager.hideHUD();
    uiManager.hidePopup();
    if (gameController.gameState === GameState.MENU) {
        uiManager.showPlayButton();
    } else {
        uiManager.hidePlayButton();
    }
}

function gameLoop(timestamp) {
    if (!gameController || !gameController.isGameActive) {
        lastTime = 0;
        return;
    }

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const steeringInput = uiManager.getSteeringInput(); // Get input via UIManager

    if (gameController.gameState === GameState.FORWARD_RUN || gameController.gameState === GameState.RETREAT_CHASE) {
        if (flockSystem) {
            flockSystem.update(deltaTime, steeringInput);
        }
        if (gateSystem) {
            gateSystem.update(deltaTime);
        }
        if (battleSystem) {
            battleSystem.update(deltaTime);
        }
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
    initGame();
});
