package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "surveillance_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveillanceStat {

    @Id
    private String id;

    private String state;
    private String district;
    private String city;

    private Integer totalActiveCases;
    private Double affectedPopulationPercentage;
    private Double airbornePercentage;
    private Double waterbornePercentage;

    private Double hospitalBedOccupancyRate;
    private Double icuOccupancyRate;
    private Integer severeCasesCount;
    private Integer reportingHospitalsCount;

    private String topPrevalentDiseases;

    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();
}
