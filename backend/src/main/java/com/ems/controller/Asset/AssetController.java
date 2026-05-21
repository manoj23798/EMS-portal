package com.ems.controller.Asset;

import com.ems.dto.response.AssetDashboardResponse;
import com.ems.entity.Asset.*;
import com.ems.service.Interface.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetService assetService;

    @GetMapping("/assets/dashboard")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<AssetDashboardResponse> dashboard() {
        return ResponseEntity.ok(assetService.getDashboard());
    }

    @GetMapping("/assets/inventory")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<AssetInventory>> getInventory() {
        return ResponseEntity.ok(assetService.getInventory());
    }

    @PostMapping("/admin/assets/inventory")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<AssetInventory> createInventory(@RequestBody AssetInventory asset) {
        return ResponseEntity.ok(assetService.saveInventory(asset));
    }

    @PutMapping("/admin/assets/inventory/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<AssetInventory> updateInventory(@PathVariable Long id, @RequestBody AssetInventory asset) {
        return ResponseEntity.ok(assetService.updateInventory(id, asset));
    }

    @DeleteMapping("/admin/assets/inventory/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<Void> deleteInventory(@PathVariable Long id) {
        assetService.deleteInventory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assets/category")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<CategoryAsset>> getCategoryAssets() {
        return ResponseEntity.ok(assetService.getCategoryAssets());
    }

    @PostMapping("/admin/assets/category")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<CategoryAsset> createCategoryAsset(@RequestBody CategoryAsset asset) {
        return ResponseEntity.ok(assetService.saveCategoryAsset(asset));
    }

    @PutMapping("/admin/assets/category/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<CategoryAsset> updateCategoryAsset(@PathVariable Long id, @RequestBody CategoryAsset asset) {
        return ResponseEntity.ok(assetService.updateCategoryAsset(id, asset));
    }

    @DeleteMapping("/admin/assets/category/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<Void> deleteCategoryAsset(@PathVariable Long id) {
        assetService.deleteCategoryAsset(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assets/stock")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<StockItem>> getStockItems(
            @RequestParam(value = "section", required = false) String section) {
        return ResponseEntity.ok(assetService.getStockItems(section));
    }

    @PostMapping("/admin/assets/stock")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<StockItem> createStockItem(@RequestBody StockItem item) {
        return ResponseEntity.ok(assetService.saveStockItem(item));
    }

    @PutMapping("/admin/assets/stock/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<StockItem> updateStockItem(@PathVariable Long id, @RequestBody StockItem item) {
        return ResponseEntity.ok(assetService.updateStockItem(id, item));
    }

    @DeleteMapping("/admin/assets/stock/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<Void> deleteStockItem(@PathVariable Long id) {
        assetService.deleteStockItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assets/maintenance/schedules")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<MaintenanceSchedule>> getSchedules() {
        return ResponseEntity.ok(assetService.getSchedules());
    }

    @PostMapping("/admin/assets/maintenance/schedules")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<MaintenanceSchedule> createSchedule(@RequestBody MaintenanceSchedule schedule) {
        return ResponseEntity.ok(assetService.saveSchedule(schedule));
    }

    @PutMapping("/admin/assets/maintenance/schedules/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<MaintenanceSchedule> updateSchedule(@PathVariable Long id,
            @RequestBody MaintenanceSchedule schedule) {
        return ResponseEntity.ok(assetService.updateSchedule(id, schedule));
    }

    @DeleteMapping("/admin/assets/maintenance/schedules/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        assetService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assets/maintenance/checklists")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<MaintenanceChecklist>> getChecklists() {
        return ResponseEntity.ok(assetService.getChecklists());
    }

    @PostMapping("/admin/assets/maintenance/checklists")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<MaintenanceChecklist> createChecklist(@RequestBody MaintenanceChecklist checklist) {
        return ResponseEntity.ok(assetService.saveChecklist(checklist));
    }

    @PutMapping("/admin/assets/maintenance/checklists/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<MaintenanceChecklist> updateChecklist(@PathVariable Long id,
            @RequestBody MaintenanceChecklist checklist) {
        return ResponseEntity.ok(assetService.updateChecklist(id, checklist));
    }

    @DeleteMapping("/admin/assets/maintenance/checklists/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<Void> deleteChecklist(@PathVariable Long id) {
        assetService.deleteChecklist(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assets/dynamic/{tabId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<DynamicAssetData> getDynamicData(@PathVariable String tabId) {
        return ResponseEntity.ok(assetService.getDynamicData(tabId));
    }

    @PostMapping("/admin/assets/dynamic")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<DynamicAssetData> saveDynamicData(@RequestBody DynamicAssetData data) {
        return ResponseEntity.ok(assetService.saveDynamicData(data));
    }

    @GetMapping("/assets/logs")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<AssetLog>> getAllLogs() {
        return ResponseEntity.ok(assetService.getAllLogs());
    }

    @GetMapping("/assets/logs/table/{table}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<AssetLog>> getLogsByTable(@PathVariable String table) {
        return ResponseEntity.ok(assetService.getLogsByTable(table));
    }

    @GetMapping("/assets/logs/record/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<List<AssetLog>> getLogsByRecordId(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getLogsByRecordId(id));
    }

    @PostMapping("/admin/assets/logs")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<AssetLog> addLog(@RequestBody AssetLog log) {
        return ResponseEntity.ok(assetService.addLog(log));
    }
}