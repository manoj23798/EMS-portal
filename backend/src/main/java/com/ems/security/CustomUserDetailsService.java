package com.ems.security;

import com.ems.entity.Employee.User;
import com.ems.repository.Employee.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        if (user.getRole() == null) {
            throw new RuntimeException("User has no assigned role");
        }

        String roleName = user.getRole().getRoleName();
        boolean isPrivileged = "ADMIN".equalsIgnoreCase(roleName) || "HR".equalsIgnoreCase(roleName);

        if (!isPrivileged && !"ACTIVE".equalsIgnoreCase(user.getStatus()) && !"ONBOARDING".equalsIgnoreCase(user.getStatus())) {
            throw new DisabledException("User account is " + (user.getStatus() == null ? "INACTIVE" : user.getStatus()));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().getRoleName()))
        );
    }
}
