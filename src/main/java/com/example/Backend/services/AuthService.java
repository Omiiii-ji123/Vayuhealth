package com.example.Backend.services;

import com.example.Backend.dto.AuthDto;
import com.example.Backend.model.Location;
import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthDto.AuthResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return new AuthDto.AuthResponse("Email is already registered!", false, null);
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .age(req.getAge())
                .state(req.getState())
                .city(req.getCity())
                .hasAsthma(Boolean.TRUE.equals(req.getHasAsthma()))
                .hasAllergies(Boolean.TRUE.equals(req.getHasAllergies()))
                .hasHeartCondition(Boolean.TRUE.equals(req.getHasHeartCondition()))
                .isElderly(Boolean.TRUE.equals(req.getIsElderly()))
                .sensitivityLevel(req.getSensitivityLevel() != null ? req.getSensitivityLevel() : "Moderate")
                .medicalConditions(buildMedicalConditions(req))
                .location(Location.builder()
                        .state(req.getState())
                        .city(req.getCity())
                        .build())
                .build();

        User savedUser = userRepository.save(user);
        return new AuthDto.AuthResponse("User registered successfully!", true, savedUser);
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            return new AuthDto.AuthResponse("Invalid email or password", false, null);
        }

        User user = userOpt.get();
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return new AuthDto.AuthResponse("Invalid email or password", false, null);
        }

        return new AuthDto.AuthResponse("Login successful", true, user);
    }

    public User updateHealthProfile(String userId, User profileData) {
        return userRepository.findById(userId).map(user -> {
            if (profileData.getHasAsthma() != null) {
                user.setHasAsthma(profileData.getHasAsthma());
            }
            if (profileData.getHasAllergies() != null) {
                user.setHasAllergies(profileData.getHasAllergies());
            }
            if (profileData.getHasHeartCondition() != null) {
                user.setHasHeartCondition(profileData.getHasHeartCondition());
            }
            if (profileData.getIsElderly() != null) {
                user.setIsElderly(profileData.getIsElderly());
            }
            if (profileData.getSensitivityLevel() != null) {
                user.setSensitivityLevel(profileData.getSensitivityLevel());
            }
            if (profileData.getState() != null) {
                user.setState(profileData.getState());
            }
            if (profileData.getCity() != null) {
                user.setCity(profileData.getCity());
            }
            if (profileData.getAge() != null) {
                user.setAge(profileData.getAge());
            }
            if (profileData.getMedicalConditions() != null) {
                user.setMedicalConditions(profileData.getMedicalConditions());
            } else {
                user.setMedicalConditions(syncMedicalConditions(user));
            }
            if (user.getLocation() == null) {
                user.setLocation(new Location());
            }
            if (profileData.getState() != null) {
                user.getLocation().setState(profileData.getState());
            }
            if (profileData.getCity() != null) {
                user.getLocation().setCity(profileData.getCity());
            }
            return userRepository.save(user);
        }).orElse(null);
    }

    private List<String> buildMedicalConditions(AuthDto.RegisterRequest req) {
        List<String> conditions = new ArrayList<>();
        if (Boolean.TRUE.equals(req.getHasAsthma())) {
            conditions.add("Asthma");
        }
        if (Boolean.TRUE.equals(req.getHasAllergies())) {
            conditions.add("Allergic Rhinitis");
        }
        if (Boolean.TRUE.equals(req.getHasHeartCondition())) {
            conditions.add("Heart Condition");
        }
        if (Boolean.TRUE.equals(req.getIsElderly())) {
            conditions.add("Elderly");
        }
        return conditions;
    }

    private List<String> syncMedicalConditions(User user) {
        List<String> conditions = new ArrayList<>();
        if (Boolean.TRUE.equals(user.getHasAsthma())) {
            conditions.add("Asthma");
        }
        if (Boolean.TRUE.equals(user.getHasAllergies())) {
            conditions.add("Allergic Rhinitis");
        }
        if (Boolean.TRUE.equals(user.getHasHeartCondition())) {
            conditions.add("Heart Condition");
        }
        if (Boolean.TRUE.equals(user.getIsElderly())) {
            conditions.add("Elderly");
        }
        return conditions;
    }
}
