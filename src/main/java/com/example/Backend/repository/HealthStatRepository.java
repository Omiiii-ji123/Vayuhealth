package com.example.Backend.repository;

import com.example.Backend.model.HealthStat;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface HealthStatRepository extends MongoRepository<HealthStat, String> {
    List<HealthStat> findByDistrict(String district);
    List<HealthStat> findByDistrictAndType(String district, String type);
}
