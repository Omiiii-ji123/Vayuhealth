package com.example.Backend.controller;

import com.example.Backend.model.AqiData;
import com.example.Backend.model.HealthStat;
import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.services.AdvisoryEngine;
import com.example.Backend.services.AqiService;
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
    private AqiService aqiService;

    @Autowired
    private UserRepository userRepository;

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

        // 2. Get AQI & Location from live data or fallback
        AqiData aqiDataObj = aqiService.getAqiByCity(district);

        Map<String, Object> location = new LinkedHashMap<>();
        location.put("state", aqiDataObj.getState());
        location.put("district", aqiDataObj.getDistrict());
        location.put("city", aqiDataObj.getCity());
        location.put("lat", aqiDataObj.getLatitude());
        location.put("lng", aqiDataObj.getLongitude());

        Map<String, Object> aqiData = new LinkedHashMap<>();
        aqiData.put("aqi_score", aqiDataObj.getAqi());
        aqiData.put("status", aqiDataObj.getStatus());
        aqiData.put("dominant_pollutant", determineDominantPollutant(aqiDataObj));
        aqiData.put("color_code", getAqiColorCode(aqiDataObj.getAqi()));

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
                aqiDataObj.getAqi(),
                aqiDataObj.getStatus()
        );

        // 5. Build final response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("location", location);
        response.put("aqi_data", aqiData);
        response.put("regional_health_stats", Map.of(
                "total_affected_percentage", Math.round(totalAffected * 10) / 10.0,
                "top_diseases", topDiseases
        ));
        response.put("personalized_alert", alert != null ? alert : Map.of("has_warning", false));

        return response;
    }

    private String determineDominantPollutant(AqiData aqiData) {
        if (aqiData.getPm25() >= aqiData.getPm10() && aqiData.getPm25() >= aqiData.getNo2()
                && aqiData.getPm25() >= aqiData.getSo2() && aqiData.getPm25() >= aqiData.getO3()
                && aqiData.getPm25() >= aqiData.getCo()) {
            return "PM2.5";
        }
        if (aqiData.getPm10() >= aqiData.getNo2() && aqiData.getPm10() >= aqiData.getSo2()
                && aqiData.getPm10() >= aqiData.getO3() && aqiData.getPm10() >= aqiData.getCo()) {
            return "PM10";
        }
        if (aqiData.getNo2() >= aqiData.getSo2() && aqiData.getNo2() >= aqiData.getO3()
                && aqiData.getNo2() >= aqiData.getCo()) {
            return "NO2";
        }
        if (aqiData.getSo2() >= aqiData.getO3() && aqiData.getSo2() >= aqiData.getCo()) {
            return "SO2";
        }
        if (aqiData.getO3() >= aqiData.getCo()) {
            return "O3";
        }
        return "CO";
    }

    private String getAqiColorCode(int aqiScore) {
        if (aqiScore <= 50) {
            return "#009966";
        }
        if (aqiScore <= 100) {
            return "#FFDE33";
        }
        if (aqiScore <= 150) {
            return "#FF9933";
        }
        if (aqiScore <= 200) {
            return "#CC0033";
        }
        if (aqiScore <= 300) {
            return "#660099";
        }
        return "#7E0023";
    }
}