import {ConsoleTelemetry} from '../Telemetry.js';
import {TELEMETRY_EVENTS} from '../constants.js';

describe('ConsoleTelemetry', () => {
  it('forwards events to the provided logger', () => {
    const info = jest.fn();
    const telemetry = new ConsoleTelemetry({info});
    telemetry.trackEvent(TELEMETRY_EVENTS.WAVE_START, {wave: 2});
    expect(info).toHaveBeenCalledWith('[telemetry] wave_start', {wave: 2});
  });
});
