package com.ems.service.implementation;

import com.ems.entity.leave_And_permission.Holiday;
import com.ems.repository.Leave_and_permission.HolidayRepository;
import com.ems.service.Interface.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;

    @Override
    public List<Holiday> getAllHolidays() {
        try {
            return holidayRepository.findAll();
        } catch (Exception e) {
            System.err.println("❌ ERROR: Failed to fetch holidays: " + e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    @Override
    public List<Holiday> getHolidaysBetween(LocalDate start, LocalDate end) {
        try {
            return holidayRepository.findByDateBetween(start, end);
        } catch (Exception e) {
            System.err.println("❌ ERROR: Failed to fetch holidays between: " + e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    @Override
    public Holiday createHoliday(Holiday holiday) {
        try {
            return holidayRepository.save(holiday);
        } catch (Exception e) {
            System.err.println("❌ ERROR: Failed to create holiday: " + e.getMessage());
            throw new RuntimeException("Synchronize error: " + e.getMessage());
        }
    }

    @Override
    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
    }
}
