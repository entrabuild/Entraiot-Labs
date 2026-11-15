/* eslint-disable i18next/no-literal-string -- units (°C, %, hPa, m), the same in every language. */
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInterval } from "@/lib/animation";
import { Caption } from "@/ui/Caption";
import { Terminal, useTerminalLog } from "@/ui/terminal/Terminal";
import type { WidgetProps } from "@/widgets/types";
import {
  accelRaw,
  ahtDecode,
  ahtRaw,
  altitudeFromPressure,
  comfort,
  dewPoint,
  hex,
  I2C_ADDR,
  pressureAtAltitude,
  tiltFromAccel,
  VIEW_SENSORS,
} from "./sensor-model";
import styles from "./sensors.module.css";

interface Env {
  temp: number;
  hum: number;
  alt: number;
  pitch: number;
  roll: number;
}

const CAPTIONS = ["caption.v0", "caption.v1", "caption.v2", "caption.v3"] as const;

const START: Env = { temp: 27, hum: 58, alt: 10, pitch: 0, roll: 0 };

/** A little sensor noise, like the real parts: ± half a step. */
const jitter = (step: number) => (Math.random() - 0.5) * step;

/**
 * The sensors track's preview: sliders stand in for the room (heat, damp, height, tilt), the
 * board reads its I2C sensors once a second and prints what the firmware prints.
 * lesson.preview.view picks the sensors: 0 AHT20, 1 BMP280, 2 MPU6050, 3 all (weather station).
 */
export function SensorPreview({ lesson }: WidgetProps) {
  const { t } = useTranslation("labs-sensors");
  const view = Math.min(3, Math.max(0, lesson.preview?.view ?? 0));
  const sensors = VIEW_SENSORS[view] ?? [];
  const has = (s: (typeof sensors)[number]) => sensors.includes(s);
  const term = useTerminalLog();
  const ids = useId();
  const [env, setEnv] = useState<Env>(START);
  const set = (key: keyof Env, value: number) => setEnv((e) => ({ ...e, [key]: value }));

  // Boot: the I2C scan every sensor lab starts with.
  useEffect(() => {
    const found = (VIEW_SENSORS[view] ?? []).map((s) => `${hex(I2C_ADDR[s])} (${s.toUpperCase()})`);
    const lines = [
      "ESP-ROM:esp32s3-20210327",
      "[I][main.cpp] setup(): I2C on SDA=GPIO1, SCL=GPIO2 at 400 kHz",
      "[I][main.cpp] setup(): scanning 0x08..0x77 …",
      `[I][main.cpp] setup(): found ${found.join(", ")}`,
    ];
    const timers = lines.map((line, i) => setTimeout(() => term.line(line, i ? "info" : "plain"), 160 * i));
    return () => {
      timers.forEach(clearTimeout);
      term.clear();
    };
  }, [term, view]);

  // What the sensors report right now (with noise), as the firmware decodes it.
  const climate = ahtDecode(ahtRaw(env.temp, env.hum));
  const hpa = pressureAtAltitude(env.alt);
  const tilt = tiltFromAccel(accelRaw(env.pitch, env.roll));

  useInterval(() => {
    const parts: string[] = [];
    if (has("aht20")) {
      const raw = ahtRaw(env.temp + jitter(0.1), env.hum + jitter(0.4));
      const d = ahtDecode(raw);
      parts.push(`T=${d.tempC.toFixed(1)}°C RH=${d.humidity.toFixed(1)}%`);
    }
    if (has("bmp280")) {
      const p = pressureAtAltitude(env.alt) + jitter(0.06);
      parts.push(`P=${p.toFixed(2)}hPa alt=${altitudeFromPressure(p).toFixed(1)}m`);
    }
    if (has("mpu6050")) {
      const raw = accelRaw(env.pitch + jitter(0.6), env.roll + jitter(0.6));
      const a = tiltFromAccel(raw);
      parts.push(`ax=${raw.ax} ay=${raw.ay} az=${raw.az} pitch=${a.pitch.toFixed(0)}° roll=${a.roll.toFixed(0)}°`);
    }
    term.line(`[I][main.cpp] loop(): ${parts.join("  ")}`, "info");
  }, 1000);

  const slider = (key: keyof Env, min: number, max: number, unit: string, step = 1) => (
    <label htmlFor={`${ids}${key}`} className={styles.control}>
      <span>{t(`controls.${key}`)}</span>
      <input
        id={`${ids}${key}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={env[key]}
        onChange={(e) => set(key, Number(e.target.value))}
      />
      <output htmlFor={`${ids}${key}`}>
        {env[key]}
        {unit}
      </output>
    </label>
  );

  const mood = comfort(climate.tempC, climate.humidity);

  return (
    <div className={styles.sim}>
      <div className={styles.controls} role="group" aria-label={t("controls.label")}>
        {has("aht20") ? (
          <>
            {slider("temp", -10, 45, "°C")}
            {slider("hum", 5, 95, "%")}
          </>
        ) : null}
        {has("bmp280") ? slider("alt", 0, 3000, " m", 10) : null}
        {has("mpu6050") ? (
          <>
            {slider("pitch", -80, 80, "°")}
            {slider("roll", -80, 80, "°")}
          </>
        ) : null}
      </div>

      <div className={styles.screen} aria-live="polite">
        {has("aht20") ? (
          <>
            <div className={styles.tile}>
              <span>{t("read.temp")}</span>
              <b>{climate.tempC.toFixed(1)} °C</b>
            </div>
            <div className={styles.tile}>
              <span>{t("read.hum")}</span>
              <b>{climate.humidity.toFixed(0)} %</b>
            </div>
            <div className={styles.tile}>
              <span>{t("read.dew")}</span>
              <b>{dewPoint(climate.tempC, climate.humidity).toFixed(1)} °C</b>
            </div>
          </>
        ) : null}
        {has("bmp280") ? (
          <>
            <div className={styles.tile}>
              <span>{t("read.pressure")}</span>
              <b>{hpa.toFixed(1)} hPa</b>
            </div>
            <div className={styles.tile}>
              <span>{t("read.altitude")}</span>
              <b>{altitudeFromPressure(hpa).toFixed(0)} m</b>
            </div>
          </>
        ) : null}
        {has("mpu6050") ? (
          <div className={styles.level}>
            <svg viewBox="-50 -50 100 100" role="img" aria-label={t("read.level", { pitch: tilt.pitch.toFixed(0), roll: tilt.roll.toFixed(0) })}>
              <circle className={styles.ring} r={44} />
              <circle className={styles.ring} r={14} />
              <line className={styles.ring} x1={-44} x2={44} y1={0} y2={0} />
              <line className={styles.ring} x1={0} x2={0} y1={-44} y2={44} />
              <circle className={styles.bubble} r={8} cx={(-tilt.roll / 80) * 36} cy={(tilt.pitch / 80) * 36} />
            </svg>
            <span>
              {t("read.pitchRoll", { pitch: tilt.pitch.toFixed(0), roll: tilt.roll.toFixed(0) })}
            </span>
          </div>
        ) : null}
        {view === 3 ? (
          <div className={`${styles.tile} ${styles.mood}`}>
            <span>{t("read.comfort")}</span>
            <b>{t(`comfort.${mood}`)}</b>
          </div>
        ) : null}
      </div>

      <Terminal log={term} title="$ uv run pio device monitor" />
      <Caption>{t(CAPTIONS[view] ?? "caption.v0")}</Caption>
    </div>
  );
}
