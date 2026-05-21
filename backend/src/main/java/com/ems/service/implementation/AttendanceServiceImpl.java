package com.ems.service.implementation;

import com.ems.dto.response.AttendanceResponse;
import com.ems.entity.Attendance.Attendance;
import com.ems.entity.Attendance.BreakRecord;
import com.ems.entity.Employee.Employee;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.Attendance.AttendanceRepository;
import com.ems.repository.Attendance.BreakRecordRepository;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Leave_and_permission.PermissionRequestRepository;
import com.ems.service.Interface.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final BreakRecordRepository breakRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final PermissionRequestRepository permissionRequestRepository;

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 30);
    private static final long MAX_BREAK_MINUTES = 60L;

    @Override
    @Transactional
    public AttendanceResponse timerIn(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 1. Check if already timed in today
        if (attendanceRepository.findByEmployeeAndDate(employee, today).isPresent()) {
            throw new IllegalStateException("Already Timed In for today.");
        }

        // Mark late if after 9:30 AM
        String status = now.isAfter(LATE_THRESHOLD) ? "Late" : "Present";

        Attendance newAttendance = Attendance.builder()
                .employee(employee)
                .date(today)
                .inTime(now)
                .status(status)
                .breakDuration(0L)
                .totalHours(0L)
                .build();

        Attendance saved = attendanceRepository.save(newAttendance);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AttendanceResponse timerOut(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new IllegalStateException("No active Timer In found for today."));

        if (attendance.getOutTime() != null) {
            throw new IllegalStateException("Already Timed Out for today.");
        }

        // Check if there's an active break
        boolean hasActiveBreak = attendance.getBreaks().stream()
                .anyMatch(b -> b.getBreakEnd() == null);
        if (hasActiveBreak) {
            throw new IllegalStateException("Cannot Timer Out while on an active break. End break first.");
        }

        attendance.setOutTime(now);

        // Calculate total hours in minutes (Out - In) minus break duration
        long totalMinutesPresent = Duration.between(attendance.getInTime(), now).toMinutes();
        long activeWorkingMinutes = totalMinutesPresent
                - (attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0);
        attendance.setTotalHours(Math.max(0, activeWorkingMinutes));

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AttendanceResponse startBreak(Long employeeId, String breakType) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new IllegalStateException("No active Timer In found for today."));

        if (attendance.getOutTime() != null) {
            throw new IllegalStateException("Cannot start break after Timer Out.");
        }

        long totalBreaksSoFar = attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0L;
        if (totalBreaksSoFar >= MAX_BREAK_MINUTES) {
            throw new IllegalStateException("Break limit reached. Only 1 hour break is allowed per day.");
        }

        boolean hasActiveBreak = attendance.getBreaks().stream()
                .anyMatch(b -> b.getBreakEnd() == null);
        if (hasActiveBreak) {
            throw new IllegalStateException("A break is already active.");
        }

        // Parse breakType enum
        BreakRecord.BreakType parsedBreakType = null;
        if (breakType != null && !breakType.isEmpty()) {
            try {
                parsedBreakType = BreakRecord.BreakType.valueOf(breakType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalStateException("Invalid break type: " + breakType);
            }
        }

        BreakRecord newBreak = BreakRecord.builder()
                .attendance(attendance)
                .breakStart(now)
                .breakType(parsedBreakType)
                .build();

        attendance.getBreaks().add(newBreak);
        return mapToResponse(attendanceRepository.save(attendance));
    }

    @Override
    @Transactional
    public AttendanceResponse endBreak(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new IllegalStateException("No active Timer In found for today."));

        BreakRecord activeBreak = attendance.getBreaks().stream()
                .filter(b -> b.getBreakEnd() == null)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No active break found to end."));

        activeBreak.setBreakEnd(now);
        long breakMinutes = Duration.between(activeBreak.getBreakStart(), now).toMinutes();

        // Update overall attendance break duration
        long totalBreaksSoFar = attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0L;
        long remainingAllowedBreak = Math.max(0L, MAX_BREAK_MINUTES - totalBreaksSoFar);
        long countedBreakMinutes = Math.min(breakMinutes, remainingAllowedBreak);

        activeBreak.setDuration(countedBreakMinutes);
        attendance.setBreakDuration(totalBreaksSoFar + countedBreakMinutes);

        return mapToResponse(attendanceRepository.save(attendance));
    }

    @Override
    public AttendanceResponse getTodayAttendance(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        return attendanceRepository.findByEmployeeAndDate(employee, LocalDate.now())
                .map(this::mapToResponse)
                .orElse(null); // Return null if no check-in today
    }

    @Override
    public List<AttendanceResponse> getMyAttendanceHistory(Long employeeId, LocalDate startDate, LocalDate endDate) {
        Employee employee = getEmployeeOrThrow(employeeId);
        if (startDate == null || endDate == null) {
            return attendanceRepository.findByEmployeeOrderByDateDesc(employee).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return attendanceRepository.findByEmployeeAndDateBetweenOrderByDateDesc(employee, startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AttendanceResponse> getAllAttendance(LocalDate date) {
        return attendanceRepository.findByDateOrderByEmployee_FirstName(date).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AttendanceResponse> getAttendanceHistoryByDateRange(LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ByteArrayInputStream exportAttendanceToExcel(LocalDate startDate, LocalDate endDate) {
        List<Attendance> attendances = attendanceRepository.findByDateBetweenOrderByDateDesc(startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance Report");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = { "Employee ID", "Employee Name", "Date", "In Time", "Out Time", "Break Duration (Mins)",
                    "Total Hours (Mins)", "Late Status" };
            for (int col = 0; col < columns.length; col++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
            }

            // Data Rows
            int rowIdx = 1;
            for (Attendance attendance : attendances) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(attendance.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(
                        attendance.getEmployee().getFirstName() + " " + attendance.getEmployee().getLastName());
                row.createCell(2).setCellValue(attendance.getDate().toString());
                row.createCell(3).setCellValue(attendance.getInTime() != null ? attendance.getInTime().toString() : "");
                row.createCell(4)
                        .setCellValue(attendance.getOutTime() != null ? attendance.getOutTime().toString() : "");
                row.createCell(5)
                        .setCellValue(attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0);
                row.createCell(6).setCellValue(attendance.getTotalHours() != null ? attendance.getTotalHours() : 0);
                row.createCell(7).setCellValue(attendance.getStatus() != null ? attendance.getStatus() : "");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());

        } catch (IOException e) {
            throw new RuntimeException("Failed to export attendance data to Excel file: " + e.getMessage());
        }
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + id));
    }

    private AttendanceResponse mapToResponse(Attendance attendance) {
        var approvedPermissions = permissionRequestRepository
                .findByEmployeeAndDateAndStatusOrderByStartTimeAsc(attendance.getEmployee(), attendance.getDate(),
                        "Approved");

        long permissionMinutes = attendance.getPermissionHours() != null
                ? attendance.getPermissionHours()
                : approvedPermissions.stream().mapToLong(p -> p.getTotalHours() != null ? p.getTotalHours() : 0L).sum();

        return AttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getFirstName() + " " + attendance.getEmployee().getLastName())
                .date(attendance.getDate())
                .inTime(attendance.getInTime())
                .outTime(attendance.getOutTime())
                .totalHours(attendance.getTotalHours())
                .breakDuration(attendance.getBreakDuration())
                .permissionHours(permissionMinutes)
                .status(attendance.getStatus())
                .onBreak(attendance.getBreaks().stream().anyMatch(b -> b.getBreakEnd() == null))
                .breaks(attendance.getBreaks().stream()
                        .map(b -> AttendanceResponse.BreakRecordResponse.builder()
                                .id(b.getId())
                                .breakStart(b.getBreakStart())
                                .breakEnd(b.getBreakEnd())
                                .duration(b.getDuration())
                                .breakType(b.getBreakType() != null ? b.getBreakType().name() : null)
                                .build())
                        .collect(Collectors.toList()))
                .permissions(approvedPermissions.stream()
                        .map(p -> AttendanceResponse.PermissionRecordResponse.builder()
                                .id(p.getId())
                                .startTime(p.getStartTime())
                                .endTime(p.getEndTime())
                                .totalHours(p.getTotalHours())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
