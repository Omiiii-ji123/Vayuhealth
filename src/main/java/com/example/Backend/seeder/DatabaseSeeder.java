package com.example.Backend.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.Backend.model.Disease;
import com.example.Backend.model.HealthStat;
import com.example.Backend.repository.DiseaseRepository;
import com.example.Backend.repository.HealthStatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@Order(1)
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private DiseaseRepository diseaseRepository;

    @Autowired
    private HealthStatRepository healthStatRepository;

    @Override
    public void run(String... args) {
        try {
            ObjectMapper mapper = new ObjectMapper();

            // Seed diseases if empty
            if (diseaseRepository.count() == 0) {
                InputStream is = new ClassPathResource("data/diseaseData.json").getInputStream();
                List<Disease> diseases = mapper.readValue(is,
                        new TypeReference<List<Disease>>() {});
                diseaseRepository.saveAll(diseases);
                logger.info("✅ Diseases seeded successfully");
            }

            // Seed health stats if empty
            if (healthStatRepository.count() == 0) {
                InputStream is = new ClassPathResource("data/districtHealthData.json").getInputStream();
                List<HealthStat> stats = mapper.readValue(is,
                        new TypeReference<List<HealthStat>>() {});
                healthStatRepository.saveAll(stats);
                logger.info("✅ Health stats seeded successfully");
            }
        } catch (Exception e) {
            logger.warn("⚠️ Database seeder non-blocking fallback (MongoDB unavailable or initialization skipped): {}", e.getMessage());
        }
    }
}