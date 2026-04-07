package com.ems.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClaimTableDTO {
    private Long id;
    private String employeeName;
    private String employeeCode;
    private String username;
    private String reasonForTravel;
    private LocalDate submissionDate;
    private Double totalAmount;
    private Double advanceAmount;
    private Double duePayout;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate actionDate;
}
