package com.example.Backend.controller;

import com.example.Backend.dto.PolicySimulationRequest;
import com.example.Backend.dto.PolicySimulationResult;
import com.example.Backend.model.CoupledForecastData;
import com.example.Backend.services.CoupledForecastService;
import com.example.Backend.services.StubbleFireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forecast")
@CrossOrigin(origins = "*")
public class CoupledForecastController {

    private final CoupledForecastService coupledForecastService;
    private final StubbleFireService stubbleFireService;

    public CoupledForecastController(CoupledForecastService coupledForecastService,
                                     StubbleFireService stubbleFireService) {
        this.coupledForecastService = coupledForecastService;
        this.stubbleFireService = stubbleFireService;
    }

    /**
     * Get 72-hour coupled forecast for a Delhi-NCR station.
     * Example: GET /api/forecast/delhi-72h?station=Anand+Vihar,+Delhi
     */
    @GetMapping("/delhi-72h")
    public ResponseEntity<Map<String, Object>> get72HourForecast(
            @RequestParam(defaultValue = "Anand Vihar, Delhi") String station) {

        List<CoupledForecastData> timeline = coupledForecastService.get72HourCoupledForecast(station);

        // Compute aggregate metrics for quick UI cards
        double maxAQI = timeline.stream().mapToDouble(CoupledForecastData::getAqi).max().orElse(350);
        double minPBL = timeline.stream().mapToDouble(CoupledForecastData::getBoundaryLayerHeight).min().orElse(220);
        double maxPM25 = timeline.stream().mapToDouble(CoupledForecastData::getPm25).max().orElse(280);
        double avgInversion = timeline.stream().mapToDouble(CoupledForecastData::getInversionStrength).average().orElse(65.0);

        Map<String, Object> response = new HashMap<>();
        response.put("station", station);
        response.put("peakForecastedAqi", (int) maxAQI);
        response.put("lowestPblHeightMeters", minPBL);
        response.put("peakPM25Concentration", maxPM25);
        response.put("averageInversionIndex", Math.round(avgInversion * 10.0) / 10.0);
        response.put("inversionAlert", minPBL < 280 ? "Severe Inversion Layer Active (PBL < 280m)" : "Moderate Dispersion");
        response.put("activeGrapTrigger", maxAQI > 450 ? "GRAP Stage IV" : maxAQI > 400 ? "GRAP Stage III" : "GRAP Stage II");
        response.put("timeline", timeline);

        return ResponseEntity.ok(response);
    }

    /**
     * List all supported Delhi-NCR monitoring stations.
     */
    @GetMapping("/stations")
    public ResponseEntity<List<String>> getStations() {
        return ResponseEntity.ok(coupledForecastService.getAvailableStations());
    }

    /**
     * Get active NASA FIRMS stubble fires and plume dispersion telemetry.
     */
    @GetMapping("/stubble-plumes")
    public ResponseEntity<Map<String, Object>> getStubblePlumes(
            @RequestParam(defaultValue = "12.0") double windSpeed,
            @RequestParam(defaultValue = "315.0") double windDir) {

        return ResponseEntity.ok(stubbleFireService.getStubblePlumeAnalysis(windSpeed, windDir));
    }

    /**
     * Run What-If Policy Simulation for CPCB / Municipal Admin.
     */
    @PostMapping("/simulate-policy")
    public ResponseEntity<PolicySimulationResult> simulatePolicy(
            @RequestBody PolicySimulationRequest request) {

        return ResponseEntity.ok(coupledForecastService.simulatePolicy(request));
    }

    /**
     * Atmospheric Inversion & Planetary Boundary Layer (PBL) Deep Dive.
     */
    @GetMapping("/inversion-analysis")
    public ResponseEntity<Map<String, Object>> getInversionAnalysis(
            @RequestParam(defaultValue = "Anand Vihar, Delhi") String station) {

        List<CoupledForecastData> timeline = coupledForecastService.get72HourCoupledForecast(station);
        CoupledForecastData currentPoint = timeline.isEmpty() ? new CoupledForecastData() : timeline.get(0);

        Map<String, Object> response = new HashMap<>();
        response.put("station", station);
        response.put("currentPblHeightMeters", currentPoint.getBoundaryLayerHeight());
        response.put("inversionStrengthPercent", currentPoint.getInversionStrength());
        response.put("inversionSeverity", currentPoint.getInversionSeverity());
        response.put("aerosolFeedbackMultiplier", currentPoint.getAerosolOpticalFeedback());
        response.put("trappedPollutantPenaltyUgM3", currentPoint.getTrappingPenalty());
        response.put("explanation", "When night-time radiative cooling lowers ground temperatures below upper air layers, the Planetary Boundary Layer compresses. High aerosol density (PM2.5) scatters incoming solar radiation, delaying morning thermal expansion and trapping surface toxicity.");

        return ResponseEntity.ok(response);
    }
}
