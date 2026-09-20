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
public class StubbleFireData {
    private String id;
    private double latitude;
    private double longitude;
    private String state;
    private String district;
    private double brightnessTemperature; // Kelvin
    private double fireRadiativePower;    // MW (FRP)
    private String confidence;            // nominal, high
    private LocalDateTime detectedAt;
    
    // Plume Dispersion Metrics
    private double plumeSpeedKmH;
    private double plumeDirectionDeg;
    private double estimatedDelhiArrivalHours;
    private double estimatedDelhiPM25Influx; // μg/m³
}
