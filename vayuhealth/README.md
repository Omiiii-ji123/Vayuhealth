# VayuHealth — Environmental Health Dashboard

A React + Vite frontend for the VayuHealth Spring Boot API (21 REST endpoints
across 6 controllers: AQI, Auth, Dashboard/Surveillance, Diseases, Health, Users).

## Setup

```bash
npm install
npm run dev
```

The app runs on Vite's default dev port and talks to the backend at
`http://localhost:8081` (configured in `src/api/client.js`). Start your
Spring Boot API on port 8081 before signing in.

## Structure

- `src/api/` — one file per controller, one function per endpoint, matching
  the API reference exactly (client.js holds the shared axios instance).
- `src/context/` — AuthContext (login/register/session) and ThemeContext
  (light/dark mode).
- `src/hooks/useAsync.js` — small fetch/loading/error hook used everywhere.
- `src/pages/` — one page per app section:
  - `Login`, `Register` → `/api/auth/*`
  - `Dashboard` → `/api/aqi/city`, `/api/aqi/coords`, `/api/dashboard/surveillance`, `/api/dashboard-data`
  - `AirQualityMap` → `/api/aqi/all`, `/api/aqi/city`, `/api/aqi/coords`
  - `Diseases`, `DiseaseDetail` → all 5 `/api/diseases/*` endpoints
  - `Surveillance` → `/api/dashboard/*`, `/api/health-stats/{district}`
  - `AIAssistant` → combines AQI + disease data into a live Q&A assistant
  - `Profile` → `/api/users/*`, `/api/auth/profile/{id}`
  - `Settings` → theme/notification preferences (local) + API connection info

## Notes

- Backend response field names aren't guaranteed 1:1, so `src/utils/aqi.js`
  and `src/utils/disease.js` normalize common aliases (e.g. `pm2_5` vs `pm25`)
  defensively.
- The Historical AQI Trend chart uses a history array from
  `/api/dashboard-data` if present; otherwise it shows a clearly-labeled
  estimated trend anchored to the current live AQI reading.
