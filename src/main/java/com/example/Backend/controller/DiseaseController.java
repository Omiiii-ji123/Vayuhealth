package com.example.Backend.controller;

import com.example.Backend.model.Disease;
import com.example.Backend.services.DiseaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diseases")
public class DiseaseController {

    @Autowired
    private DiseaseService diseaseService;

    @GetMapping
    public List<Disease> getAllDiseases() {
        return diseaseService.getAllDiseases();
    }

    @GetMapping("/{name}")
    public Disease getDiseaseByName(@PathVariable String name) {
        return diseaseService.getDiseaseByName(name)
                .orElseThrow(() -> new RuntimeException("Disease not found"));
    }
}