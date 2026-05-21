package com.ems.service.Interface;

import com.ems.dto.response.AssetDashboardResponse;
import com.ems.entity.Asset.*;

import java.util.List;

public interface AssetService {
    AssetDashboardResponse getDashboard();

    List<AssetInventory> getInventory();
    AssetInventory saveInventory(AssetInventory asset);
    AssetInventory updateInventory(Long id, AssetInventory asset);
    void deleteInventory(Long id);

    List<CategoryAsset> getCategoryAssets();
    CategoryAsset saveCategoryAsset(CategoryAsset asset);
    CategoryAsset updateCategoryAsset(Long id, CategoryAsset asset);
    void deleteCategoryAsset(Long id);

    List<StockItem> getStockItems(String sectionName);
    StockItem saveStockItem(StockItem item);
    StockItem updateStockItem(Long id, StockItem item);
    void deleteStockItem(Long id);

    List<MaintenanceSchedule> getSchedules();
    MaintenanceSchedule saveSchedule(MaintenanceSchedule schedule);
    MaintenanceSchedule updateSchedule(Long id, MaintenanceSchedule schedule);
    void deleteSchedule(Long id);

    List<MaintenanceChecklist> getChecklists();
    MaintenanceChecklist saveChecklist(MaintenanceChecklist checklist);
    MaintenanceChecklist updateChecklist(Long id, MaintenanceChecklist checklist);
    void deleteChecklist(Long id);

    DynamicAssetData getDynamicData(String tabId);
    DynamicAssetData saveDynamicData(DynamicAssetData data);

    List<AssetLog> getAllLogs();
    List<AssetLog> getLogsByTable(String tableScope);
    List<AssetLog> getLogsByRecordId(Long recordId);
    AssetLog addLog(AssetLog log);
}