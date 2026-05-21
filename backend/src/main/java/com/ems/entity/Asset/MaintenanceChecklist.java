package com.ems.entity.Asset;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "maintenance_checklists")
@Data
@NoArgsConstructor
public class MaintenanceChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_code", length = 100)
    private String assetCode;

    @Column(name = "vendor_name", length = 150)
    private String vendorName;

    @Column(length = 150)
    private String location;

    @Column(name = "conducted_date")
    private LocalDate conductedDate;

    @Column(name = "conducted_time")
    private LocalTime conductedTime;

    @Column(name = "overall_comment", columnDefinition = "TEXT")
    private String overallComment;

    @Column(name = "previous_service_date")
    private LocalDate previousServiceDate;

    @Column(name = "next_service_date")
    private LocalDate nextServiceDate;

    @Column(name = "service_engineer_sign", length = 150)
    private String serviceEngineerSign;

    @Column(name = "office_admin_sign", length = 150)
    private String officeAdminSign;

    @OneToMany(mappedBy = "checklist", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MaintenanceChecklistItemResponse> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addItem(MaintenanceChecklistItemResponse item) {
        items.add(item);
        item.setChecklist(this);
    }
}