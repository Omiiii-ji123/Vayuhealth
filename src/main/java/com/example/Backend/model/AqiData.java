package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "aqi_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AqiData {

    @Id
    private String id;

    private String locationName;
    private String state;
    private String district;
    private String city;

    private Double latitude;
    private Double longitude;

    private Integer aqi;
    private Double scorePercentage;
    private String status;

    private Double pm25;
    private Double pm10;
    private Double no2;
    private Double so2;
    private Double o3;
    private Double co;

    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private Integer uvIndex;

    private String healthAdvice;

    @Builder.Default
    private Boolean isHazardous = false;
}
