package com.ems.entity.leave_And_permission;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private HolidayType type = HolidayType.GOVERNMENT; // Default to GOVERNMENT

    private String color = "#ef4444"; // Default to government red

    public enum HolidayType {
        GOVERNMENT,
        COMPANY
    }
}
