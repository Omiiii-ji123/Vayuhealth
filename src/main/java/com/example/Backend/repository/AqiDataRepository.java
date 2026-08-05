package com.example.Backend.repository;

import com.example.Backend.model.AqiData;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AqiDataRepository extends MongoRepository<AqiData, String> {
    Optional<AqiData> findByCityIgnoreCase(String city);

    Optional<AqiData> findByLocationNameIgnoreCase(String locationName);
}
