package com.ems.entity.Asset;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_items")
@Data
@NoArgsConstructor
public class StockItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_name", length = 100)
    private String sectionName;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(name = "specification", length = 200)
    private String specification;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 30)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}