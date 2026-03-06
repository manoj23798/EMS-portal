package com.ems.service;

import com.ems.dto.response.AttendanceResponse;
import com.ems.entity.Attendance;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    
    // Employee endpoints
    AttendanceResponse timerIn(Long employeeId);
    AttendanceResponse timerOut(Long employeeId);
    AttendanceResponse startBreak(Long employeeId);
    AttendanceResponse endBreak(Long employeeId);
    AttendanceResponse getTodayAttendance(Long employeeId);
    List<AttendanceResponse> getMyAttendanceHistory(Long employeeId, LocalDate startDate, LocalDate endDate);
    
    // Admin endpoints
    List<AttendanceResponse> getAllAttendance(LocalDate date);
    List<AttendanceResponse> getAttendanceHistoryByDateRange(LocalDate startDate, LocalDate endDate);
    
    // Excel Export
    ByteArrayInputStream exportAttendanceToExcel(LocalDate startDate, LocalDate endDate);
}
