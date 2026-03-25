package com.ems.controller;

import com.ems.dto.response.HandbookPolicyResponse;
import com.ems.service.HandbookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/handbook")
@RequiredArgsConstructor
public class HandbookController {

    private final HandbookService handbookService;

    @GetMapping
    public ResponseEntity<List<HandbookPolicyResponse>> getAllPolicies() {
        // Only return ACTIVE policies for general employees
        List<HandbookPolicyResponse> activePolicies = handbookService.getAllPolicies().stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .toList();
        return ResponseEntity.ok(activePolicies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HandbookPolicyResponse> getPolicyById(@PathVariable Long id) {
        HandbookPolicyResponse policy = handbookService.getPolicyById(id);
        if (!"ACTIVE".equals(policy.getStatus())) {
             throw new RuntimeException("Policy is archived and unavailable");
        }
        return ResponseEntity.ok(policy);
    }
}
