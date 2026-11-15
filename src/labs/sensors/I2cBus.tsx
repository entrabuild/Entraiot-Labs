/* eslint-disable i18next/no-literal-string -- chip names, GPIO numbers and wire names, the same in every language. */
import { useTranslation } from "react-i18next";
import { ScrollBox } from "@/ui/ScrollBox";
import type { WidgetProps } from "@/widgets/types";
import { hex, I2C_ADDR, type SensorKey } from "./sensor-model";
import styles from "./sensors.module.css";

const ORDER: readonly SensorKey[] = ["aht20", "bmp280", "mpu6050"];

/**
 * How I2C works on the bench: two shared wires (SDA data, SCL clock) and power, with every
 * sensor hanging off the same pair and answering only to its own address.
 */
export function I2cBus(_: WidgetProps) {
  const { t } = useTranslation("labs-sensors");
  return (
    <div className={styles.sim}>
      <ScrollBox label={t("bus.diagram")}>
        <svg className={styles.bus} viewBox="0 0 560 200" role="img" aria-label={t("bus.diagram")}>
          <rect className={styles.board} x={10} y={40} width={110} height={120} rx={10} />
          <text className={styles.boardText} x={65} y={96} textAnchor="middle">
            ESP32-S3
          </text>
          <text className={styles.label} x={65} y={116} textAnchor="middle">
            GPIO1 · GPIO2
          </text>
          {(
            [
              ["3V3", 56, styles.vcc],
              ["SDA", 84, styles.sda],
              ["SCL", 112, styles.scl],
              ["GND", 140, styles.gnd],
            ] as const
          ).map(([name, y, cls]) => (
            <g key={name}>
              <line className={cls} x1={120} x2={545} y1={y} y2={y} />
              <text className={styles.label} x={128} y={y - 4}>
                {name}
              </text>
            </g>
          ))}
          {ORDER.map((s, i) => {
            const x = 200 + i * 125;
            return (
              <g key={s}>
                {[56, 84, 112, 140].map((y) => (
                  <circle key={y} className={styles.tap} cx={x + 50} cy={y} r={3.5} />
                ))}
                <line className={styles.drop} x1={x + 50} x2={x + 50} y1={56} y2={168} />
                <rect className={styles.chip} x={x} y={160} width={100} height={34} rx={6} />
                <text className={styles.chipText} x={x + 50} y={176} textAnchor="middle">
                  {s.toUpperCase()}
                </text>
                <text className={styles.label} x={x + 50} y={189} textAnchor="middle">
                  {hex(I2C_ADDR[s])}
                </text>
              </g>
            );
          })}
          <text className={styles.label} x={200} y={24}>
            {t("bus.pullups")}
          </text>
        </svg>
      </ScrollBox>
      <ul className={styles.facts}>
        <li>{t("bus.fact1")}</li>
        <li>{t("bus.fact2")}</li>
        <li>{t("bus.fact3")}</li>
      </ul>
    </div>
  );
}
