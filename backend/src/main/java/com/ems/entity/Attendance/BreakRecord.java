package com.ems.entity.Attendance;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Table(name = "breaks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BreakRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id", nullable = false)
    private Attendance attendance;

    @Column(name = "break_start", nullable = false)
    private LocalTime breakStart;

    @Column(name = "break_end")
    private LocalTime breakEnd;

    @Column(name = "duration")
    private Long duration; // Duration in minutes

    @Enumerated(EnumType.STRING)
    @Column(name = "break_type", nullable = true)
    private BreakType breakType; // LUNCH, TEA, or null for backward compatibility

    public enum BreakType {
        LUNCH("Lunch"),
        TEA("Tea");

        private final String displayName;

        BreakType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
