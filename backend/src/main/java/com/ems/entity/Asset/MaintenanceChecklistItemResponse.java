package com.ems.entity.Asset;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "maintenance_checklist_items")
@Data
@NoArgsConstructor
public class MaintenanceChecklistItemResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_id", nullable = false)
    @JsonIgnore
    private MaintenanceChecklist checklist;

    @Column(name = "item_text", nullable = false, columnDefinition = "TEXT")
    private String itemText;

    @Column(name = "response_status", length = 20)
    private String responseStatus;
}