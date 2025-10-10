import {TELEMETRY_EVENTS} from './constants.js';

/**
 * Handles resolving player choices at math gates.
 */
export class GateSystem {
  /**
   * @param {import('./Telemetry.js').Telemetry} telemetry - Telemetry sink.
   */
  constructor(telemetry) {
    this.telemetry = telemetry;
  }

  /**
   * Evaluates the provided gate for the supplied army size.
   * @param {object} params
   * @param {object} params.gate - Gate descriptor from the generator.
   * @param {'left'|'right'} params.choice - Player choice.
   * @param {number} params.army - Current player army.
   * @returns {{value: number, left: number, right: number, isOptimal: boolean}}
   */
  resolve({gate, choice, army}) {
    const left = gate.options[0].apply(army);
    const right = gate.options[1].apply(army);
    const value = choice === 'left' ? left : right;
    const best = Math.max(left, right);
    const isOptimal = value === best;
    this.telemetry.trackEvent(TELEMETRY_EVENTS.GATE_RESOLVED, {
      gateId: gate.id,
      choice,
      armyBefore: army,
      result: value,
      optimal: best,
      isOptimal,
    });
    return {value, left, right, isOptimal, best};
  }
}
