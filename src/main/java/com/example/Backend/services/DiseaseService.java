package com.example.Backend.services;

import com.example.Backend.model.Disease;
import com.example.Backend.model.Remedy;
import com.example.Backend.repository.DiseaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DiseaseService {

    @Autowired
    private DiseaseRepository diseaseRepository;

    public List<Disease> getAllDiseases() {
        return diseaseRepository.findAll();
    }

    public Optional<Disease> getDiseaseByName(String name) {
        return diseaseRepository.findByNameIgnoreCase(name)
                .or(() -> diseaseRepository.findByName(name));
    }

    public Optional<Disease> getDiseaseById(String id) {
        return diseaseRepository.findById(id);
    }

    public Optional<Disease> getDiseaseByIdOrName(String idOrName) {
        Optional<Disease> byId = diseaseRepository.findById(idOrName);
        if (byId.isPresent()) {
            return byId;
        }
        return getDiseaseByName(idOrName);
    }

    public List<Disease> getDiseasesByCategory(String category) {
        return diseaseRepository.findByTypeIgnoreCase(category);
    }

    public List<Disease> getDiseasesByTransmission(String transmission) {
        String needle = transmission.toLowerCase();
        return diseaseRepository.findAll().stream()
                .filter(d -> d.getTransmission() != null && d.getTransmission().stream()
                        .anyMatch(t -> t != null && t.toLowerCase().contains(needle)))
                .collect(Collectors.toList());
    }

    public List<Remedy> getRemediesForDisease(String diseaseName) {
        return getDiseaseByName(diseaseName)
                .map(Disease::getAyurvedicRemedies)
                .orElse(List.of());
    }
}
