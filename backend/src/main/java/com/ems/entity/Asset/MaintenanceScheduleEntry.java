package com.ems.entity.Asset;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "maintenance_schedule_entries")
@Data
@NoArgsConstructor
public class MaintenanceScheduleEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    @JsonIgnore
    private MaintenanceSchedule schedule;

    @Column(nullable = false, length = 10)
    private String year;

    @Column(name = "month_range", nullable = false, length = 50)
    private String monthRange;

    @Column(name = "planned_date", length = 100)
    private String plannedDate;

    @Column(name = "actual_date", length = 50)
    private String actualDate;

    @Column(length = 150)
    private String status;
}