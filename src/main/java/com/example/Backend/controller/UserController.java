package com.example.Backend.controller;

import com.example.Backend.model.User;
import com.example.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{email}")
    public ResponseEntity<User> updateUser(@PathVariable String email,
                                           @RequestBody User updatedUser) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = existing.get();
        // update fields (simplified: whole replacement)
        updatedUser.setId(user.getId());
        User saved = userRepository.save(updatedUser);
        return ResponseEntity.ok(saved);
    }
}