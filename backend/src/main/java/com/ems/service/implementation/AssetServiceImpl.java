package com.ems.service.implementation;

import com.ems.dto.response.AssetDashboardResponse;
import com.ems.entity.Asset.*;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.Asset.*;
import com.ems.service.Interface.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private final AssetInventoryRepository inventoryRepository;
    private final CategoryAssetRepository categoryAssetRepository;
    private final StockItemRepository stockItemRepository;
    private final MaintenanceScheduleRepository scheduleRepository;
    private final MaintenanceChecklistRepository checklistRepository;
    private final DynamicAssetDataRepository dynamicDataRepository;
    private final AssetLogRepository assetLogRepository;

    @Override
    public AssetDashboardResponse getDashboard() {
        List<AssetInventory> inventory = inventoryRepository.findAll();
        List<CategoryAsset> categoryAssets = categoryAssetRepository.findAll();
        List<StockItem> stockItems = stockItemRepository.findAll();
        List<MaintenanceSchedule> schedules = scheduleRepository.findAll();
        List<MaintenanceChecklist> checklists = checklistRepository.findAll();

        long inUse = inventory.stream().filter(a -> "In Use".equalsIgnoreCase(a.getStatus())).count();
        long available = inventory.stream().filter(a -> "Available".equalsIgnoreCase(a.getStatus())).count();
        long repair = inventory.stream().filter(a -> "Repair".equalsIgnoreCase(a.getStatus())).count();
        long lowStock = stockItems.stream().filter(s -> s.getQuantity() != null && s.getQuantity() <= 2).count();

        Map<String, List<Object>> groupedStock = stockItems.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getSectionName() == null || item.getSectionName().isBlank() ? "Uncategorized"
                                : item.getSectionName(),
                        LinkedHashMap::new,
                        Collectors.mapping(item -> (Object) item, Collectors.toList())));

        return AssetDashboardResponse.builder()
                .totalInventoryAssets(inventory.size())
                .inUseAssets(inUse)
                .availableAssets(available)
                .repairAssets(repair)
                .totalCategoryAssets(categoryAssets.size())
                .totalStockItems(stockItems.size())
                .lowStockCount(lowStock)
                .totalSchedules(schedules.size())
                .totalChecklists(checklists.size())
                .inventory(new ArrayList<>(inventory))
                .categoryAssets(new ArrayList<>(categoryAssets))
                .stockGroups(groupedStock)
                .serviceSchedules(new ArrayList<>(schedules))
                .checklists(new ArrayList<>(checklists))
                .build();
    }

    @Override
    public List<AssetInventory> getInventory() {
        return inventoryRepository.findAll();
    }

    @Override
    @Transactional
    public AssetInventory saveInventory(AssetInventory asset) {
        return inventoryRepository.save(asset);
    }

    @Override
    @Transactional
    public AssetInventory updateInventory(Long id, AssetInventory asset) {
        AssetInventory existing = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset inventory record not found"));
        asset.setId(existing.getId());
        return inventoryRepository.save(asset);
    }

    @Override
    @Transactional
    public void deleteInventory(Long id) {
        inventoryRepository.deleteById(id);
    }

    @Override
    public List<CategoryAsset> getCategoryAssets() {
        return categoryAssetRepository.findAll();
    }

    @Override
    @Transactional
    public CategoryAsset saveCategoryAsset(CategoryAsset asset) {
        return categoryAssetRepository.save(asset);
    }

    @Override
    @Transactional
    public CategoryAsset updateCategoryAsset(Long id, CategoryAsset asset) {
        CategoryAsset existing = categoryAssetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category asset not found"));
        asset.setId(existing.getId());
        return categoryAssetRepository.save(asset);
    }

    @Override
    @Transactional
    public void deleteCategoryAsset(Long id) {
        categoryAssetRepository.deleteById(id);
    }

    @Override
    public List<StockItem> getStockItems(String sectionName) {
        if (sectionName == null || sectionName.isBlank()) {
            return stockItemRepository.findAll();
        }
        return stockItemRepository.findBySectionNameIgnoreCase(sectionName);
    }

    @Override
    @Transactional
    public StockItem saveStockItem(StockItem item) {
        return stockItemRepository.save(item);
    }

    @Override
    @Transactional
    public StockItem updateStockItem(Long id, StockItem item) {
        StockItem existing = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));
        item.setId(existing.getId());
        return stockItemRepository.save(item);
    }

    @Override
    @Transactional
    public void deleteStockItem(Long id) {
        stockItemRepository.deleteById(id);
    }

    @Override
    public List<MaintenanceSchedule> getSchedules() {
        return scheduleRepository.findAll();
    }

    @Override
    @Transactional
    public MaintenanceSchedule saveSchedule(MaintenanceSchedule schedule) {
        if (schedule.getEntries() != null) {
            schedule.getEntries().forEach(entry -> entry.setSchedule(schedule));
        }
        return scheduleRepository.save(schedule);
    }

    @Override
    @Transactional
    public MaintenanceSchedule updateSchedule(Long id, MaintenanceSchedule schedule) {
        MaintenanceSchedule existing = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance schedule not found"));
        schedule.setId(existing.getId());
        if (schedule.getEntries() != null) {
            schedule.getEntries().forEach(entry -> entry.setSchedule(schedule));
        }
        return scheduleRepository.save(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        scheduleRepository.deleteById(id);
    }

    @Override
    public List<MaintenanceChecklist> getChecklists() {
        return checklistRepository.findAll();
    }

    @Override
    @Transactional
    public MaintenanceChecklist saveChecklist(MaintenanceChecklist checklist) {
        if (checklist.getItems() != null) {
            checklist.getItems().forEach(item -> item.setChecklist(checklist));
        }
        return checklistRepository.save(checklist);
    }

    @Override
    @Transactional
    public MaintenanceChecklist updateChecklist(Long id, MaintenanceChecklist checklist) {
        MaintenanceChecklist existing = checklistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance checklist not found"));
        checklist.setId(existing.getId());
        if (checklist.getItems() != null) {
            checklist.getItems().forEach(item -> item.setChecklist(checklist));
        }
        return checklistRepository.save(checklist);
    }

    @Override
    @Transactional
    public void deleteChecklist(Long id) {
        checklistRepository.deleteById(id);
    }

    @Override
    public DynamicAssetData getDynamicData(String tabId) {
        return dynamicDataRepository.findById(tabId).orElse(null);
    }

    @Override
    @Transactional
    public DynamicAssetData saveDynamicData(DynamicAssetData data) {
        return dynamicDataRepository.save(data);
    }

    @Override
    public List<AssetLog> getAllLogs() {
        return assetLogRepository.findAll();
    }

    @Override
    public List<AssetLog> getLogsByTable(String tableScope) {
        return assetLogRepository.findByTableScopeIgnoreCase(tableScope);
    }

    @Override
    public List<AssetLog> getLogsByRecordId(Long recordId) {
        return assetLogRepository.findByRecordId(recordId);
    }

    @Override
    @Transactional
    public AssetLog addLog(AssetLog log) {
        return assetLogRepository.save(log);
    }
}