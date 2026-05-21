package com.ems.service.Interface;

import com.ems.entity.leave_And_permission.Holiday;
import java.util.List;
import java.time.LocalDate;

public interface HolidayService {
    List<Holiday> getAllHolidays();
    List<Holiday> getHolidaysBetween(LocalDate start, LocalDate end);
    Holiday createHoliday(Holiday holiday);
    void deleteHoliday(Long id);
}
