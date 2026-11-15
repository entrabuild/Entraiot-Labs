import { describe, expect, it } from "vitest";
import {
  accelRaw,
  ahtDecode,
  ahtRaw,
  altitudeFromPressure,
  comfort,
  dewPoint,
  hex,
  pressureAtAltitude,
  tiltFromAccel,
} from "./sensor-model";

describe("sensor model", () => {
  it("round-trips the AHT20's raw words within its resolution", () => {
    const back = ahtDecode(ahtRaw(27.5, 62));
    expect(back.tempC).toBeCloseTo(27.5, 2);
    expect(back.humidity).toBeCloseTo(62, 2);
  });

  it("puts the dew point below the air temperature, equal at 100 %", () => {
    expect(dewPoint(30, 50)).toBeLessThan(30);
    expect(dewPoint(20, 100)).toBeCloseTo(20, 5);
  });

  it("reads sea level as 0 m and inverts the barometric formula", () => {
    expect(altitudeFromPressure(1013.25)).toBeCloseTo(0, 5);
    expect(altitudeFromPressure(pressureAtAltitude(880))).toBeCloseTo(880, 3);
  });

  it("recovers pitch and roll from the raw accelerometer readings", () => {
    const { pitch, roll } = tiltFromAccel(accelRaw(20, -35));
    expect(pitch).toBeCloseTo(20, 0);
    expect(roll).toBeCloseTo(-35, 0);
    expect(accelRaw(0, 0).az).toBe(16384);
  });

  it("names comfort and formats addresses", () => {
    expect(comfort(24, 50)).toBe("ok");
    expect(comfort(34, 50)).toBe("hot");
    expect(comfort(24, 80)).toBe("humid");
    expect(hex(0x38)).toBe("0x38");
  });
});
