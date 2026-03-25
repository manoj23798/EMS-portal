package com.ems.service.impl;

import com.ems.dto.request.LoginRequest;
import com.ems.dto.response.LoginResponse;
import com.ems.entity.User;
import com.ems.repository.UserRepository;
import com.ems.security.JwtUtil;
import com.ems.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        // Authenticate via Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Generate Tokens
        String jwt = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole().getRoleName());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

        return LoginResponse.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .build();
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        // Validate Refresh Token
        String username = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
                
        // In a real app we'd also verify the refresh token hasn't expired, is active in the DB, etc.

        String newJwt = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole().getRoleName());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getUsername());

        return LoginResponse.builder()
                .token(newJwt)
                .refreshToken(newRefreshToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .build();
    }

    @Override
    public LoginResponse getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return LoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .build();
    }
}
