package com.ems.controller;

import com.ems.dto.request.HandbookPolicyRequest;
import com.ems.dto.response.HandbookPolicyResponse;
import com.ems.security.JwtUtil;
import com.ems.service.HandbookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.validation.BindingResult;
import java.util.stream.Collectors;
import java.util.List;

@RestController
@RequestMapping("/api/admin/handbook")
@RequiredArgsConstructor
public class AdminHandbookController {

    private final HandbookService handbookService;
    private final JwtUtil jwtUtil;

    @PostMapping("/policy")
    public ResponseEntity<?> createPolicy(
            @RequestBody @Valid HandbookPolicyRequest request,
            BindingResult result,
            @RequestHeader("Authorization") String token) {
        
        if (result.hasErrors()) {
            String errorMessage = result.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest().body(new ErrorResponse(errorMessage));
        }

        Long hrEmployeeId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(handbookService.createPolicy(request, hrEmployeeId));
    }

    // Helper class for error response
    @lombok.Data
    @lombok.AllArgsConstructor
    static class ErrorResponse {
        private String message;
    }

    @PutMapping("/policy/{id}")
    public ResponseEntity<?> updatePolicy(
            @PathVariable Long id,
            @RequestBody @Valid HandbookPolicyRequest request,
            BindingResult result,
            @RequestHeader("Authorization") String token) {
        
        if (result.hasErrors()) {
            String errorMessage = result.getAllErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest().body(new ErrorResponse(errorMessage));
        }

        Long hrEmployeeId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(handbookService.updatePolicy(id, request, hrEmployeeId));
    }

    @GetMapping
    public ResponseEntity<List<HandbookPolicyResponse>> getAllPolicies() {
        return ResponseEntity.ok(handbookService.getAllPolicies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HandbookPolicyResponse> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(handbookService.getPolicyById(id));
    }

    @DeleteMapping("/policy/{id}")
    public ResponseEntity<Void> archivePolicy(@PathVariable Long id) {
        handbookService.archivePolicy(id);
        return ResponseEntity.ok().build();
    }
}
