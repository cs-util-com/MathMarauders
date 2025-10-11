import { GameController } from "./core/GameController.js";
import { ConsoleTelemetry } from "./core/Telemetry.js";
import { PersistenceManager } from "./core/PersistenceManager.js";

function detectQualityPreset() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  return isMobile ? "mobile" : "desktop";
}

function bootstrap() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector("#simulation-canvas"));
  if (!canvas) {
    throw new Error("Simulation canvas not found");
  }
  const telemetry = new ConsoleTelemetry();
  const persistence = new PersistenceManager();
  const controller = new GameController({ canvas, telemetry, persistence });
  telemetry.trackEvent("app_bootstrap", { quality: detectQualityPreset() });
  return controller;
}

document.addEventListener("DOMContentLoaded", () => {
  bootstrap();
});
