package com.example.Backend.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.Backend.model.Disease;
import com.example.Backend.model.HealthStat;
import com.example.Backend.repository.DiseaseRepository;
import com.example.Backend.repository.HealthStatRepository;
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

    @Autowired
    private DiseaseRepository diseaseRepository;

    @Autowired
    private HealthStatRepository healthStatRepository;

    @Override
    public void run(String... args) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        // Seed diseases if empty
        if (diseaseRepository.count() == 0) {
            InputStream is = new ClassPathResource("data/diseaseData.json").getInputStream();
            List<Disease> diseases = mapper.readValue(is,
                    new TypeReference<List<Disease>>() {});
            diseaseRepository.saveAll(diseases);
            System.out.println("✅ Diseases seeded");
        }

        // Seed health stats if empty
        if (healthStatRepository.count() == 0) {
            InputStream is = new ClassPathResource("data/districtHealthData.json").getInputStream();
            List<HealthStat> stats = mapper.readValue(is,
                    new TypeReference<List<HealthStat>>() {});
            healthStatRepository.saveAll(stats);
            System.out.println("✅ Health stats seeded");
        }
    }
}