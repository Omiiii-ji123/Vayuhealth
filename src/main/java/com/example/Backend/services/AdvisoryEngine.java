package com.example.Backend.services;

import com.example.Backend.model.Disease;
import com.example.Backend.model.Remedy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvisoryEngine {

    @Autowired
    private DiseaseService diseaseService;

    private static final Set<String> RESPIRATORY_CONDITIONS =
            Set.of("Asthma", "COPD", "Allergic Rhinitis", "Acute Respiratory Infection");

    /**
     * Generates personalized alert based on user's conditions and current AQI.
     *
     * @param medicalConditions List of user's medical conditions
     * @param aqiScore Current AQI score
     * @param aqiStatus Current AQI status string (e.g., "Unhealthy")
     * @return Optional alert map (null if no warning)
     */
    public Map<String, Object> generateAlert(List<String> medicalConditions,
                                             int aqiScore,
                                             String aqiStatus) {
        if (medicalConditions == null || medicalConditions.isEmpty()) {
            return null;
        }

        // Find first matching respiratory condition
        String matchedCondition = medicalConditions.stream()
                .filter(RESPIRATORY_CONDITIONS::contains)
                .findFirst()
                .orElse(null);

        if (matchedCondition == null) {
            return null; // no respiratory risk
        }

        // Determine risk level
        if (aqiScore <= 100) {
            return null; // moderate or good - no alert
        }

        Optional<Disease> diseaseOpt = diseaseService.getDiseaseByName(matchedCondition);
        if (diseaseOpt.isEmpty()) {
            return null;
        }

        Disease disease = diseaseOpt.get();
        String warningMessage;
        String ayurvedicRecommendation = "";

        if (aqiScore > 150) {
            warningMessage = String.format(
                "AQI is %d (%s). Based on your %s profile, wear an N95 mask outdoors and limit outdoor activities.",
                aqiScore, aqiStatus, matchedCondition
            );
            // Pick first Ayurvedic remedy
            if (disease.getAyurvedicRemedies() != null && !disease.getAyurvedicRemedies().isEmpty()) {
                Remedy remedy = disease.getAyurvedicRemedies().get(0);
                ayurvedicRecommendation = remedy.getTitle() + ": " + remedy.getDescription();
            }
        } else {
            warningMessage = String.format(
                "AQI is %d (%s). Mild risk for %s patients. Keep windows closed and consider using an air purifier.",
                aqiScore, aqiStatus, matchedCondition
            );
        }

        Map<String, Object> alert = new LinkedHashMap<>();
        alert.put("has_warning", true);
        alert.put("user_condition", matchedCondition);
        alert.put("warning_message", warningMessage);
        alert.put("ayurvedic_recommendation", ayurvedicRecommendation);

        return alert;
    }
}