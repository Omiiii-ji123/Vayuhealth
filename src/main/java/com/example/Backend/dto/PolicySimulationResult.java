package com.example.Backend.dto;

import com.example.Backend.model.CoupledForecastData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicySimulationResult {
    private String stationName;
    private double baselineAvgAqi;
    private double simulatedAvgAqi;
    private double aqiReductionPercent;
    
    private double baselineAvgPM25;
    private double simulatedAvgPM25;
    private double pm25ReductionPercent;

    private String baselineGrapStage;
    private String simulatedGrapStage;

    private int estimatedHospitalAdmissionsAvoided;
    private int acuteAsthmaAttacksPrevented;
    private String summaryMessage;

    private List<CoupledForecastData> baselineTimeline;
    private List<CoupledForecastData> simulatedTimeline;
}
