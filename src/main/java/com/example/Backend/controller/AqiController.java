package com.example.Backend.controller;

import com.example.Backend.model.AqiData;
import com.example.Backend.services.AqiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aqi")
@CrossOrigin(origins = "*")
public class AqiController {

    private final AqiService aqiService;

    public AqiController(AqiService aqiService) {
        this.aqiService = aqiService;
    }

    /*
     * Search by city.
     *
     * Example:
     * GET /api/aqi/city/Mumbai
     */
    @GetMapping("/city/{cityName}")
    public ResponseEntity<AqiData> getAqiByCity(
            @PathVariable String cityName) {

        return ResponseEntity.ok(
                aqiService.getAqiByCity(cityName)
        );
    }

    /*
     * Current user location.
     *
     * The frontend supplies the browser's location.
     * The user does NOT need to know about coordinates.
     *
     * Example:
     * GET /api/aqi/location?lat=19.0760&lng=72.8777
     */
    @GetMapping("/location")
    public ResponseEntity<AqiData> getAqiByLocation(
            @RequestParam double lat,
            @RequestParam double lng) {

        return ResponseEntity.ok(
                aqiService.getAqiForLocation(lat, lng)
        );
    }

    /*
     * Keep this temporarily for compatibility with
     * any existing frontend code.
     */
    @GetMapping("/coords")
    public ResponseEntity<AqiData> getAqiByCoords(
            @RequestParam double lat,
            @RequestParam double lng) {

        return ResponseEntity.ok(
                aqiService.getAqiForLocation(lat, lng)
        );
    }

    @GetMapping("/all")
    public ResponseEntity<List<AqiData>> getAllAqiRecords() {

        return ResponseEntity.ok(
                aqiService.getAllAqiRecords()
        );
    }
}