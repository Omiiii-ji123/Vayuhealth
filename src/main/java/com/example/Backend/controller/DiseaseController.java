package com.example.Backend.controller;

import com.example.Backend.model.Disease;
import com.example.Backend.model.Remedy;
import com.example.Backend.services.DiseaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diseases")
@CrossOrigin(origins = "*")
public class DiseaseController {

    @Autowired
    private DiseaseService diseaseService;

    @GetMapping
    public List<Disease> getAllDiseases() {
        return diseaseService.getAllDiseases();
    }

    @GetMapping("/category/{category}")
    public List<Disease> getDiseasesByCategory(@PathVariable String category) {
        return diseaseService.getDiseasesByCategory(category);
    }

    @GetMapping("/transmission/{transmission}")
    public List<Disease> getDiseasesByTransmission(@PathVariable String transmission) {
        return diseaseService.getDiseasesByTransmission(transmission);
    }

    @GetMapping("/remedies/{diseaseName}")
    public List<Remedy> getRemedies(@PathVariable String diseaseName) {
        return diseaseService.getRemediesForDisease(diseaseName);
    }

    @GetMapping("/{idOrName}")
    public Disease getDiseaseByIdOrName(@PathVariable String idOrName) {
        return diseaseService.getDiseaseByIdOrName(idOrName)
                .orElseThrow(() -> new RuntimeException("Disease not found"));
    }
}
