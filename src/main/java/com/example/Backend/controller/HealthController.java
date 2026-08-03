package com.example.Backend.controller;

import com.example.Backend.model.HealthStat;
import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.services.AdvisoryEngine;
import com.example.Backend.services.HealthStatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private HealthStatService healthStatService;

    @Autowired
    private AdvisoryEngine advisoryEngine;

    @Autowired
    private UserRepository userRepository;

    // Temporary: Simulated AQI fetch (to be replaced by Dev B’s service)
    private Map<String, Object> getSimulatedAqiAndLocation(String district) {
        Map<String, Object> data = new LinkedHashMap<>();
        Map<String, Object> location = new LinkedHashMap<>();
        location.put("state", "Maharashtra");
        location.put("district", district);
        location.put("city", "Kalyan");
        location.put("lat", 19.2437);
        location.put("lng", 73.1355);

        Map<String, Object> aqiData = new LinkedHashMap<>();
        aqiData.put("aqi_score", 168);
        aqiData.put("status", "Unhealthy");
        aqiData.put("dominant_pollutant", "PM2.5");
        aqiData.put("color_code", "#FF9900");

        data.put("location", location);
        data.put("aqi_data", aqiData);
        return data;
    }

    @GetMapping("/health-stats/{district}")
    public List<HealthStat> getDistrictStats(@PathVariable String district) {
        return healthStatService.getStatsByDistrict(district);
    }

    @GetMapping("/dashboard-data")
    public Map<String, Object> getDashboardData(
            @RequestParam String userEmail,
            @RequestParam(defaultValue = "Thane") String district) {

        // 1. Fetch user
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = userOpt.get();

        // 2. Get AQI & Location (simulated)
        Map<String, Object> aqiLocation = getSimulatedAqiAndLocation(district);
        Map<String, Object> aqiData = (Map<String, Object>) aqiLocation.get("aqi_data");

        // 3. Regional health stats
        List<HealthStat> stats = healthStatService.getStatsByDistrict(district);
        double totalAffected = stats.stream()
                .mapToDouble(HealthStat::getCasesPercentage)
                .sum();
        List<Map<String, Object>> topDiseases = stats.stream()
                .sorted(Comparator.comparingDouble(HealthStat::getCasesPercentage).reversed())
                .map(s -> {
                    Map<String, Object> d = new LinkedHashMap<>();
                    d.put("name", s.getDisease());
                    d.put("type", s.getType());
                    d.put("severity", s.getSeverity());
                    d.put("cases_percentage", s.getCasesPercentage());
                    return d;
                })
                .collect(Collectors.toList());

        // 4. Personalized alert
        Map<String, Object> alert = advisoryEngine.generateAlert(
                user.getMedicalConditions(),
                (int) aqiData.get("aqi_score"),
                (String) aqiData.get("status")
        );

        // 5. Build final response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("location", aqiLocation.get("location"));
        response.put("aqi_data", aqiData);
        response.put("regional_health_stats", Map.of(
                "total_affected_percentage", Math.round(totalAffected * 10) / 10.0,
                "top_diseases", topDiseases
        ));
        response.put("personalized_alert", alert != null ? alert : Map.of("has_warning", false));

        return response;
    }
}