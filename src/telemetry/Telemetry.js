/**
 * Abstract telemetry interface used by the game to emit analytics events.
 * Implementations can forward events to any backend or simply log them.
 */
export class Telemetry {
  /**
   * @param {string} name
   * @param {Record<string, unknown>} [payload]
   */
  trackEvent(name, payload = undefined) {
    void name;
    void payload;
  }
}

/**
 * Console-only telemetry implementation.
 */
export class ConsoleTelemetry extends Telemetry {
  /**
   * @param {string} name
   * @param {Record<string, unknown>} [payload]
   */
  trackEvent(name, payload = undefined) {
    const stamp = new Date().toISOString();
    console.info(`[telemetry:${stamp}]`, name, payload ?? {});
  }
}
