package com.example.Backend.repository;

import com.example.Backend.model.SurveillanceStat;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SurveillanceStatRepository extends MongoRepository<SurveillanceStat, String> {
    Optional<SurveillanceStat> findByCityIgnoreCase(String city);

    List<SurveillanceStat> findByStateIgnoreCase(String state);

    List<SurveillanceStat> findByDistrictIgnoreCase(String district);
}
