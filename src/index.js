import { GameController } from "./game/GameController.js";
import { WaveGenerator } from "./game/WaveGenerator.js";
import { GateSystem } from "./game/GateSystem.js";
import { FlockSystem } from "./game/FlockSystem.js";
import { BattleSystem } from "./game/BattleSystem.js";
import { UIManager } from "./ui/UIManager.js";
import { PersistenceManager } from "./persistence/PersistenceManager.js";
import { ConsoleTelemetry } from "./telemetry/Telemetry.js";

function bootstrap() {
  const persistence = new PersistenceManager();
  const telemetry = new ConsoleTelemetry();
  const uiManager = new UIManager({ persistence });
  const flockSystem = new FlockSystem({ uiManager });
  const battleSystem = new BattleSystem({ flockSystem, uiManager, telemetry });
  const waveGenerator = new WaveGenerator();
  const gateSystem = new GateSystem({ uiManager, telemetry });
  const controller = new GameController({
    waveGenerator,
    gateSystem,
    battleSystem,
    flockSystem,
    uiManager,
    persistence,
    telemetry,
  });

  controller.start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
