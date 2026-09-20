package com.example.Backend.controller;

import com.example.Backend.dto.AdminTelemetryDto;
import com.example.Backend.services.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Get platform summary stats for the Admin Command Center.
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminTelemetryDto.SummaryStats> getSummaryStats() {
        return ResponseEntity.ok(adminService.getSummaryStats());
    }

    /**
     * Get real-time daily regional risk rankings for all monitored districts.
     */
    @GetMapping("/regional-risks")
    public ResponseEntity<List<AdminTelemetryDto.RegionalRiskItem>> getRegionalRisks() {
        return ResponseEntity.ok(adminService.getRegionalRisks());
    }

    /**
     * Get CPCB CAAQMS Continuous Ambient Air Monitoring Stations (Delhi NCR) telemetry.
     */
    @GetMapping("/stations")
    public ResponseEntity<List<AdminTelemetryDto.CaaqmsStationItem>> getCaaqmsStations() {
        return ResponseEntity.ok(adminService.getCaaqmsStations());
    }

    /**
     * Get complete registry of registered users with calculated local risk exposure.
     */
    @GetMapping("/users")
    public ResponseEntity<List<AdminTelemetryDto.UserHealthRegistryItem>> getUserRegistry() {
        return ResponseEntity.ok(adminService.getUserRegistry());
    }

    /**
     * Broadcast emergency advisory alert to citizens in a target district.
     */
    @PostMapping("/broadcast-alert")
    public ResponseEntity<AdminTelemetryDto.BroadcastAlertResponse> broadcastAlert(
            @RequestBody AdminTelemetryDto.BroadcastAlertRequest request) {
        return ResponseEntity.ok(adminService.broadcastAlert(request));
    }
}
