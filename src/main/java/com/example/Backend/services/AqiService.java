package com.example.Backend.services;

import com.example.Backend.model.AqiData;
import com.example.Backend.repository.AqiDataRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AqiService {

    private static final Logger logger = LoggerFactory.getLogger(AqiService.class);

    private final AqiDataRepository aqiDataRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String waqiApiToken;

    public AqiService(AqiDataRepository aqiDataRepository,
                      @Value("${aqi.waqi.token:}") String waqiApiToken) {
        this.aqiDataRepository = aqiDataRepository;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(requestFactory);

        this.waqiApiToken = waqiApiToken;
    }

    public AqiData getAqiByCity(String city) {
        Optional<AqiData> opt = aqiDataRepository.findByCityIgnoreCase(city);
        if (opt.isPresent()) {
            return opt.get();
        }

        AqiData apiData = fetchAqiFromWaqiByCity(city);
        if (apiData != null) {
            return apiData;
        }

        return generateMockAqiData(city, "State", 185);
    }

    public List<AqiData> getAllAqiRecords() {
        return aqiDataRepository.findAll();
    }

    public AqiData calculateAqiFromCoordinates(double lat, double lng) {
        AqiData apiData = fetchAqiFromWaqiByCoordinates(lat, lng);
        if (apiData != null) {
            return apiData;
        }

        int simulatedAqi = (int) (80 + (Math.abs(lat * 10 + lng * 5) % 250));
        String locationName = String.format("GPS Zone (%.2f, %.2f)", lat, lng);
        return createAqiObject(locationName, "India", "Regional District", locationName, lat, lng, simulatedAqi);
    }

    private AqiData fetchAqiFromWaqiByCity(String city) {
        if (waqiApiToken == null || waqiApiToken.isBlank()) {
            logger.warn("WAQI token is not configured. Falling back to mock data for city {}.", city);
            return null;
        }

        String encodedCity = URLEncoder.encode(city, StandardCharsets.UTF_8);
        String url = String.format("https://api.waqi.info/feed/%s/?token=%s", encodedCity, waqiApiToken);
        return fetchWaqiData(url);
    }

    private AqiData fetchAqiFromWaqiByCoordinates(double lat, double lng) {
        if (waqiApiToken == null || waqiApiToken.isBlank()) {
            logger.warn("WAQI token is not configured. Falling back to mock data for coordinates {} {}.", lat, lng);
            return null;
        }

        String url = String.format("https://api.waqi.info/feed/geo:%s;%s/?token=%s",
                lat, lng, waqiApiToken);
        return fetchWaqiData(url);
    }

    private AqiData fetchWaqiData(String url) {
        try {
            String response = restTemplate.getForObject(url, String.class);
            if (response == null) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response);
            if (!"ok".equalsIgnoreCase(root.path("status").asText())) {
                logger.warn("WAQI API returned non-ok status for url {}: {}", url, root.path("status").asText());
                return null;
            }

            JsonNode data = root.path("data");
            return mapWaqiToAqiData(data);
        } catch (RestClientException | IOException e) {
            logger.warn("Failed to fetch AQI from WAQI API: {}", e.getMessage());
            return null;
        }
    }

    private AqiData mapWaqiToAqiData(JsonNode data) {
        int aqi = data.path("aqi").asInt(-1);
        if (aqi < 0) {
            return null;
        }

        JsonNode cityNode = data.path("city");
        String rawCity = cityNode.path("name").asText("Unknown Location");
        List<String> cityParts = Arrays.stream(rawCity.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        String city = cityParts.size() > 0 ? cityParts.get(0) : rawCity;
        String state = cityParts.size() > 1 ? cityParts.get(1) : "Unknown";
        String district = city;
        String locationName = rawCity;

        double lat = 0.0;
        double lng = 0.0;
        JsonNode geo = cityNode.path("geo");
        if (geo.isArray() && geo.size() >= 2) {
            lat = geo.get(0).asDouble(0.0);
            lng = geo.get(1).asDouble(0.0);
        }

        AqiData aqiData = createAqiObject(locationName, state, district, city, lat, lng, aqi);

        JsonNode iaqi = data.path("iaqi");
        aqiData.setPm25(parsePollutant(iaqi, "pm25", aqiData.getPm25()));
        aqiData.setPm10(parsePollutant(iaqi, "pm10", aqiData.getPm10()));
        aqiData.setNo2(parsePollutant(iaqi, "no2", aqiData.getNo2()));
        aqiData.setSo2(parsePollutant(iaqi, "so2", aqiData.getSo2()));
        aqiData.setO3(parsePollutant(iaqi, "o3", aqiData.getO3()));
        aqiData.setCo(parsePollutant(iaqi, "co", aqiData.getCo()));

        JsonNode weather = data.path("weather");
        if (weather.isObject()) {
            if (weather.has("tp")) {
                aqiData.setTemperature(weather.path("tp").asDouble(aqiData.getTemperature()));
            }
            if (weather.has("hu")) {
                aqiData.setHumidity(weather.path("hu").asDouble(aqiData.getHumidity()));
            }
            if (weather.has("ws")) {
                aqiData.setWindSpeed(weather.path("ws").asDouble(aqiData.getWindSpeed()));
            }
        }

        return aqiData;
    }

    private double parsePollutant(JsonNode iaqi, String field, Double fallback) {
        if (iaqi.has(field) && iaqi.path(field).has("v")) {
            return iaqi.path(field).path("v").asDouble(fallback != null ? fallback : 0.0);
        }
        return fallback != null ? fallback : 0.0;
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
