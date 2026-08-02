package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "diseases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Disease {

    @Id
    private String id;

    private String name;          // unique in reality, but no constraint here

    private String type;          // Airborne, Waterborne, Vector-borne, Other

    private String description;

    private List<String> transmission;

    private List<String> symptoms;

    private List<String> precautions;

    private List<Remedy> ayurvedicRemedies;

    private List<String> firstAid;

    private String whenToSeeDoctor;
}