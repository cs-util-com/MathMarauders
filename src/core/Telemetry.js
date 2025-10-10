/**
 * Abstract telemetry interface. Implementations can forward
 * game analytics to any backend or simply log to the console.
 */
export class Telemetry {
  /**
   * Tracks an event.
   * @param {string} _name - Event identifier.
   * @param {object} _payload - Event payload.
   */
    trackEvent(_name, _payload = {}) {}
}

/**
 * Default telemetry implementation which logs to the console.
 */
export class ConsoleTelemetry extends Telemetry {
  /**
   * @param {Console} logger - Console-like interface (defaults to global console).
   */
  constructor(logger = console) {
    super();
    this.logger = logger;
  }

  /** @inheritdoc */
  trackEvent(name, payload = {}) {
    this.logger.info(`[telemetry] ${name}`, payload);
  }
}
