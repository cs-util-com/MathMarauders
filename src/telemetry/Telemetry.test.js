import { ConsoleTelemetry, Telemetry } from "./Telemetry.js";

describe("Telemetry", () => {
  test("base class is no-op", () => {
    const telemetry = new Telemetry();
    expect(() => telemetry.trackEvent("noop", { value: 1 })).not.toThrow();
  });

  test("console telemetry logs payload", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    const telemetry = new ConsoleTelemetry();
    telemetry.trackEvent("test-event", { foo: "bar" });
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[telemetry:/),
      "test-event",
      { foo: "bar" },
    );
    spy.mockRestore();
  });
});
