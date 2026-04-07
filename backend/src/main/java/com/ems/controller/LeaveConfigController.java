package com.ems.controller;

import com.ems.entity.Holiday;
import com.ems.entity.LeaveType;
import com.ems.service.HolidayService;
import com.ems.service.LeaveTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return leaveTypeService.getAllLeaveTypes();
    }

    @PostMapping("/types")
    public LeaveType createType(@RequestBody LeaveType leaveType) {
        return leaveTypeService.createLeaveType(leaveType);
    }

    @PutMapping("/types/{id}")
    public LeaveType updateType(@PathVariable Long id, @RequestBody LeaveType leaveType) {
        return leaveTypeService.updateLeaveType(id, leaveType);
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<?> deleteType(@PathVariable Long id) {
        leaveTypeService.deleteLeaveType(id);
        return ResponseEntity.ok().build();
    }

    // Holiday Management
    @GetMapping("/holidays")
    public List<Holiday> getAllHolidays(@RequestParam(required = false) String start, @RequestParam(required = false) String end) {
        if (start != null && end != null) {
            return holidayService.getHolidaysBetween(LocalDate.parse(start), LocalDate.parse(end));
        }
        return holidayService.getAllHolidays();
    }

    @PostMapping("/holidays")
    public Holiday createHoliday(@RequestBody Holiday holiday) {
        return holidayService.createHoliday(holiday);
    }

    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<?> deleteHoliday(@PathVariable Long id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.ok().build();
    }
}
