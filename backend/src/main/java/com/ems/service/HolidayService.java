package com.ems.service;

import com.ems.entity.Holiday;
import java.util.List;
import java.time.LocalDate;

public interface HolidayService {
    List<Holiday> getAllHolidays();
    List<Holiday> getHolidaysBetween(LocalDate start, LocalDate end);
    Holiday createHoliday(Holiday holiday);
    void deleteHoliday(Long id);
}
