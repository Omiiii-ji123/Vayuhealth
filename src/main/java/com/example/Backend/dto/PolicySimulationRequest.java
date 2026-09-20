package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicySimulationRequest {
    private String stationName; // e.g. "Anand Vihar, Delhi"
    private double stubbleBurningReductionPercent; // 0 - 100%
    private double vehicularTrafficCutPercent;     // 0 - 100%
    private double industrialEmissionCutPercent;   // 0 - 100%
    private boolean applyOddEvenRule;
    private boolean applyConstructionBan;
    private boolean applyTruckEntryBan;
}
