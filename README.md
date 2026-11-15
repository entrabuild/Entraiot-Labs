# ENTRAIOT Labs: ESP32-S3 bench guide

**Created by ENTRAIOT Labs**, a unit of **Entraiot Solutions**, Chennai.

An interactive ESP32-S3 learning guide: a live pinout, step-by-step IoT lessons (display, Wi-Fi, RFID/NFC, sensors, Bluetooth LE, sound), in-browser simulators, a code reader and a datasheet reader, in 12 languages. Works offline as a PWA.

| Role | Name |
| --- | --- |
| MD & CEO | Shalini L |
| Founder & Director | Salvin Jones |

Website: [entraiot.com](https://entraiot.com) · Contact: salvin@entraiot.com

## Run it locally

```bash
corepack enable          # or: npm i -g pnpm@11.10.0
pnpm install
pnpm dev                 # http://localhost:5180
pnpm check && pnpm build # typecheck, lint, tests, production build into dist/
```

Requires Node 24.14 or newer.

## Deploy to Vercel

Import the Git repository in Vercel. `vercel.json` already sets the install command, build command and `dist` output. In **Project Settings → General → Node.js Version** pick **24.x**.

Optional environment variables (see `.env.example`):

| Variable | Default | What it does |
| --- | --- | --- |
| `VITE_LABS_SOURCE_URL` | empty | URL of your firmware `labs/` folder on GitHub. Empty hides the "code on GitHub" card. |
| `FIRMWARE_DIR` | `../entraiot-labs` | Firmware checkout the code reader shows. Missing = code reader empty, rest of the site works. |
| `FIRMWARE_REQUIRED` | empty | Set to `1` to fail the build when the firmware is missing. |

## White-labelling

All branding lives in one file, `src/config/brand.ts`:

| Field | Shown as |
| --- | --- |
| `mark` | Header label (`ENTRAIOT`) |
| `maker` | Footer credit ("Created by ENTRAIOT Labs") |
| `company` | Footer, after the maker |
| `url` | Where the footer credit links |

The browser tab title and header subtitle are in `src/locales/<language>/common.json` (`app.title`, `layout.brand`).

## Stack

React 19, React Router 8, TanStack Query, i18next, Three.js, Vite 8, Vitest, TypeScript 6.

## License

Proprietary. Copyright (c) 2026 Entraiot Solutions (ENTRAIOT Labs). All rights reserved. See [LICENSE](LICENSE).
Open-source components keep their own licences, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
