package com.example.Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private Integer age;
        private String state;
        private String city;
        private Boolean hasAsthma = false;
        private Boolean hasAllergies = false;
        private Boolean hasHeartCondition = false;
        private Boolean isElderly = false;
        private String sensitivityLevel = "Moderate";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String message;
        private Boolean success;
        private Object user;
    }
}
