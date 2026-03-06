package com.ems.service.impl;

import com.ems.dto.response.AttendanceResponse;
import com.ems.entity.Attendance;
import com.ems.entity.BreakRecord;
import com.ems.entity.Employee;
import com.ems.repository.AttendanceRepository;
import com.ems.repository.BreakRecordRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.service.AttendanceService;
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

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 30);

    @Override
    @Transactional
    public AttendanceResponse timerIn(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 1. Check if already timed in today
        if (attendanceRepository.findByEmployeeAndDate(employee, today).isPresent()) {
            throw new RuntimeException("Already Timed In for today.");
        }

        // 2. Cannot Timer In if previous day Timer Out is missing
        attendanceRepository.findTopByEmployeeAndDateBeforeOrderByDateDesc(employee, today)
            .ifPresent(prevAttendance -> {
                if (prevAttendance.getOutTime() == null) {
                    throw new RuntimeException("Cannot Timer In. Previous attendance record is missing Timer Out.");
                }
            });

        // 3. Mark late if after 9:30 AM
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
                .orElseThrow(() -> new RuntimeException("No active Timer In found for today."));

        if (attendance.getOutTime() != null) {
            throw new RuntimeException("Already Timed Out for today.");
        }

        // Check if there's an active break
        boolean hasActiveBreak = attendance.getBreaks().stream()
                .anyMatch(b -> b.getBreakEnd() == null);
        if (hasActiveBreak) {
            throw new RuntimeException("Cannot Timer Out while on an active break. End break first.");
        }

        attendance.setOutTime(now);

        // Calculate total hours in minutes (Out - In) minus break duration
        long totalMinutesPresent = Duration.between(attendance.getInTime(), now).toMinutes();
        long activeWorkingMinutes = totalMinutesPresent - (attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0);
        attendance.setTotalHours(Math.max(0, activeWorkingMinutes));

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AttendanceResponse startBreak(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new RuntimeException("No active Timer In found for today."));

        if (attendance.getOutTime() != null) {
            throw new RuntimeException("Cannot start break after Timer Out.");
        }

        boolean hasActiveBreak = attendance.getBreaks().stream()
                .anyMatch(b -> b.getBreakEnd() == null);
        if (hasActiveBreak) {
            throw new RuntimeException("A break is already active.");
        }

        BreakRecord newBreak = BreakRecord.builder()
                .attendance(attendance)
                .breakStart(now)
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
                .orElseThrow(() -> new RuntimeException("No active Timer In found for today."));

        BreakRecord activeBreak = attendance.getBreaks().stream()
                .filter(b -> b.getBreakEnd() == null)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active break found to end."));

        activeBreak.setBreakEnd(now);
        long breakMinutes = Duration.between(activeBreak.getBreakStart(), now).toMinutes();
        activeBreak.setDuration(breakMinutes);

        // Update overall attendance break duration
        long totalBreaksSoFar = attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0;
        attendance.setBreakDuration(totalBreaksSoFar + breakMinutes);

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
        if(startDate == null || endDate == null) {
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
            String[] columns = {"Employee ID", "Employee Name", "Date", "In Time", "Out Time", "Break Duration (Mins)", "Total Hours (Mins)", "Late Status"};
            for (int col = 0; col < columns.length; col++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
            }

            // Data Rows
            int rowIdx = 1;
            for (Attendance attendance : attendances) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(attendance.getEmployee().getEmployeeId());
                row.createCell(1).setCellValue(attendance.getEmployee().getFirstName() + " " + attendance.getEmployee().getLastName());
                row.createCell(2).setCellValue(attendance.getDate().toString());
                row.createCell(3).setCellValue(attendance.getInTime() != null ? attendance.getInTime().toString() : "");
                row.createCell(4).setCellValue(attendance.getOutTime() != null ? attendance.getOutTime().toString() : "");
                row.createCell(5).setCellValue(attendance.getBreakDuration() != null ? attendance.getBreakDuration() : 0);
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
                .orElseThrow(() -> new RuntimeException("Employee not found with id " + id));
    }

    private AttendanceResponse mapToResponse(Attendance attendance) {
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getFirstName() + " " + attendance.getEmployee().getLastName())
                .date(attendance.getDate())
                .inTime(attendance.getInTime())
                .outTime(attendance.getOutTime())
                .totalHours(attendance.getTotalHours())
                .breakDuration(attendance.getBreakDuration())
                .status(attendance.getStatus())
                /* 
                 * In a real system, you'd map BreakRecords to DTOs here too.
                 * Omitting for brevity unless requested. 
                 */
                .build();
    }
}
