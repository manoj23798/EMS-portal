package com.ems.controller;

import com.ems.dto.request.LoginRequest;
import com.ems.dto.response.LoginResponse;
import com.ems.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody String refreshToken) {
        // Note: For simplicity we expect the raw token string in the body.
        // In prod, this might be a JSON object or an HttpOnly cookie.
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> getMe(Authentication authentication) {
        return ResponseEntity.ok(authService.getMe(authentication.getName()));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // Client side will discard the token. 
        // A robust backend might blacklist the token or clear a persistent session.
        return ResponseEntity.ok("Logged out successfully");
    }
}
