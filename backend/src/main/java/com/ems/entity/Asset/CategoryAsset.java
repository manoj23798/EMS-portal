package com.ems.entity.Asset;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "category_assets")
@Data
@NoArgsConstructor
public class CategoryAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_class", length = 100)
    private String assetClass;

    @Column(name = "product_name", length = 150)
    private String productName;

    @Column(name = "asset_code", nullable = false, unique = true, length = 100)
    private String assetCode;

    @Column(length = 150)
    private String location;

    @Column(length = 150)
    private String department;

    @Column(length = 150)
    private String responsibility;

    @Column(length = 100)
    private String make;

    @Column(length = 150)
    private String model;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 30)
    private String status;

    @Column(name = "last_maintenance", length = 50)
    private String lastMaintenance;

    @Column(name = "additional_support", columnDefinition = "TEXT")
    private String additionalSupport;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}