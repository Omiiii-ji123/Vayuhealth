package com.example.Backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
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

    private String email;

    @Field("passwordHash")
    private String passwordHash;

    private Integer age;

    private List<String> medicalConditions;

    private Location location;

    private String fcmToken;

    // timestamps are handled by Spring Data MongoDB automatically if you enable
    // auditing, but you can also add manually:
    // private Date createdAt;
    // private Date updatedAt;
}