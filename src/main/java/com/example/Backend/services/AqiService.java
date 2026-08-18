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

    private static final Logger logger =
            LoggerFactory.getLogger(AqiService.class);

    private final AqiDataRepository aqiDataRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final String waqiApiToken;
    private final String waqiBaseUrl;

    public AqiService(
            AqiDataRepository aqiDataRepository,
            @Value("${aqi.waqi.token:}") String waqiApiToken,
            @Value("${aqi.waqi.base-url:https://api.waqi.info}") String waqiBaseUrl
    ) {

        this.aqiDataRepository = aqiDataRepository;

        SimpleClientHttpRequestFactory requestFactory =
                new SimpleClientHttpRequestFactory();

        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(10000);

        this.restTemplate = new RestTemplate(requestFactory);
        this.objectMapper = new ObjectMapper();

        this.waqiApiToken = waqiApiToken;
        this.waqiBaseUrl = waqiBaseUrl;

        logger.info("========================================");
        logger.info("AQI Service initialized");
        logger.info(
                "WAQI token configured: {}",
                waqiApiToken != null && !waqiApiToken.isBlank()
        );
        logger.info("WAQI base URL: {}", waqiBaseUrl);
        logger.info("========================================");
    }

    /**
     * Get live AQI for the user's current location.
     *
     * The frontend supplies the user's latitude/longitude.
     * WAQI returns the nearest available monitoring station.
     */
    public AqiData getAqiForLocation(double lat, double lng) {

        logger.info(
                "========================================"
        );

        logger.info(
                "LIVE LOCATION AQI REQUEST: {}, {}",
                lat,
                lng
        );

        if (!isValidCoordinate(lat, lng)) {
            throw new IllegalArgumentException(
                    "Invalid latitude or longitude"
            );
        }

        AqiData apiData =
                fetchAqiFromWaqiByCoordinates(lat, lng);

        if (apiData != null) {

            /*
             * IMPORTANT:
             *
             * The coordinates supplied by the user represent
             * the user's location.
             *
             * WAQI's coordinates represent the monitoring station.
             *
             * For the application we keep the station coordinates
             * returned by WAQI because that is where the measurement
             * actually comes from.
             */

            try {

                aqiDataRepository.save(apiData);

                logger.info(
                        "Live location AQI saved to MongoDB"
                );

            } catch (Exception e) {

                logger.warn(
                        "Could not save location AQI: {}",
                        e.getMessage()
                );
            }

            logger.info(
                    "SUCCESS: Station={} AQI={}",
                    apiData.getLocationName(),
                    apiData.getAqi()
            );

            return apiData;
        }

        throw new RuntimeException(
                "Could not retrieve AQI for your current location"
        );
    }

    /**
     * Get live AQI for a city.
     */
    public AqiData getAqiByCity(String city) {

        logger.info("========================================");
        logger.info("AQI REQUEST FOR CITY: {}", city);

        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException(
                    "City cannot be empty"
            );
        }

        /*
         * 1. Try live WAQI data first.
         */
        AqiData apiData =
                fetchAqiFromWaqiByCity(city);

        if (apiData != null) {

            /*
             * Make sure the city requested by the user
             * remains the city in our application.
             */
            apiData.setCity(city);

            logger.info(
                    "SUCCESS: Live WAQI data received for {}",
                    city
            );

            try {

                aqiDataRepository.save(apiData);

                logger.info(
                        "Live AQI data saved to MongoDB for {}",
                        city
                );

            } catch (Exception e) {

                logger.warn(
                        "Could not save live AQI data to MongoDB: {}",
                        e.getMessage()
                );
            }

            return apiData;
        }

        /*
         * 2. WAQI failed -> MongoDB fallback.
         */
        logger.warn(
                "WAQI failed for {}. Checking MongoDB...",
                city
        );

        Optional<AqiData> databaseData =
                aqiDataRepository.findByCityIgnoreCase(city);

        if (databaseData.isPresent()) {

            logger.warn(
                    "Returning cached MongoDB data for {}",
                    city
            );

            return databaseData.get();
        }

        /*
         * 3. Nothing available.
         */
        logger.error(
                "No AQI data available for city {}",
                city
        );

        throw new RuntimeException(
                "Unable to fetch AQI data for city: " + city
        );
    }

    /**
     * Get all stored AQI records.
     */
    public List<AqiData> getAllAqiRecords() {
        return aqiDataRepository.findAll();
    }

    /**
     * Kept for compatibility with older frontend code.
     */
    public AqiData calculateAqiFromCoordinates(
            double lat,
            double lng
    ) {

        return getAqiForLocation(lat, lng);
    }

    /**
     * Fetch AQI from WAQI using city name.
     */
    private AqiData fetchAqiFromWaqiByCity(String city) {

        if (waqiApiToken == null || waqiApiToken.isBlank()) {

            logger.error(
                    "WAQI TOKEN IS NOT CONFIGURED!"
            );

            return null;
        }

        String encodedCity =
                URLEncoder.encode(
                        city,
                        StandardCharsets.UTF_8
                );

        /*
         * IMPORTANT:
         *
         * Previously this was hardcoded to:
         *
         * /feed/here/
         *
         * That meant every city search actually returned
         * the same location.
         *
         * Now the requested city is actually used.
         */
        String url = String.format(
                "%s/feed/%s/?token=%s",
                waqiBaseUrl,
                encodedCity,
                waqiApiToken
        );

        logger.info(
                "Calling WAQI city API: {}",
                city
        );

        return fetchWaqiData(url);
    }

    /**
     * Fetch AQI from WAQI using coordinates.
     *
     * WAQI returns the nearest monitoring station.
     */
    private AqiData fetchAqiFromWaqiByCoordinates(
            double lat,
            double lng
    ) {

        if (waqiApiToken == null || waqiApiToken.isBlank()) {

            logger.error(
                    "WAQI TOKEN IS NOT CONFIGURED!"
            );

            return null;
        }

        String url = String.format(
                "%s/feed/geo:%s;%s/?token=%s",
                waqiBaseUrl,
                lat,
                lng,
                waqiApiToken
        );

        logger.info(
                "Calling WAQI location endpoint: geo:{},{}",
                lat,
                lng
        );

        return fetchWaqiData(url);
    }

    /**
     * Execute HTTP request and parse WAQI response.
     */
    private AqiData fetchWaqiData(String url) {

        try {

            String response =
                    restTemplate.getForObject(
                            url,
                            String.class
                    );

            if (response == null || response.isBlank()) {

                logger.error(
                        "WAQI returned an empty response"
                );

                return null;
            }

            logger.info(
                    "WAQI response received successfully"
            );

            JsonNode root =
                    objectMapper.readTree(response);

            String status =
                    root.path("status").asText();

            logger.info(
                    "WAQI response status: {}",
                    status
            );

            if (!"ok".equalsIgnoreCase(status)) {

                logger.error(
                        "WAQI API returned non-ok status: {}",
                        status
                );

                return null;
            }

            JsonNode data =
                    root.path("data");

            if (data.isMissingNode() || data.isNull()) {

                logger.error(
                        "WAQI response contains no data"
                );

                return null;
            }

            return mapWaqiToAqiData(data);

        } catch (RestClientException e) {

            logger.error(
                    "HTTP error while calling WAQI: {}",
                    e.getMessage()
            );

            return null;

        } catch (IOException e) {

            logger.error(
                    "Failed to parse WAQI JSON: {}",
                    e.getMessage()
            );

            return null;
        }
    }

    /**
     * Convert WAQI JSON into AqiData.
     *
     * IMPORTANT:
     * city.name from WAQI is treated as the monitoring station.
     */
    private AqiData mapWaqiToAqiData(
            JsonNode data
    ) {

        int aqi =
                data.path("aqi").asInt(-1);

        if (aqi < 0) {

            logger.warn(
                    "WAQI returned invalid AQI value"
            );

            return null;
        }

        /*
         * -------------------------
         * WAQI station information
         * -------------------------
         */

        JsonNode cityNode =
                data.path("city");

        String stationName =
                cityNode.path("name")
                        .asText("Unknown Monitoring Station");

        /*
         * WAQI sometimes returns:
         *
         * "Station Name, State"
         *
         * so we can extract state when available.
         */
        List<String> locationParts =
                Arrays.stream(
                                stationName.split(",")
                        )
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());

        String state =
                locationParts.size() > 1
                        ? locationParts.get(
                                locationParts.size() - 1
                        )
                        : "Unknown";

        /*
         * For a station response:
         *
         * locationName = monitoring station
         * city         = initially station name
         *
         * getAqiForLocation() will replace city with
         * the user's actual city when appropriate.
         */
        String locationName = stationName;

        String city = stationName;

        String district = stationName;

        /*
         * -------------------------
         * Monitoring station coordinates
         * -------------------------
         */

        double stationLat = 0.0;
        double stationLng = 0.0;

        JsonNode geo =
                cityNode.path("geo");

        if (geo.isArray() && geo.size() >= 2) {

            stationLat =
                    geo.get(0)
                            .asDouble(0.0);

            stationLng =
                    geo.get(1)
                            .asDouble(0.0);
        }

        /*
         * -------------------------
         * Create base object
         * -------------------------
         */

        AqiData aqiData =
                createAqiObject(
                        locationName,
                        state,
                        district,
                        city,
                        stationLat,
                        stationLng,
                        aqi
                );

        /*
         * -------------------------
         * Pollutants
         * -------------------------
         */

        JsonNode iaqi =
                data.path("iaqi");

        aqiData.setPm25(
                parsePollutant(
                        iaqi,
                        "pm25",
                        aqiData.getPm25()
                )
        );

        aqiData.setPm10(
                parsePollutant(
                        iaqi,
                        "pm10",
                        aqiData.getPm10()
                )
        );

        aqiData.setNo2(
                parsePollutant(
                        iaqi,
                        "no2",
                        aqiData.getNo2()
                )
        );

        aqiData.setSo2(
                parsePollutant(
                        iaqi,
                        "so2",
                        aqiData.getSo2()
                )
        );

        aqiData.setO3(
                parsePollutant(
                        iaqi,
                        "o3",
                        aqiData.getO3()
                )
        );

        aqiData.setCo(
                parsePollutant(
                        iaqi,
                        "co",
                        aqiData.getCo()
                )
        );

        /*
         * -------------------------
         * Weather
         * -------------------------
         */

        JsonNode weather =
                data.path("weather");

        if (weather.isObject()) {

            if (weather.has("tp")) {

                aqiData.setTemperature(
                        weather.path("tp")
                                .asDouble(
                                        aqiData.getTemperature()
                                )
                );
            }

            if (weather.has("hu")) {

                aqiData.setHumidity(
                        weather.path("hu")
                                .asDouble(
                                        aqiData.getHumidity()
                                )
                );
            }

            if (weather.has("ws")) {

                aqiData.setWindSpeed(
                        weather.path("ws")
                                .asDouble(
                                        aqiData.getWindSpeed()
                                )
                );
            }
        }

        logger.info(
                "WAQI DATA MAPPED: station={}, AQI={}, PM2.5={}, PM10={}",
                locationName,
                aqi,
                aqiData.getPm25(),
                aqiData.getPm10()
        );

        return aqiData;
    }

    /**
     * Read pollutant value from WAQI iaqi object.
     */
    private double parsePollutant(
            JsonNode iaqi,
            String field,
            Double fallback
    ) {

        if (
                iaqi.has(field)
                        && iaqi.path(field).has("v")
        ) {

            return iaqi.path(field)
                    .path("v")
                    .asDouble(
                            fallback != null
                                    ? fallback
                                    : 0.0
                    );
        }

        return fallback != null
                ? fallback
                : 0.0;
    }

    /**
     * Create AqiData object and calculate derived fields.
     */
    public AqiData createAqiObject(
            String locationName,
            String state,
            String district,
            String city,
            double lat,
            double lng,
            int aqi
    ) {

        AqiData data = new AqiData();

        data.setLocationName(locationName);
        data.setState(state);
        data.setDistrict(district);
        data.setCity(city);

        data.setLatitude(lat);
        data.setLongitude(lng);

        data.setAqi(aqi);

        /*
         * Score
         */
        double score =
                Math.max(
                        0.0,
                        Math.min(
                                100.0,
                                100.0 - (aqi / 5.0)
                        )
                );

        data.setScorePercentage(
                Math.round(score * 10.0) / 10.0
        );

        /*
         * AQI status
         */
        if (aqi <= 50) {

            data.setStatus("Good");
            data.setIsHazardous(false);

            data.setHealthAdvice(
                    "Air quality is satisfactory and poses little to no risk."
            );

        } else if (aqi <= 100) {

            data.setStatus("Moderate");
            data.setIsHazardous(false);

            data.setHealthAdvice(
                    "Air quality is acceptable. " +
                    "Unusually sensitive individuals should " +
                    "limit outdoor exertion."
            );

        } else if (aqi <= 150) {

            data.setStatus(
                    "Unhealthy for Sensitive Groups"
            );

            data.setIsHazardous(true);

            data.setHealthAdvice(
                    "Members of sensitive groups may experience " +
                    "health effects."
            );

        } else if (aqi <= 200) {

            data.setStatus("Unhealthy");
            data.setIsHazardous(true);

            data.setHealthAdvice(
                    "Everyone may begin to experience health effects."
            );

        } else if (aqi <= 300) {

            data.setStatus("Very Unhealthy");
            data.setIsHazardous(true);

            data.setHealthAdvice(
                    "Health alert: risk of serious health effects."
            );

        } else {

            data.setStatus("Hazardous");
            data.setIsHazardous(true);

            data.setHealthAdvice(
                    "Emergency conditions. Avoid outdoor exposure."
            );
        }

        /*
         * Default pollutant values.
         *
         * WAQI values overwrite these when available.
         */
        data.setPm25(
                Math.round((aqi * 0.45) * 10.0) / 10.0
        );

        data.setPm10(
                Math.round((aqi * 0.75) * 10.0) / 10.0
        );

        data.setNo2(
                Math.round(
                        (20 + (aqi * 0.15)) * 10.0
                ) / 10.0
        );

        data.setSo2(
                Math.round(
                        (10 + (aqi * 0.08)) * 10.0
                ) / 10.0
        );

        data.setO3(
                Math.round(
                        (15 + (aqi * 0.12)) * 10.0
                ) / 10.0
        );

        data.setCo(
                Math.round(
                        (1.0 + (aqi * 0.02)) * 10.0
                ) / 10.0
        );

        data.setTemperature(28.5);
        data.setHumidity(65.0);
        data.setWindSpeed(8.4);
        data.setUvIndex(6);

        return data;
    }

    /**
     * Validate geographic coordinates.
     */
    private boolean isValidCoordinate(
            double lat,
            double lng
    ) {

        return lat >= -90.0
                && lat <= 90.0
                && lng >= -180.0
                && lng <= 180.0;
    }
}