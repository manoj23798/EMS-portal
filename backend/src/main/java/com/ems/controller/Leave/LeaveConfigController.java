package com.ems.controller.Leave;

import com.ems.entity.leave_And_permission.Holiday;
import com.ems.entity.leave_And_permission.LeaveType;
import com.ems.service.Interface.HolidayService;
import com.ems.service.Interface.LeaveTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leave-config")
@RequiredArgsConstructor
public class LeaveConfigController {

    private final LeaveTypeService leaveTypeService;
    private final HolidayService holidayService;

    // Leave Type Management
    @GetMapping("/types")
    public List<LeaveType> getAllTypes() {
        try {
            return leaveTypeService.getAllLeaveTypes();
        } catch (RuntimeException ex) {
            LeaveType planned = new LeaveType();
            planned.setId(1L);
            planned.setName("Planned Leave");
            planned.setPaid(true);
            planned.setColor("#2563eb");

            LeaveType unplanned = new LeaveType();
            unplanned.setId(2L);
            unplanned.setName("Unplanned Leave");
            unplanned.setPaid(true);
            unplanned.setColor("#ea580c");

            return List.of(planned, unplanned);
        }
    }

    @PostMapping("/types")
    public LeaveType createType(@RequestBody LeaveType leaveType) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Policy engine is disabled. Leave policy is managed by default company rules.");
    }

    @PutMapping("/types/{id}")
    public LeaveType updateType(@PathVariable Long id, @RequestBody LeaveType leaveType) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Policy engine is disabled. Leave policy is managed by default company rules.");
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<?> deleteType(@PathVariable Long id) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Policy engine is disabled. Leave policy is managed by default company rules.");
    }

    // Holiday Management
    @GetMapping("/holidays")
    public List<Holiday> getAllHolidays(@RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        if (start != null && end != null) {
            return holidayService.getHolidaysBetween(LocalDate.parse(start), LocalDate.parse(end));
        }
        return holidayService.getAllHolidays();
    }

    @PostMapping("/holidays")
    public Holiday createHoliday(@RequestBody Holiday holiday) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Holiday management is temporarily disabled.");
    }

    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<?> deleteHoliday(@PathVariable Long id) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Holiday management is temporarily disabled.");
    }
}
