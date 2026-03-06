package com.ems.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeCreateRequest {

    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;
    
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    
    private Long departmentId;
    private Long designationId;
    private Long managerId; // Can be null
    
    private LocalDate joiningDate;
    private String employmentType;
    
    private String profilePhotoUrl;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String workLocation;
    // Government Details
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar must be exactly 12 digits")
    private String aadhaar;

    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN format")
    private String pan;

    // Account Information
    private String username;
    private String password;
    
    @NotEmpty(message = "Role is required")
    private String role;
}
