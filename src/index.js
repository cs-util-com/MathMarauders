import {WaveGenerator} from './core/WaveGenerator.js';
import {GateSystem} from './core/GateSystem.js';
import {BattleSystem} from './core/BattleSystem.js';
import {FlockSystem} from './core/FlockSystem.js';
import {UIManager} from './ui/UIManager.js';
import {PersistenceManager} from './core/PersistenceManager.js';
import {ConsoleTelemetry} from './core/Telemetry.js';
import {GameController} from './core/GameController.js';

const root = document.getElementById('app');
const telemetry = new ConsoleTelemetry();
const flocks = new FlockSystem();
const generator = new WaveGenerator();
const gates = new GateSystem(telemetry);
const battles = new BattleSystem({flocks, telemetry});
const persistence = new PersistenceManager(window.localStorage);
const ui = new UIManager(root);

const controller = new GameController({
  generator,
  gates,
  battles,
  flocks,
  ui,
  persistence,
  telemetry,
});

controller.initialize();
