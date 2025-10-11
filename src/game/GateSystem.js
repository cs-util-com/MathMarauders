/**
 * Handles presenting gates to the player, evaluating their decisions and
 * comparing them to the optimal route.
 */
export class GateSystem {
  constructor({ uiManager, telemetry }) {
    this.uiManager = uiManager;
    this.telemetry = telemetry;
  }

  /**
   * Run through a list of gates sequentially, requesting the player's decision
   * for each one via the UI manager.
   * @param {object[]} gates
   * @param {number} initialArmy
   * @param {"forward"|"retreat"} phase
   * @returns {Promise<{ history: Array, finalCount: number }>}
   */
  async processGates(gates, initialArmy, phase) {
    let currentArmy = initialArmy;
    const history = [];
    for (const gate of gates) {
      const decision = await this.uiManager.promptGateDecision({
        gate,
        currentArmy,
        phase,
      });
      const result = decision.choice.apply(currentArmy);
      history.push({
        gateId: gate.id,
        selectedIndex: decision.index,
        before: currentArmy,
        after: result,
      });
      currentArmy = result;
      this.telemetry.trackEvent("gate:resolved", {
        gateId: gate.id,
        phase,
        before: decision.current,
        result,
        choiceIndex: decision.index,
      });
    }
    return { history, finalCount: currentArmy };
  }
}
