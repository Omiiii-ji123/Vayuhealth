package com.example.Backend.services;

import com.example.Backend.model.HealthStat;
import com.example.Backend.repository.HealthStatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HealthStatService {

    @Autowired
    private HealthStatRepository healthStatRepository;

    public List<HealthStat> getStatsByDistrict(String district) {
        return healthStatRepository.findByDistrict(district);
    }

    public List<HealthStat> getAllStats() {
        return healthStatRepository.findAll();
    }
}