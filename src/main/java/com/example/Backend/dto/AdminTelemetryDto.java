package com.example.Backend.dto;

import com.example.Backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class AdminTelemetryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStats {
        private long totalUsersCount;
        private long highRiskAsthmaticCount;
        private long activeCaaqmsStationsCount;
        private long severeHotspotCount;
        private long activeInversionZonesCount;
        private long alertsDispatchedToday;
        private double averageDelhiAqi;
        private String highestRiskDistrict;
        private String timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CaaqmsStationItem {
        private String stationName;
        private String stationCode;
        private double currentPm25;
        private double currentPm10;
        private double nox;
        private double pblHeight;
        private String inversionTrappingStatus;
        private String sensorStatus; // "Active" or "Calibrating"
        private int aqi;
        private String aqiStatus;
        private String state;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegionalRiskItem {
        private String district;
        private String state;
        private int aqi;
        private String aqiStatus;
        private String aqiColor;
        private double pm25;
        private double pm10;
        private double pblHeightMeters;
        private double inversionScore;
        private String inversionSeverity;
        private double stubbleInfluxUgM3;
        private long vulnerableUsersCount;
        private String primaryPollutant;
        private String recommendedGrapStage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserHealthRegistryItem {
        private String id;
        private String name;
        private String email;
        private Integer age;
        private String state;
        private String city;
        private String role;
        private Boolean hasAsthma;
        private Boolean hasAllergies;
        private Boolean hasHeartCondition;
        private Boolean isElderly;
        private String sensitivityLevel;
        private List<String> medicalConditions;
        private int localLiveAqi;
        private String localAqiStatus;
        private String patientRiskTier; // Critical, High, Moderate, Low
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BroadcastAlertRequest {
        private String district;
        private String severity; // CRITICAL, WARNING, ADVISORY
        private String title;
        private String message;
        private String targetCondition; // ALL, ASTHMA, COPD, ELDERLY
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BroadcastAlertResponse {
        private boolean success;
        private int dispatchedCount;
        private String timestamp;
        private String message;
    }
}
