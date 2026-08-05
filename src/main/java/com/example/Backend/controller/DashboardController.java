package com.example.Backend.controller;

import com.example.Backend.model.SurveillanceStat;
import com.example.Backend.services.SurveillanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private SurveillanceService surveillanceService;

    @GetMapping("/surveillance")
    public ResponseEntity<List<SurveillanceStat>> getAllSurveillanceStats() {
        return ResponseEntity.ok(surveillanceService.getAllRegionalStats());
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<SurveillanceStat> getStatsByCity(@PathVariable String city) {
        return surveillanceService.getStatsByCity(city)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<List<SurveillanceStat>> getStatsByState(@PathVariable String state) {
        return ResponseEntity.ok(surveillanceService.getStatsByState(state));
    }
}
