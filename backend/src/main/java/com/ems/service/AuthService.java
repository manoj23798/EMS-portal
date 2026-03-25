package com.ems.service;

import com.ems.dto.request.LoginRequest;
import com.ems.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest loginRequest);
    LoginResponse refreshToken(String refreshToken);
    LoginResponse getMe(String username);
}
