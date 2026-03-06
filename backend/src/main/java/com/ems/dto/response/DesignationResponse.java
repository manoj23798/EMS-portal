package com.ems.dto.response;

import lombok.Data;

@Data
public class DesignationResponse {
    private Long id;
    private String title;
    private Long departmentId;
    private String departmentName;
}
