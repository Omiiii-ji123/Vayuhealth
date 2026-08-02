package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "health_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthStat {

    @Id
    private String id;

    private String district;

    private String state;

    private String disease;       // name of the disease, e.g., "Acute Respiratory Infection"

    private String type;          // Airborne, Waterborne, etc.

    private String severity;      // Low, Moderate, High, Severe

    private Double casesPercentage;

    private Date lastUpdated;
}