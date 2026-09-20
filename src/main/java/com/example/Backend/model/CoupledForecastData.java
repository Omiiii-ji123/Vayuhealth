package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoupledForecastData {
    private String time;
    private LocalDateTime dateTime;
    private int hourOffset;

    // Meteorology
    private double temperature;
    private double humidity;
    private double windSpeed;
    private double windDirection;
    private double surfaceSolarIrradiance;

    // Atmospheric Physics & Inversion
    private double boundaryLayerHeight; // PBL Height in meters (m)
    private double inversionStrength;   // 0 - 100%
    private String inversionSeverity;   // Normal, Moderate, Severe, HIGH
    private double aerosolOpticalFeedback; // Two-way feedback multiplier
    private double trappingPenalty;     // Trapped concentration penalty
    private double deltaTInversion;     // ΔT = T_surface - T_950hPa (°C)
    private double bulkRichardson;      // Bulk Richardson number (Rib)
    private double surfacePressure;     // Surface pressure (hPa)
    private double ventilationCoeff;    // Ventilation coefficient (m²/s)
    private double trappingFactor;       // Trapping factor = f(PBL < 300m, wind < 2m/s, positive vertical temp gradient)
    private double plumeArrivalOffsetHours; // Plume arrival offset = Distance / (wind_speed * cos(theta - stubble_bearing))

    // Pollutants (μg/m³)
    private double pm25;
    private double pm10;
    private double o3;
    private double no2;
    private double so2;

    // Computed AQI
    private int aqi;
    private String aqiStatus;
    private String aqiColor;
}
