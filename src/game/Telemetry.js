/**
 * Default Telemetry implementation.
 * Logs events to the console. Future versions may send data to a server.
 */
export default class Telemetry {
  /**
   * Track a telemetry event.
   * @param {string} name - Event name.
   * @param {object} payload - Additional data.
   */
  trackEvent(name, payload = {}) {
    console.log(`[Telemetry] ${name}`, payload);
  }
}
