package com.ems.entity.Employee;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employment_history")
@Data
public class EmploymentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "role", nullable = false, length = 100)
    private String role;

    @Column(name = "start_date")
    private String startDate; // Changed to String for simplicity in frontend mapping

    @Column(name = "end_date")
    private String endDate; // Changed to String for simplicity in frontend mapping

    @Column(name = "ctc", length = 50)
    private String ctc;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "reason_for_leaving", columnDefinition = "TEXT")
    private String reasonForLeaving;

    // Document URLs for this specific employment
    @Column(name = "offer_letter_url", length = 255)
    private String offerLetterUrl;

    @Column(name = "relieving_letter_url", length = 255)
    private String relievingLetterUrl;

    @Column(name = "experience_letter_url", length = 255)
    private String experienceLetterUrl;

    @Column(name = "payslips_url", length = 255)
    private String payslipsUrl;

    @Column(name = "hike_letters_url", length = 255)
    private String hikeLettersUrl;

    @Column(name = "form16_url", length = 255)
    private String form16Url;

    @Column(name = "bank_statement_url", length = 255)
    private String bankStatementUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
