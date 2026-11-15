// The sensors track's firmware maths, as plain functions: what the ESP32-S3 does with the raw
// bytes each I2C sensor sends back. Unit-tested in sensor-model.test.ts, no DOM.

/** I2C addresses of the bench's three sensors (7-bit). */
export const I2C_ADDR = { aht20: 0x38, bmp280: 0x76, mpu6050: 0x68 } as const;

export type SensorKey = keyof typeof I2C_ADDR;

/** Which sensors each view of the preview has on the bus. */
export const VIEW_SENSORS: readonly (readonly SensorKey[])[] = [
  ["aht20"],
  ["bmp280"],
  ["mpu6050"],
  ["aht20", "bmp280", "mpu6050"],
];

export const hex = (n: number, digits = 2) => `0x${n.toString(16).toUpperCase().padStart(digits, "0")}`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---- AHT20: temperature and humidity, 20-bit raw values ----

const AHT_FULL = 1 << 20;

/** The raw 20-bit words an AHT20 would send for a temperature (°C) and relative humidity (%). */
export function ahtRaw(tempC: number, humidity: number) {
  return {
    hum: Math.round((clamp(humidity, 0, 100) / 100) * (AHT_FULL - 1)),
    temp: Math.round(((clamp(tempC, -40, 85) + 50) / 200) * (AHT_FULL - 1)),
  };
}

/** The datasheet formulas the firmware applies to those words. */
export function ahtDecode(raw: { hum: number; temp: number }) {
  return {
    humidity: (raw.hum / AHT_FULL) * 100,
    tempC: (raw.temp / AHT_FULL) * 200 - 50,
  };
}

/** Dew point (°C) from the Magnus formula: below it, water condenses on the board. */
export function dewPoint(tempC: number, humidity: number): number {
  const a = 17.62;
  const b = 243.12;
  const g = Math.log(clamp(humidity, 1, 100) / 100) + (a * tempC) / (b + tempC);
  return (b * g) / (a - g);
}

// ---- BMP280: air pressure and altitude ----

/** Standard sea-level pressure (hPa), the default reference for altitude. */
export const SEA_LEVEL_HPA = 1013.25;

/** Altitude (m) from pressure, the barometric formula every BMP280 library uses. */
export function altitudeFromPressure(hpa: number, seaLevel = SEA_LEVEL_HPA): number {
  return 44330 * (1 - Math.pow(hpa / seaLevel, 1 / 5.255));
}

/** Pressure (hPa) at an altitude (m): the inverse, for the simulator's "climb" slider. */
export function pressureAtAltitude(m: number, seaLevel = SEA_LEVEL_HPA): number {
  return seaLevel * Math.pow(1 - m / 44330, 5.255);
}

// ---- MPU6050: acceleration and tilt ----

/** LSB per g at the default ±2 g range. */
export const ACCEL_LSB_PER_G = 16384;

/** The three raw accelerometer readings for a board tilted by pitch and roll (degrees). */
export function accelRaw(pitchDeg: number, rollDeg: number) {
  const p = (pitchDeg * Math.PI) / 180;
  const r = (rollDeg * Math.PI) / 180;
  const g = ACCEL_LSB_PER_G;
  return {
    ax: Math.round(-Math.sin(p) * g),
    ay: Math.round(Math.cos(p) * Math.sin(r) * g),
    az: Math.round(Math.cos(p) * Math.cos(r) * g),
  };
}

/** Pitch and roll (degrees) back from the raw readings, as the firmware computes them. */
export function tiltFromAccel(raw: { ax: number; ay: number; az: number }) {
  const pitch = Math.atan2(-raw.ax, Math.hypot(raw.ay, raw.az));
  const roll = Math.atan2(raw.ay, raw.az);
  return { pitch: (pitch * 180) / Math.PI, roll: (roll * 180) / Math.PI };
}

/** A "Comfort" word for the weather station screen, from temperature and humidity. */
export function comfort(tempC: number, humidity: number): "cold" | "dry" | "humid" | "hot" | "ok" {
  if (tempC < 18) return "cold";
  if (tempC > 30) return "hot";
  if (humidity < 30) return "dry";
  if (humidity > 65) return "humid";
  return "ok";
}
