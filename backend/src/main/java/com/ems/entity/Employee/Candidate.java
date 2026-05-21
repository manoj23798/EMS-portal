package com.ems.entity.Employee;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "candidates")
@Data
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "application_date")
    private LocalDate applicationDate;

    @Column(name = "marital_status")
    private String maritalStatus;

    @Column(name = "alternate_no")
    private String alternateNo;

    @Column(name = "current_ctc")
    private String currentCTC;

    @Column(name = "notice_period_mm")
    private String noticePeriodMM;

    @Column(name = "total_exp_yy")
    private String totalExpYY;

    @Column(name = "total_exp_mm")
    private String totalExpMM;

    @Column(name = "applied_earlier")
    private String appliedEarlier = "NO";

    @Column(name = "applied_details", columnDefinition = "TEXT")
    private String appliedDetails;

    @Column(name = "relative_working")
    private String relativeWorking = "NO";

    @Column(name = "relative_name")
    private String relativeName;

    @Column(name = "relative_dept")
    private String relativeDept;

    @Column(name = "relative_division")
    private String relativeDivision;

    @Column(name = "relative_location")
    private String relativeLocation;

    @Column(name = "relative_relation")
    private String relativeRelation;

    private String source;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "job_applied_for")
    private String jobAppliedFor;

    @Column(name = "candidate_photo_url")
    private String candidatePhotoUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> interview;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> workHistory = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> academic = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> bank;
}
