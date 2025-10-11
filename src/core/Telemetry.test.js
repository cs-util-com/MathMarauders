import { describe, expect, jest, test } from "@jest/globals";
import { ConsoleTelemetry, Telemetry } from "./Telemetry.js";

describe("Telemetry", () => {
  test("base class throws when not overridden", () => {
    const telemetry = new Telemetry();
    expect(() => telemetry.trackEvent("test", {})).toThrow();
  });

  test("console telemetry logs to console.info", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    const telemetry = new ConsoleTelemetry();
    telemetry.trackEvent("wave_started", { wave: 3 });
    expect(spy).toHaveBeenCalledWith("[telemetry] wave_started", { wave: 3 });
    spy.mockRestore();
  });
});
