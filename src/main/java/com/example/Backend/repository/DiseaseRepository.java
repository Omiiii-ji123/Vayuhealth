package com.example.Backend.repository;


import com.example.Backend.model.Disease;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface DiseaseRepository extends MongoRepository<Disease, String> {
    Optional<Disease> findByName(String name);
}
