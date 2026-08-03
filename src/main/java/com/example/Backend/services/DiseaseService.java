package com.example.Backend.services;

import com.example.Backend.model.Disease;
import com.example.Backend.repository.DiseaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DiseaseService {

    @Autowired
    private DiseaseRepository diseaseRepository;

    public List<Disease> getAllDiseases() {
        return diseaseRepository.findAll();
    }

    public Optional<Disease> getDiseaseByName(String name) {
        return diseaseRepository.findByName(name);
    }

    public Optional<Disease> getDiseaseById(String id) {
        return diseaseRepository.findById(id);
    }
}