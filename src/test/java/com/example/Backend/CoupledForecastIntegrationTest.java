package com.example.Backend;

import com.example.Backend.dto.PolicySimulationRequest;
import com.example.Backend.dto.PolicySimulationResult;
import com.example.Backend.model.CoupledForecastData;
import com.example.Backend.services.CoupledForecastService;
import com.example.Backend.services.StubbleFireService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class CoupledForecastIntegrationTest {

    private StubbleFireService stubbleFireService;
    private CoupledForecastService coupledForecastService;

    @BeforeEach
    void setUp() {
        stubbleFireService = new StubbleFireService();
        coupledForecastService = new CoupledForecastService(stubbleFireService);
    }

    @Test
    void testStubblePlumeAnalysisAndDriftVector() {
        // Test North-Westerly wind (315°) directly towards Delhi NCR
        Map<String, Object> analysisNW = stubbleFireService.getStubblePlumeAnalysis(14.0, 315.0);
        assertNotNull(analysisNW);
        assertTrue((int) analysisNW.get("activeFireCount") > 0);
        assertTrue((double) analysisNW.get("totalFireRadiativePowerMW") > 0);
        assertTrue((double) analysisNW.get("estimatedDelhiPM25Influx") > 0);

        @SuppressWarnings("unchecked")
        Map<String, Object> driftVectorNW = (Map<String, Object>) analysisNW.get("driftVector");
        assertNotNull(driftVectorNW);
        double alignmentNW = (double) driftVectorNW.get("delhiAlignmentScore");
        // NW wind blowing towards SE (Delhi) should yield high alignment (> 0.8)
        assertTrue(alignmentNW > 0.80, "North-Westerly wind should have high alignment towards Delhi");

        // Test Easterly wind (90°) blowing away from Delhi towards West
        Map<String, Object> analysisEast = stubbleFireService.getStubblePlumeAnalysis(14.0, 90.0);
        @SuppressWarnings("unchecked")
        Map<String, Object> driftVectorEast = (Map<String, Object>) analysisEast.get("driftVector");
        double alignmentEast = (double) driftVectorEast.get("delhiAlignmentScore");
        // East wind should yield zero or near-zero alignment towards Delhi
        assertTrue(alignmentEast < 0.20, "Easterly wind should have near-zero alignment towards Delhi");

        System.out.println("Stubble Fire Test Passed. NW Influx: " + analysisNW.get("estimatedDelhiPM25Influx")
                + " ug/m3 vs East Influx: " + analysisEast.get("estimatedDelhiPM25Influx") + " ug/m3");
    }

    @Test
    void test72HourCoupledForecast() {
        List<CoupledForecastData> timeline = coupledForecastService.get72HourCoupledForecast("Anand Vihar, Delhi");
        assertNotNull(timeline);
        assertEquals(72, timeline.size(), "Forecast timeline must contain 72 hourly points");

        for (CoupledForecastData pt : timeline) {
            assertTrue(pt.getPm25() > 0, "PM2.5 must be positive");
            assertTrue(pt.getPm10() > 0, "PM10 must be positive");
            assertTrue(pt.getBoundaryLayerHeight() > 0, "PBL height must be positive");
            assertTrue(pt.getInversionStrength() >= 0, "Inversion strength must be non-negative");
            assertTrue(pt.getAqi() > 0, "AQI must be positive");
            assertNotNull(pt.getAqiStatus(), "AQI status must not be null");
        }

        System.out.println("72H Forecast Test Passed. First hour AQI: " + timeline.get(0).getAqi()
                + ", PM2.5: " + timeline.get(0).getPm25() + ", PBL: " + timeline.get(0).getBoundaryLayerHeight() + "m");
    }

    @Test
    void testDynamicWhatIfPolicySimulation() {
        PolicySimulationRequest request = PolicySimulationRequest.builder()
                .stationName("Anand Vihar, Delhi")
                .stubbleBurningReductionPercent(60.0)
                .vehicularTrafficCutPercent(50.0)
                .industrialEmissionCutPercent(30.0)
                .applyOddEvenRule(true)
                .applyTruckEntryBan(true)
                .applyConstructionBan(false)
                .build();

        PolicySimulationResult result = coupledForecastService.simulatePolicy(request);
        assertNotNull(result);
        assertTrue(result.getBaselineAvgAqi() > 0);
        assertTrue(result.getSimulatedAvgAqi() > 0);
        assertTrue(result.getSimulatedAvgAqi() < result.getBaselineAvgAqi(), "Simulated AQI must be lower than baseline");
        assertTrue(result.getAqiReductionPercent() > 0, "AQI reduction percent must be positive");
        assertTrue(result.getSimulatedAvgPM25() < result.getBaselineAvgPM25(), "Simulated PM2.5 must be lower than baseline");
        assertTrue(result.getEstimatedHospitalAdmissionsAvoided() > 0);
        assertTrue(result.getAcuteAsthmaAttacksPrevented() > 0);

        assertEquals(72, result.getBaselineTimeline().size());
        assertEquals(72, result.getSimulatedTimeline().size());

        // Verify that simulated PBL height expanded compared to baseline due to reduced aerosol solar suppression
        double basePbl0 = result.getBaselineTimeline().get(0).getBoundaryLayerHeight();
        double simPbl0 = result.getSimulatedTimeline().get(0).getBoundaryLayerHeight();
        assertTrue(simPbl0 >= basePbl0, "Simulated PBL height should expand or equal baseline due to solar feedback");

        System.out.println("Policy Simulation Test Passed: Base AQI " + result.getBaselineAvgAqi()
                + " -> Sim AQI " + result.getSimulatedAvgAqi()
                + " (" + result.getAqiReductionPercent() + "% drop). Avoided hospital admissions: "
                + result.getEstimatedHospitalAdmissionsAvoided());
    }
}
