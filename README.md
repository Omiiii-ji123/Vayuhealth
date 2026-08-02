# RespiraShield 🌬️🛡️

**RespiraShield** is an AI-driven platform that goes beyond displaying air quality data. It interprets environmental conditions (AQI, weather, pollutants) and cross-references them with your personal health profile to generate **tailored respiratory risk assessments** and **preventive recommendations** – including Ayurvedic home remedies.

## 🎯 Key Features
- 📊 **Real‑time AQI & Weather Integration** – Aggregated from OpenWeather / IQAir / CPCB.
- 🩺 **Personalized Health Alerts** – Risk warnings based on user conditions (Asthma, COPD, Allergies).
- 🌿 **Ayurvedic & First‑Aid Guidance** – In‑app preventive tips when air quality deteriorates.
- 📍 **Geofencing & Location‑Aware** – Assesses risk based on your current district or movement.
- 🗺️ **District‑Wise Disease Statistics** – Visualizes local respiratory illness prevalence.
- 🔔 **Push Notifications** – Proactive alerts when AQI crosses dangerous thresholds.
- 🕹️ **Demo Simulator** – For SIH judges, a location/AQI spoofing endpoint to test the full pipeline.

## 🏗️ Tech Stack
- **Backend:** Node.js / Spring Boot, MongoDB Atlas, Firebase Admin SDK (FCM)
- **AI/ML:** Rule‑based expert engine (expandable to ML models)
- **Frontend:** Flutter / React Native (cross‑platform mobile)
- **APIs:** OpenWeatherMap, IQAir, CPCB

## 🚀 Quick Start
1. Clone the repo  
2. Set up `.env` with your API keys and MongoDB URI  
3. Run `npm install` (or `mvn spring-boot:run`)  
4. Seed the database with `npm run seed`  
5. Start the server and connect your Flutter/React Native app

## 📂 Project Structure
- `/backend` – All server‑side code, models, routes, services, and seeders
- `/frontend` – Mobile app UI (coming soon / separate repo)

## 👥 Team
- **Developer A** – Frontend (Flutter/React Native)
- **Developer B** – AQI Pipeline, Geofencing & Notifications
- **Developer C** – Health DB, Personalization Engine & Advisory Logic

---
*Built for Smart India Hackathon 2026 – tackling respiratory health through technology.*
