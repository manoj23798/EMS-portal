package com.ems.controller;

import com.ems.dto.response.AttendanceResponse;
import com.ems.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ===================== EMPLOYEE ENDPOINTS =====================

    @PostMapping("/attendance/timer-in")
    public ResponseEntity<AttendanceResponse> timerIn(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(attendanceService.timerIn(employeeId));
    }

    @PostMapping("/attendance/timer-out")
    public ResponseEntity<AttendanceResponse> timerOut(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(attendanceService.timerOut(employeeId));
    }

    @PostMapping("/attendance/start-break")
    public ResponseEntity<AttendanceResponse> startBreak(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(attendanceService.startBreak(employeeId));
    }

    @PostMapping("/attendance/end-break")
    public ResponseEntity<AttendanceResponse> endBreak(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(attendanceService.endBreak(employeeId));
    }

    @GetMapping("/attendance/my-attendance")
    public ResponseEntity<AttendanceResponse> getTodayAttendance(@RequestParam("employeeId") Long employeeId) {
        AttendanceResponse response = attendanceService.getTodayAttendance(employeeId);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attendance/history")
    public ResponseEntity<List<AttendanceResponse>> getMyHistory(
            @RequestParam("employeeId") Long employeeId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getMyAttendanceHistory(employeeId, startDate, endDate));
    }

    // ===================== ADMIN ENDPOINTS =====================

    @GetMapping("/admin/attendance")
    public ResponseEntity<List<AttendanceResponse>> getAllAttendance(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAllAttendance(date));
    }

    @GetMapping("/admin/attendance/history")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceHistory(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getAttendanceHistoryByDateRange(startDate, endDate));
    }

    @GetMapping("/admin/attendance/export")
    public ResponseEntity<InputStreamResource> exportAttendance(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        ByteArrayInputStream stream = attendanceService.exportAttendanceToExcel(startDate, endDate);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=attendance_report.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(stream));
    }
}
