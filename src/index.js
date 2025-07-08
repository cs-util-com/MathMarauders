import GameController from './game/GameController.js';
import UIManager from './game/UIManager.js';
import PersistenceManager from './game/PersistenceManager.js';
import Telemetry from './game/Telemetry.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager();
  const persistence = new PersistenceManager();
  const telemetry = new Telemetry();
  new GameController(ui, persistence, telemetry);
});
