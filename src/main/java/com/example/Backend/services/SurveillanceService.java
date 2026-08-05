package com.example.Backend.services;

import com.example.Backend.model.SurveillanceStat;
import com.example.Backend.repository.SurveillanceStatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SurveillanceService {

    @Autowired
    private SurveillanceStatRepository surveillanceStatRepository;

    public List<SurveillanceStat> getAllRegionalStats() {
        return surveillanceStatRepository.findAll();
    }

    public Optional<SurveillanceStat> getStatsByCity(String city) {
        return surveillanceStatRepository.findByCityIgnoreCase(city);
    }

    public List<SurveillanceStat> getStatsByState(String state) {
        return surveillanceStatRepository.findByStateIgnoreCase(state);
    }

    public List<SurveillanceStat> getStatsByDistrict(String district) {
        return surveillanceStatRepository.findByDistrictIgnoreCase(district);
    }
}
