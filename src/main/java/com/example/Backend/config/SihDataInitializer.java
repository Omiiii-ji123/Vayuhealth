package com.example.Backend.config;

import com.example.Backend.model.SurveillanceStat;
import com.example.Backend.model.User;
import com.example.Backend.repository.AqiDataRepository;
import com.example.Backend.repository.SurveillanceStatRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.services.AqiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Order(2)
public class SihDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AqiDataRepository aqiDataRepository;

    @Autowired
    private SurveillanceStatRepository surveillanceStatRepository;

    @Autowired
    private AqiService aqiService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedAqiData();
        seedSurveillanceData();
        System.out.println(">>> SIH auth/AQI/surveillance seed complete");
    }

    private void seedUsers() {
        ensureDemoUser(
                "Rahul Sharma",
                "rahul@sih.gov.in",
                28,
                "Delhi",
                "Delhi NCR",
                true,
                true,
                "High",
                List.of("Asthma", "Allergic Rhinitis")
        );
        ensureDemoUser(
                "Priya Patel",
                "priya@sih.gov.in",
                34,
                "Maharashtra",
                "Mumbai",
                false,
                true,
                "Moderate",
                List.of("Allergic Rhinitis")
        );
    }

    private void ensureDemoUser(String name, String email, int age, String state, String city,
                                boolean hasAsthma, boolean hasAllergies, String sensitivity,
                                List<String> conditions) {
        userRepository.findByEmail(email).ifPresentOrElse(existing -> {
            if (existing.getPasswordHash() == null || existing.getPasswordHash().isBlank()) {
                existing.setPasswordHash(passwordEncoder.encode("password123"));
                existing.setHasAsthma(hasAsthma);
                existing.setHasAllergies(hasAllergies);
                existing.setSensitivityLevel(sensitivity);
                existing.setMedicalConditions(conditions);
                existing.setState(state);
                existing.setCity(city);
                userRepository.save(existing);
            }
        }, () -> userRepository.save(User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .age(age)
                .state(state)
                .city(city)
                .hasAsthma(hasAsthma)
                .hasAllergies(hasAllergies)
                .hasHeartCondition(false)
                .isElderly(false)
                .sensitivityLevel(sensitivity)
                .medicalConditions(conditions)
                .build()));
    }

    private void seedAqiData() {
        if (aqiDataRepository.count() > 0) {
            return;
        }

        aqiDataRepository.save(aqiService.createAqiObject("Anand Vihar, Delhi", "Delhi", "East Delhi", "Delhi NCR", 28.64, 77.31, 342));
        aqiDataRepository.save(aqiService.createAqiObject("Connaught Place, Delhi", "Delhi", "New Delhi", "New Delhi", 28.63, 77.21, 185));
        aqiDataRepository.save(aqiService.createAqiObject("BKC, Mumbai", "Maharashtra", "Mumbai Suburban", "Mumbai", 19.06, 72.86, 162));
        aqiDataRepository.save(aqiService.createAqiObject("Colaba, Mumbai", "Maharashtra", "Mumbai City", "Colaba", 18.90, 72.81, 92));
        aqiDataRepository.save(aqiService.createAqiObject("Electronic City, Bengaluru", "Karnataka", "Bengaluru Urban", "Bengaluru", 12.84, 77.66, 58));
        aqiDataRepository.save(aqiService.createAqiObject("Adyar, Chennai", "Tamil Nadu", "Chennai", "Chennai", 13.00, 80.25, 45));
        aqiDataRepository.save(aqiService.createAqiObject("Howrah, Kolkata", "West Bengal", "Howrah", "Kolkata", 22.59, 88.31, 245));
        aqiDataRepository.save(aqiService.createAqiObject("HITEC City, Hyderabad", "Telangana", "Rangareddy", "Hyderabad", 17.44, 78.37, 115));
        aqiDataRepository.save(aqiService.createAqiObject("Narol, Ahmedabad", "Gujarat", "Ahmedabad", "Ahmedabad", 22.97, 72.58, 210));
        aqiDataRepository.save(aqiService.createAqiObject("Shivajinagar, Pune", "Maharashtra", "Pune", "Pune", 18.53, 73.85, 128));
        aqiDataRepository.save(aqiService.createAqiObject("Pink City, Jaipur", "Rajasthan", "Jaipur", "Jaipur", 26.91, 75.78, 175));
        aqiDataRepository.save(aqiService.createAqiObject("Charbagh, Lucknow", "Uttar Pradesh", "Lucknow", "Lucknow", 26.83, 80.92, 280));
        aqiDataRepository.save(aqiService.createAqiObject("Gandhi Maidan, Patna", "Bihar", "Patna", "Patna", 25.61, 85.14, 315));
        aqiDataRepository.save(aqiService.createAqiObject("Dispur, Guwahati", "Assam", "Kamrup Metropolitan", "Guwahati", 26.14, 91.78, 95));
    }

    private void seedSurveillanceData() {
        if (surveillanceStatRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Delhi").district("New Delhi").city("Delhi NCR")
                .totalActiveCases(42800).affectedPopulationPercentage(18.4)
                .airbornePercentage(84.5).waterbornePercentage(15.5)
                .hospitalBedOccupancyRate(78.0).icuOccupancyRate(45.2)
                .severeCasesCount(1240).reportingHospitalsCount(48)
                .topPrevalentDiseases("Asthma, Tuberculosis, Acute Bronchitis, Influenza A")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Maharashtra").district("Mumbai Suburban").city("Mumbai")
                .totalActiveCases(38500).affectedPopulationPercentage(14.2)
                .airbornePercentage(72.0).waterbornePercentage(28.0)
                .hospitalBedOccupancyRate(64.5).icuOccupancyRate(38.0)
                .severeCasesCount(980).reportingHospitalsCount(52)
                .topPrevalentDiseases("Asthma, COPD, Typhoid, Gastroenteritis")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Karnataka").district("Bengaluru Urban").city("Bengaluru")
                .totalActiveCases(19200).affectedPopulationPercentage(8.6)
                .airbornePercentage(81.0).waterbornePercentage(19.0)
                .hospitalBedOccupancyRate(48.0).icuOccupancyRate(22.5)
                .severeCasesCount(410).reportingHospitalsCount(36)
                .topPrevalentDiseases("Allergic Rhinitis, Asthma, Bronchitis")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Tamil Nadu").district("Chennai").city("Chennai")
                .totalActiveCases(14500).affectedPopulationPercentage(6.2)
                .airbornePercentage(65.0).waterbornePercentage(35.0)
                .hospitalBedOccupancyRate(42.0).icuOccupancyRate(18.0)
                .severeCasesCount(290).reportingHospitalsCount(30)
                .topPrevalentDiseases("COPD, Dengue, Leptospirosis")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("West Bengal").district("Kolkata").city("Kolkata")
                .totalActiveCases(45200).affectedPopulationPercentage(19.8)
                .airbornePercentage(68.0).waterbornePercentage(32.0)
                .hospitalBedOccupancyRate(82.5).icuOccupancyRate(54.0)
                .severeCasesCount(1450).reportingHospitalsCount(44)
                .topPrevalentDiseases("Tuberculosis, Pneumonia, Cholera, Typhoid")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Telangana").district("Rangareddy").city("Hyderabad")
                .totalActiveCases(16800).affectedPopulationPercentage(9.4)
                .airbornePercentage(74.0).waterbornePercentage(26.0)
                .hospitalBedOccupancyRate(51.0).icuOccupancyRate(28.0)
                .severeCasesCount(380).reportingHospitalsCount(28)
                .topPrevalentDiseases("Influenza, Allergic Bronchitis, Typhoid")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Gujarat").district("Ahmedabad").city("Ahmedabad")
                .totalActiveCases(28400).affectedPopulationPercentage(15.1)
                .airbornePercentage(79.0).waterbornePercentage(21.0)
                .hospitalBedOccupancyRate(71.0).icuOccupancyRate(41.0)
                .severeCasesCount(820).reportingHospitalsCount(35)
                .topPrevalentDiseases("Asthma, COPD, Acute Pneumonia")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Rajasthan").district("Jaipur").city("Jaipur")
                .totalActiveCases(22100).affectedPopulationPercentage(12.8)
                .airbornePercentage(83.0).waterbornePercentage(17.0)
                .hospitalBedOccupancyRate(62.0).icuOccupancyRate(33.0)
                .severeCasesCount(610).reportingHospitalsCount(29)
                .topPrevalentDiseases("Silicosis, Asthma, Bronchitis")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Uttar Pradesh").district("Lucknow").city("Lucknow")
                .totalActiveCases(58900).affectedPopulationPercentage(21.5)
                .airbornePercentage(79.0).waterbornePercentage(21.0)
                .hospitalBedOccupancyRate(86.0).icuOccupancyRate(58.0)
                .severeCasesCount(1890).reportingHospitalsCount(65)
                .topPrevalentDiseases("Tuberculosis, Pneumonia, Asthma, Typhoid")
                .lastUpdated(now).build());
        surveillanceStatRepository.save(SurveillanceStat.builder()
                .state("Bihar").district("Patna").city("Patna")
                .totalActiveCases(61200).affectedPopulationPercentage(23.1)
                .airbornePercentage(76.0).waterbornePercentage(24.0)
                .hospitalBedOccupancyRate(88.0).icuOccupancyRate(62.0)
                .severeCasesCount(2100).reportingHospitalsCount(58)
                .topPrevalentDiseases("Tuberculosis, Acute Respiratory Infection, Cholera")
                .lastUpdated(now).build());
    }
}
