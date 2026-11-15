import { lazyWidget, type WidgetMap } from "@/widgets/lazy-widget";

// Every widget the sensors lessons reference, each in its own chunk.
export const sensorsWidgets = {
  sensorBench: lazyWidget(() => import("./SensorPreview"), "SensorPreview"),
  i2cBus: lazyWidget(() => import("./I2cBus"), "I2cBus"),
} as const satisfies WidgetMap;
