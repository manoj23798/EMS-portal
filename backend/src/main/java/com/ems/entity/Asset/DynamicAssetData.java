package com.ems.entity.Asset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dynamic_asset_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DynamicAssetData {

    @Id
    @Column(name = "tab_id", length = 100)
    private String tabId;

    @Column(name = "tables_json", columnDefinition = "TEXT")
    private String tablesJson;

    @Column(name = "rows_json", columnDefinition = "TEXT")
    private String rowsJson;
}
