package com.ems.entity.Asset;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_inventory")
@Data
@NoArgsConstructor
public class AssetInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_code", nullable = false, unique = true, length = 100)
    private String assetCode;

    @Column(name = "computer_name", length = 150)
    private String computerName;

    @Column(name = "user_name", length = 150)
    private String userName;

    @Column(length = 150)
    private String department;

    @Column(name = "email_id", length = 150)
    private String emailId;

    @Column(name = "mobile_number", length = 30)
    private String mobileNumber;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(length = 100)
    private String make;

    @Column(length = 150)
    private String model;

    @Column(length = 200)
    private String cpu;

    @Column(length = 50)
    private String ram;

    @Column(name = "hdd_and_type", length = 120)
    private String hddAndType;

    @Column(length = 100)
    private String os;

    @Column(length = 30)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(length = 50)
    private String maintenance;

    @Column(name = "asset_type", length = 30)
    private String assetType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}