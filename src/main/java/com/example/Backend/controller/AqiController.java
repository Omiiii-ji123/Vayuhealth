package com.example.Backend.controller;

import com.example.Backend.model.AqiData;
import com.example.Backend.services.AqiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aqi")
@CrossOrigin(origins = "*")
public class AqiController {

    @Autowired
    private AqiService aqiService;

    @GetMapping("/city/{cityName}")
    public ResponseEntity<AqiData> getAqiByCity(@PathVariable String cityName) {
        return ResponseEntity.ok(aqiService.getAqiByCity(cityName));
    }

    @GetMapping("/coords")
    public ResponseEntity<AqiData> getAqiByCoords(@RequestParam double lat, @RequestParam double lng) {
        return ResponseEntity.ok(aqiService.calculateAqiFromCoordinates(lat, lng));
    }

    @GetMapping("/all")
    public ResponseEntity<List<AqiData>> getAllAqiRecords() {
        return ResponseEntity.ok(aqiService.getAllAqiRecords());
    }
}
