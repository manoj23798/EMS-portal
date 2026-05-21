package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AssetDashboardResponse {
    private long totalInventoryAssets;
    private long inUseAssets;
    private long availableAssets;
    private long repairAssets;
    private long totalCategoryAssets;
    private long totalStockItems;
    private long lowStockCount;
    private long totalSchedules;
    private long totalChecklists;

    private List<Object> inventory;
    private List<Object> categoryAssets;
    private Map<String, List<Object>> stockGroups;
    private List<Object> serviceSchedules;
    private List<Object> checklists;
}