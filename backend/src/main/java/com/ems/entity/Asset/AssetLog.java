package com.ems.entity.Asset;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_scope", length = 150)
    private String tableScope;

    @Column(length = 50)
    private String action; // CREATED, MODIFIED, DELETED

    @Column(name = "record_name", length = 255)
    private String recordName;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "record_id")
    private Long recordId;

    @Column(name = "changes_json", columnDefinition = "TEXT")
    private String changesJson;

    @Column(name = "performed_by", length = 255)
    private String performedBy;

    @CreationTimestamp
    private LocalDateTime timestamp;
}
