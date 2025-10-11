/**
 * Abstract telemetry interface used by the game controller to report events.
 */
export class Telemetry {
  /**
   * Tracks a generic event.
   * @param {string} _name
   * @param {Record<string, unknown>} [_payload]
   */
  trackEvent(_name, _payload) {
    void _payload;
    throw new Error("Telemetry.trackEvent must be implemented by subclasses");
  }
}

/**
 * Basic console-backed telemetry implementation.
 */
export class ConsoleTelemetry extends Telemetry {
  /**
   * @param {string} name
   * @param {Record<string, unknown>} [payload]
   */
  trackEvent(name, payload = {}) {
    if (typeof console !== "undefined" && console.info) {
      console.info(`[telemetry] ${name}`, payload);
    }
  }
}
