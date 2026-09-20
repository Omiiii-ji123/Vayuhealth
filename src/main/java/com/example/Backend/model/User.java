package com.example.Backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    @Field("passwordHash")
    private String passwordHash;

    private Integer age;

    private String state;

    private String city;

    @Builder.Default
    private Boolean hasAsthma = false;

    @Builder.Default
    private Boolean hasAllergies = false;

    @Builder.Default
    private Boolean hasHeartCondition = false;

    @Builder.Default
    private Boolean isElderly = false;

    @Builder.Default
    private String sensitivityLevel = "Moderate";

    private List<String> medicalConditions;

    private Location location;

    private String fcmToken;

    @Builder.Default
    private String role = "USER";
}
