package com.example.Backend.services;

import com.example.Backend.model.AqiData;
import com.example.Backend.repository.AqiDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AqiService {

    @Autowired
    private AqiDataRepository aqiDataRepository;

    public AqiData getAqiByCity(String city) {
        Optional<AqiData> opt = aqiDataRepository.findByCityIgnoreCase(city);
        if (opt.isPresent()) {
            return opt.get();
        }
        return generateMockAqiData(city, "State", 185);
    }

    public List<AqiData> getAllAqiRecords() {
        return aqiDataRepository.findAll();
    }

    public AqiData calculateAqiFromCoordinates(double lat, double lng) {
        int simulatedAqi = (int) (80 + (Math.abs(lat * 10 + lng * 5) % 250));
        String locationName = String.format("GPS Zone (%.2f, %.2f)", lat, lng);
        return createAqiObject(locationName, "India", "Regional District", locationName, lat, lng, simulatedAqi);
    }

    public AqiData createAqiObject(String locationName, String state, String district, String city,
                                   double lat, double lng, int aqi) {
        AqiData data = new AqiData();
        data.setLocationName(locationName);
        data.setState(state);
        data.setDistrict(district);
        data.setCity(city);
        data.setLatitude(lat);
        data.setLongitude(lng);
        data.setAqi(aqi);

        double score = Math.max(0.0, Math.min(100.0, 100.0 - (aqi / 5.0)));
        data.setScorePercentage(Math.round(score * 10.0) / 10.0);

        if (aqi <= 50) {
            data.setStatus("Good");
            data.setIsHazardous(false);
            data.setHealthAdvice("Air quality is satisfactory and poses little to no risk.");
        } else if (aqi <= 100) {
            data.setStatus("Moderate");
            data.setIsHazardous(false);
            data.setHealthAdvice("Air quality is acceptable. Unusually sensitive individuals should limit outdoor exertion.");
        } else if (aqi <= 150) {
            data.setStatus("Unhealthy for Sensitive Groups");
            data.setIsHazardous(true);
            data.setHealthAdvice("Members of sensitive groups (Asthma, Elderly) may experience health effects.");
        } else if (aqi <= 200) {
            data.setStatus("Unhealthy");
            data.setIsHazardous(true);
            data.setHealthAdvice("Everyone may begin to experience health effects. Wear N95 masks outdoors.");
        } else if (aqi <= 300) {
            data.setStatus("Very Unhealthy");
            data.setIsHazardous(true);
            data.setHealthAdvice("Health alert: risk of serious respiratory distress. Use indoor air purifiers.");
        } else {
            data.setStatus("Hazardous");
            data.setIsHazardous(true);
            data.setHealthAdvice("Emergency conditions! High risk of severe airborne disease triggers. Avoid outdoor exposure.");
        }

        data.setPm25(Math.round((aqi * 0.45) * 10.0) / 10.0);
        data.setPm10(Math.round((aqi * 0.75) * 10.0) / 10.0);
        data.setNo2(Math.round((20 + (aqi * 0.15)) * 10.0) / 10.0);
        data.setSo2(Math.round((10 + (aqi * 0.08)) * 10.0) / 10.0);
        data.setO3(Math.round((15 + (aqi * 0.12)) * 10.0) / 10.0);
        data.setCo(Math.round((1.0 + (aqi * 0.02)) * 10.0) / 10.0);

        data.setTemperature(28.5);
        data.setHumidity(65.0);
        data.setWindSpeed(8.4);
        data.setUvIndex(6);

        return data;
    }

    private AqiData generateMockAqiData(String city, String state, int aqi) {
        return createAqiObject(city + " Center", state, city + " District", city, 28.61, 77.20, aqi);
    }
}
