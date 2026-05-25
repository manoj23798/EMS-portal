import React, { useEffect, useMemo, useState } from 'react';
import { tokenManager } from '../../utils/tokenManager';
import {
    assetService,
    checklistItems
} from '../../services/assetService';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Info,
    Check,
    Save,
    X,
    HardDrive,
    Server,
    Boxes,
    Box,
    Laptop,
    Shield,
    Wrench,
    Monitor,
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    History
} from 'lucide-react';

import ServerTab from './tabs/ServerTab';
import ITAssetTab from './tabs/ITAssetTab';
import FixturesTab from './tabs/FixturesTab';
import StockMaintenanceTab from './tabs/StockMaintenanceTab';
import NOCTeamTab from './tabs/NOCTeamTab';
import DynamicTables from './tabs/DynamicTables';
import LogHistoryTable, { addTableLog } from './components/LogHistoryTable';
import RowHistoryPopup from './components/RowHistoryPopup';
import Pagination from './components/Pagination';
import AssetDetailView from './components/AssetDetailView';

const badgeStyles = {
    'In Use': { bg: '#ecfdf5', color: '#ea580c' },
    Available: { bg: '#eff6ff', color: '#f97316' },
    Repair: { bg: '#fef2f2', color: '#dc2626' },
    Working: { bg: '#ecfdf5', color: '#ea580c' },
    'Not Working': { bg: '#fef2f2', color: '#dc2626' },
    Completed: { bg: '#ecfdf5', color: '#ea580c' },
    Pending: { bg: '#fffbeb', color: '#d97706' },
    Issue: { bg: '#fef2f2', color: '#dc2626' },
    'Not Required': { bg: '#f3f4f6', color: '#6b7280' },
    New: { bg: '#ecfdf5', color: '#ea580c' },
    Faulty: { bg: '#fef2f2', color: '#dc2626' },
    Used: { bg: '#f8fafc', color: '#334155' },
    Recheck: { bg: '#fffbeb', color: '#d97706' },
    Scrap: { bg: '#fef2f2', color: '#991b1b' }
};


const sectionTabs = [
    { id: 'maintenance', label: 'AC Maintenance', icon: Wrench },
    { id: 'inventory', label: 'Laptops', icon: Monitor },
    { id: 'server', label: 'Server', icon: Server },
    { id: 'it_asset', label: 'IT Asset', icon: Laptop },
    { id: 'fixtures', label: 'Fixtures', icon: Box },
    { id: 'stock_maintenance', label: 'Stock Maintenance', icon: Boxes },
    { id: 'noc_team', label: 'NOC Team', icon: Shield }
];

function Badge({ value }) {
    const style = badgeStyles[value] || { bg: '#f8fafc', color: '#334155' };
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: style.bg,
            color: style.color,
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: 'nowrap'
        }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.color, display: 'inline-block' }} />
            {value || 'N/A'}
        </span>
    );
}

function TableShell({ children }) {
    return (
        <div style={{ border: '1px solid #dbe3ea', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
            {children}
        </div>
    );
}

function groupStockItems(items) {
    return (items || []).reduce((acc, item) => {
        const key = item.sectionName || 'Uncategorized';
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push({
            ...item,
            type: item.specification || item.type || '',
            assetClass: item.assetClass || key
        });
        return acc;
    }, {});
}

function normalizeSchedule(schedule) {
    return {
        ...schedule,
        rows: (schedule.entries || schedule.rows || []).map((entry) => ({
            id: entry.id,
            year: entry.year,
            monthRange: entry.monthRange,
            plannedDate: entry.plannedDate,
            actualDate: entry.actualDate,
            status: entry.status
        }))
    };
}

export default function AssetManagementDashboard({ isHrView = false }) {
    // Scoped style for vertical borders in Asset module only
    const scopedStyle = (
        <style>{`

            .asset-data-cell {
                display: flex;
                align-items: center;
                padding: 0 12px;
                height: 38px;
                font-size: 13px;
                color: #0f172a;
                font-weight: 500;
                width: 100%;
                box-sizing: border-box;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `}</style>
    );

    const roleFromToken = tokenManager.getUserRole() || '';
    const isHr = roleFromToken === 'HR';
    const isAdmin = roleFromToken === 'ADMIN' || roleFromToken === 'SUPER_ADMIN'; // support super_admin as fallback
    
    const canEdit = isAdmin || (!isHr && !isHrView); 
    const canDoMaintenance = isAdmin; // Only Admin can edit maintenance reports
    const [activeTab, setActiveTab] = useState('maintenance');
    const [assetType, setAssetType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [makeFilter, setMakeFilter] = useState('All');
    const [osFilter, setOsFilter] = useState('All');
    const [ramFilter, setRamFilter] = useState('All');
    const [assetCodeFilter, setAssetCodeFilter] = useState('');
    const [computerNameFilter, setComputerNameFilter] = useState('');
    const [userNameFilter, setUserNameFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLogPopupOpen, setIsLogPopupOpen] = useState(false);
    const [selectedAssetForLog, setSelectedAssetForLog] = useState(null);
    const [assetRowLogs, setAssetRowLogs] = useState([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [viewingAsset, setViewingAsset] = useState(null);

    const fetchAssetLogs = async (row) => {
        console.log('Action: Info Clicked for row:', row);
        setSelectedAssetForLog(row);
        setIsLogPopupOpen(true);
        
        try {
            // First try backend by ID
            let filtered = [];
            if (row.id) {
                console.log('Fetching logs from backend for recordId:', row.id);
                filtered = await assetService.getLogsByRecordId(row.id);
            }

            // If no backend logs or no ID, fallback to local (or maybe it's a new unsaved row)
            if (!filtered || filtered.length === 0) {
                const allLogs = JSON.parse(localStorage.getItem('ems_auto_audit_logs')) || [];
                const identifier = row.assetCode || row.computerName || row.particulers || row.name || row.prop2 || 'Unknown';
                
                filtered = allLogs.filter(l => 
                    (l.rowId && row.id && String(l.rowId) === String(row.id)) || 
                    (l.targetAsset === identifier)
                ).map(l => ({
                    ...l,
                    action: l.actionType,
                    recordName: l.targetAsset,
                    recordId: l.rowId,
                    changesJson: l.diff ? JSON.stringify(l.diff) : null
                }));
            } else {
                // Map backend format to UI components expectations if needed
                filtered = filtered.map(l => ({
                    ...l,
                    actionType: l.action,
                    targetAsset: l.recordName,
                    rowId: l.recordId,
                    diff: l.changesJson ? JSON.parse(l.changesJson) : null
                }));
            }
            
            setAssetRowLogs(filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        } catch (e) {
            console.error('Failed to fetch asset logs', e);
        }
    };

    const [customTabs, setCustomTabs] = useState([]);
    const [createTabOpen, setCreateTabOpen] = useState(false);
    const [newTabLabel, setNewTabLabel] = useState('');

    useEffect(() => {
        const loadCustomTabs = async () => {
            try {
                const data = await assetService.getDynamicData('GLOBAL_CUSTOM_TABS');
                if (data && data.tablesJson) {
                    setCustomTabs(JSON.parse(data.tablesJson));
                } else {
                    const local = JSON.parse(localStorage.getItem('ems_custom_tabs')) || [];
                    setCustomTabs(local);
                }
            } catch (error) {
                console.error("Failed to load custom tabs from backend", error);
            }
        };
        loadCustomTabs();
    }, []);

    const persistTabsToBackend = async (tabs) => {
        try {
            await assetService.saveDynamicData({
                tabId: 'GLOBAL_CUSTOM_TABS',
                tablesJson: JSON.stringify(tabs),
                rowsJson: '{}'
            });
            localStorage.setItem('ems_custom_tabs', JSON.stringify(tabs));
        } catch (error) {
            console.error("Failed to save custom tabs to backend", error);
        }
    };
    
    const allTabs = [...sectionTabs, ...customTabs];

    const handleCreateTab = async () => {
        if (!newTabLabel.trim()) return;
        const newTabId = 'custom_' + Date.now();
        const updated = [...customTabs, { id: newTabId, label: newTabLabel }];
        setCustomTabs(updated);
        await persistTabsToBackend(updated);
        setCreateTabOpen(false);
        setNewTabLabel('');
        setActiveTab(newTabId);
    };

    const handleDeleteTab = async (tabId) => {
        if (!window.confirm("Are you sure you want to delete this custom tab?")) return;
        const updated = customTabs.filter(t => t.id !== tabId);
        setCustomTabs(updated);
        await persistTabsToBackend(updated);
        localStorage.removeItem(`dyn_tables_${tabId}`);
        localStorage.removeItem(`dyn_rows_${tabId}`);
        setActiveTab('maintenance');
    };

    const [inventory, setInventory] = useState([]);
    const [categoryAssets, setCategoryAssets] = useState([]);
    const [stockItems, setStockItems] = useState({});
    const [serviceSchedules, setServiceSchedules] = useState([]);
    const [expandedScheduleIds, setExpandedScheduleIds] = useState([]);
    const [selectedStockGroup, setSelectedStockGroup] = useState('');
    const [editingQuantity, setEditingQuantity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newInventoryRows, setNewInventoryRows] = useState([]);
    const [newCategoryRows, setNewCategoryRows] = useState([]);
    const [newStockRows, setNewStockRows] = useState([]);
    
    // Total rows across all dynamic tables for the active tab (if it's a custom tab or uses dynamic tables)
    const customTabTotalCount = useMemo(() => {
        try {
            const data = JSON.parse(localStorage.getItem(`dyn_rows_${activeTab}`)) || {};
            return Object.values(data).reduce((acc, rows) => acc + (rows?.length || 0), 0);
        } catch { return 0; }
    }, [activeTab]);
    const [newScheduleRowsById, setNewScheduleRowsById] = useState({});
    
    // Pagination states
    const [inventoryPage, setInventoryPage] = useState(1);
    const [acPage, setAcPage] = useState(1);
    const pageSize = 8;

    // Schedule UX state
    const [selectedACIndex, setSelectedACIndex] = useState(0);
    const [selectedACYear, setSelectedACYear] = useState(new Date().getFullYear().toString());
    const [selectedACRowId, setSelectedACRowId] = useState(null);
    const [createACModalOpen, setCreateACModalOpen] = useState(false);
    const [newACData, setNewACData] = useState({ assetName: 'AC ', assetCode: '', location: '' });

    // Checklist per AC state
    const [acChecklists, setAcChecklists] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ems_ac_checklists')) || {}; } catch { return {}; }
    });

    const updateChecklist = (field, value) => {
        if (!selectedACRowId) return;
        setAcChecklists(prev => {
            const upd = { ...prev, [selectedACRowId]: { ...(prev[selectedACRowId] || {}), [field]: value } };
            localStorage.setItem('ems_ac_checklists', JSON.stringify(upd));
            return upd;
        });
    };

    const [editingRowId, setEditingRowId] = useState(null);
    const [formData, setFormData] = useState({
        assetCode: '', computerName: '', userName: '', department: '', emailId: '', mobileNumber: '', ipAddress: '',
        make: '', model: '', cpu: '', ram: '', hddType: '', os: '', status: 'Available', remarks: '', maintenance: '', assetType: 'Laptop'
    });

    const emptyInventoryRow = {
        assetCode: '', computerName: '', userName: '', department: '', emailId: '', mobileNumber: '', ipAddress: '',
        make: '', model: '', cpu: '', ram: '', hddType: '', os: '', status: 'Available', remarks: '', maintenance: '', assetType: 'Laptop'
    };
    const emptyCategoryRow = {
        assetClass: '', productName: '', assetCode: '', location: '', department: '', responsibility: '', make: '',
        model: '', description: '', status: 'Working', lastMaintenance: '', additionalSupport: '', remarks: ''
    };
    const emptyStockRow = {
        itemName: '', type: '', brand: '', quantity: 0, status: 'New', sectionName: '', specification: '', remarks: ''
    };

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const [inventoryData, categoryData, stockData, schedulesData] = await Promise.all([
                    assetService.getInventory(),
                    assetService.getCategoryAssets(),
                    assetService.getStockItems(),
                    assetService.getSchedules()
                ]);

                const normalizedInventory = (inventoryData || []).map((row) => ({
                    ...row,
                    hddType: row.hddAndType || row.hddType || ''
                }));
                const groupedStock = groupStockItems(stockData || []);
                const stockGroups = Object.keys(groupedStock);
                const normalizedSchedules = (schedulesData || []).map(normalizeSchedule);

                setInventory(normalizedInventory);
                setCategoryAssets(categoryData || []);
                setStockItems(groupedStock);
                setSelectedStockGroup((current) => current || stockGroups[0] || '');
                setServiceSchedules(normalizedSchedules);
                setExpandedScheduleIds(normalizedSchedules.length > 0 ? [normalizedSchedules[0].id] : []);
            } catch (error) {
                console.error('Failed to load asset data', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, []);

    // Effect to ensure 4 rows by default for empty AC years
    useEffect(() => {
        if (activeTab === 'maintenance' && serviceSchedules.length > 0) {
            const activeIndex = ((selectedACIndex % serviceSchedules.length) + serviceSchedules.length) % serviceSchedules.length;
            const schedule = serviceSchedules[activeIndex];
            if (schedule) {
                const activeRows = (schedule.rows || []).filter(r => String(r.year) === selectedACYear);
                const currentDrafts = newScheduleRowsById[schedule.id] || [];
                if (activeRows.length === 0 && currentDrafts.length === 0 && canDoMaintenance) {
                    setNewScheduleRowsById(prev => ({
                        ...prev,
                        [schedule.id]: Array.from({ length: 4 }).map((_, i) => ({
                            tempId: Date.now() + Math.random() + i,
                            year: selectedACYear,
                            monthRange: '',
                            plannedDate: '',
                            actualDate: '',
                            remarks: '',
                            status: ''
                        }))
                    }));
                }
            }
        }
    }, [activeTab, selectedACIndex, selectedACYear, serviceSchedules.length, canDoMaintenance]);

    useEffect(() => {
        setSelectedACRowId(null);
    }, [selectedACIndex, selectedACYear, activeTab]);

    const departments = ['All', ...new Set(inventory.map(item => item.department).filter(Boolean).sort())];
    const statuses = ['All', 'In Use', 'Available', 'Repair', 'Scrap'];
    const assetTypes = ['All', 'Laptop', 'Server', 'Desktop'];
    const makes = ['All', ...new Set(inventory.map(item => item.make).filter(Boolean).sort())];
    const osList = ['All', ...new Set(inventory.map(item => item.os).filter(Boolean).sort())];
    const ramOptions = ['All', ...new Set(inventory.map(item => item.ram).filter(Boolean).sort())];

    const filteredInventory = useMemo(() => {
        return inventory.filter(row => {
            const matchesSearch = !searchQuery || Object.values(row).some(value => (value || '').toString().toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDepartment = departmentFilter === 'All' || row.department === departmentFilter;
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
            const matchesType = assetType === 'All' || row.type === assetType;
            const matchesMake = makeFilter === 'All' || row.make === makeFilter;
            const matchesOs = osFilter === 'All' || row.os === osFilter;
            const matchesRam = ramFilter === 'All' || row.ram === ramFilter;
            const matchesAssetCode = !assetCodeFilter || (row.assetCode || '').toLowerCase().includes(assetCodeFilter.toLowerCase());
            const matchesComputerName = !computerNameFilter || (row.computerName || '').toLowerCase().includes(computerNameFilter.toLowerCase());
            const matchesUserName = !userNameFilter || (row.userName || '').toLowerCase().includes(userNameFilter.toLowerCase());

            const rowDate = row.createdAt ? new Date(row.createdAt) : null;
            let matchesDateRange = true;
            if (rowDate) {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (rowDate < start) matchesDateRange = false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (rowDate > end) matchesDateRange = false;
                }
            } else if (startDate || endDate) {
                matchesDateRange = false;
            }

            return matchesSearch && matchesDepartment && matchesStatus && matchesType && matchesMake && matchesOs && matchesRam && matchesAssetCode && matchesComputerName && matchesUserName && matchesDateRange;
        });
    }, [inventory, searchQuery, departmentFilter, statusFilter, assetType, makeFilter, osFilter, ramFilter, assetCodeFilter, computerNameFilter, userNameFilter, startDate, endDate]);

    const paginatedInventory = useMemo(() => {
        const start = (inventoryPage - 1) * 8;
        return filteredInventory.slice(start, start + 8);
    }, [filteredInventory, inventoryPage]);

    const startInlineEdit = (row) => {
        setEditingRowId(row.id);
        setFormData(row);
    };

    const cancelInlineEdit = () => {
        setEditingRowId(null);
    };

    const handleSaveView = async (updatedAsset) => {
        try {
            const payload = {
                ...updatedAsset,
                hddAndType: updatedAsset.hddType
            };

            const oldRow = inventory.find(r => r.id === updatedAsset.id);
            const updated = await assetService.updateInventory(updatedAsset.id, payload);
            
            // Calculate changes for logs
            const changes = [];
            const ignoreFields = ['id', 'tempId', 'createdAt', 'updatedAt', 'lastModified', 'hddAndType'];
            
            Object.keys(payload).forEach(key => {
                if (ignoreFields.includes(key)) return;
                
                const oldVal = (oldRow[key] || '').toString();
                const newVal = (payload[key] || '').toString();
                
                if (oldVal !== newVal) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase().trim();
                    changes.push({ field: label, old: oldVal, new: newVal });
                }
            });

            if (changes.length > 0) {
                addTableLog('Laptops', 'MODIFIED', payload.assetCode || 'Unknown', `Updated ${changes.length} fields.`, updatedAsset.id, changes);
            }

            setInventory((prev) => prev.map((row) => row.id === updatedAsset.id
                ? { ...updated, hddType: updated.hddAndType || updated.hddType || '' }
                : row));
        } catch (error) {
            console.error('Failed to save asset', error);
            throw error;
        }
    };

    const saveAsset = async () => {
        try {
            const payload = {
                ...formData,
                hddAndType: formData.hddType
            };

            if (editingRowId) {
                const oldRow = inventory.find(r => r.id === editingRowId);
                const updated = await assetService.updateInventory(editingRowId, payload);
                
                // Calculate changes for logs
                const changes = [];
                const ignoreFields = ['id', 'tempId', 'createdAt', 'updatedAt', 'lastModified', 'hddAndType'];
                
                Object.keys(payload).forEach(key => {
                    if (ignoreFields.includes(key)) return;
                    
                    const oldVal = (oldRow[key] || '').toString();
                    const newVal = (payload[key] || '').toString();
                    
                    if (oldVal !== newVal) {
                        // Create a nice label from camelCase or underscore_case
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase().trim();
                        changes.push({ field: label, old: oldVal, new: newVal });
                    }
                });

                if (changes.length > 0) {
                    addTableLog('Laptops', 'MODIFIED', formData.assetCode || 'Unknown', `Updated ${changes.length} fields.`, editingRowId, changes);
                }

                setInventory((prev) => prev.map((row) => row.id === editingRowId
                    ? { ...updated, hddType: updated.hddAndType || updated.hddType || '' }
                    : row));
                setEditingRowId(null);
            }
        } catch (error) {
            console.error('Failed to save asset', error);
        }
    };

    const deleteAsset = async (row) => {
        if (!window.confirm(`Delete asset ${row.assetCode}?`)) return;
        try {
            await assetService.deleteInventory(row.id);
            setInventory(prev => prev.filter(item => item.id !== row.id));
            addTableLog('Laptops', 'DELETED', row.assetCode || 'Unknown', 'Deleted asset from inventory.');
        } catch (error) {
            console.error('Failed to delete asset', error);
        }
    };

    const updateStockQty = async (group, itemId, nextQty) => {
        const targetItem = (stockItems[group] || []).find((item) => item.id === itemId);
        if (!targetItem) {
            return;
        }
        const parsedQty = Number(nextQty);
        const payload = {
            ...targetItem,
            specification: targetItem.type,
            sectionName: group,
            quantity: Number.isNaN(parsedQty) ? 0 : parsedQty
        };
        try {
            const updated = await assetService.updateStockItem(itemId, payload);
            setStockItems(prev => ({
                ...prev,
                [group]: (prev[group] || []).map(item => item.id === itemId
                    ? { ...updated, type: updated.specification || updated.type || '' }
                    : item)
            }));
        } catch (error) {
            console.error('Failed to update stock item', error);
        }
    };

    const updateScheduleRow = async (scheduleId, rowIndex, patch) => {
        const schedule = serviceSchedules.find((item) => item.id === scheduleId);
        if (!schedule) {
            return;
        }

        const nextRows = schedule.rows.map((row, idx) => idx === rowIndex ? { ...row, ...patch } : row);
        setServiceSchedules(prev => prev.map(item => item.id === scheduleId ? { ...item, rows: nextRows } : item));

        const payload = {
            ...schedule,
            entries: nextRows.map((row) => ({
                id: row.id,
                year: row.year,
                monthRange: row.monthRange,
                plannedDate: row.plannedDate,
                actualDate: row.actualDate,
                status: row.status
            }))
        };

        try {
            const updated = await assetService.updateSchedule(scheduleId, payload);
            setServiceSchedules(prev => prev.map(item => item.id === scheduleId ? normalizeSchedule(updated) : item));
            addTableLog('Maintenance Schedule', 'MODIFIED', schedule.assetName || schedule.assetCode, 'Updated maintenance schedule actual dates or remarks.');
        } catch (error) {
            console.error('Failed to update maintenance schedule', error);
        }
    };

    const deleteScheduleRow = async (scheduleId, rowIndex) => {
        if (!window.confirm('Delete this maintenance entry?')) return;
        const schedule = serviceSchedules.find((item) => item.id === scheduleId);
        if (!schedule) return;

        const nextRows = schedule.rows.filter((_, idx) => idx !== rowIndex);
        setServiceSchedules(prev => prev.map(item => item.id === scheduleId ? { ...item, rows: nextRows } : item));

        try {
            await assetService.updateSchedule(scheduleId, {
                ...schedule,
                entries: nextRows
            });
            addTableLog('AC Maintenance', 'DELETED', `${schedule.assetName} Entry`, 'Removed a maintenance schedule row.');
        } catch (error) {
            console.error('Failed to delete schedule row', error);
        }
    };

    const saveAllNewInventoryRows = async () => {
        if (newInventoryRows.length === 0) return;
        const validRows = newInventoryRows.filter(r => r.assetCode);
        if (validRows.length === 0) return;
        try {
            const savedRows = [];
            for (const row of validRows) {
                const payload = { ...row, hddAndType: row.hddType };
                const created = await assetService.createInventory(payload);
                savedRows.push({ ...created, hddType: created.hddAndType || created.hddType || '' });
            }
            setInventory((prev) => [...savedRows, ...prev]);
            addTableLog('Laptops', 'CREATED', `Multiple (${savedRows.length})`, `Added ${savedRows.length} new inventory assets.`);
            setNewInventoryRows([]);
        } catch (error) {
            console.error('Failed to create inventory rows', error);
        }
    };

    const saveAllNewCategoryRows = async () => {
        if (newCategoryRows.length === 0) return;
        const validRows = newCategoryRows.filter(r => r.assetCode);
        if (validRows.length === 0) return;
        try {
            const savedRows = [];
            for (const row of validRows) {
                const created = await assetService.createCategoryAsset(row);
                savedRows.push(created);
            }
            setCategoryAssets((prev) => [...savedRows, ...prev]);
            setNewCategoryRows([]);
        } catch (error) {
            console.error('Failed to create category asset rows', error);
        }
    };

    const saveAllNewStockRows = async () => {
        if (newStockRows.length === 0) return;
        const validRows = newStockRows.filter(r => r.itemName);
        if (validRows.length === 0) return;
        try {
            const newStockItems = { ...stockItems };
            let lastGroup = selectedStockGroup;
            for (const row of validRows) {
                const payload = {
                    ...row,
                    sectionName: row.sectionName || lastGroup || 'Uncategorized',
                    specification: row.type,
                    quantity: Number(row.quantity || 0)
                };
                const created = await assetService.createStockItem(payload);
                const group = created.sectionName || payload.sectionName;
                if (!newStockItems[group]) newStockItems[group] = [];
                newStockItems[group] = [{ ...created, type: created.specification || created.type || '' }, ...newStockItems[group]];
                lastGroup = group;
            }
            setStockItems(newStockItems);
            setSelectedStockGroup(lastGroup);
            setNewStockRows([]);
        } catch (error) {
            console.error('Failed to create stock rows', error);
        }
    };

    const handleCreateAC = async () => {
        if (!newACData.assetName) return;
        try {
            const currentYear = new Date().getFullYear();
            const created = await assetService.createSchedule({
                ...newACData,
                entries: [
                    { year: currentYear, monthRange: 'Jan - Mar', plannedDate: '', actualDate: '', status: 'Pending', remarks: '' },
                    { year: currentYear, monthRange: 'Apr - June', plannedDate: '', actualDate: '', status: 'Pending', remarks: '' },
                    { year: currentYear, monthRange: 'July - Sep', plannedDate: '', actualDate: '', status: 'Pending', remarks: '' },
                    { year: currentYear, monthRange: 'Oct - Dec', plannedDate: '', actualDate: '', status: 'Pending', remarks: '' }
                ]
            });
            setServiceSchedules(prev => [...prev, normalizeSchedule(created)]);
            addTableLog('Maintenance Schedule', 'CREATED', newACData.assetName, `Created new maintenance schedule schedule for ${newACData.assetCode}`);
            setCreateACModalOpen(false);
            setNewACData({ assetName: 'AC ', assetCode: '', location: '' });
            setSelectedACIndex(serviceSchedules.length); // switch to the new one
        } catch (error) {
            console.error('Failed to create AC schedule', error);
        }
    };

    const saveAllNewScheduleRows = async (scheduleId) => {
        const drafts = newScheduleRowsById[scheduleId] || [];
        if (drafts.length === 0) return;

        const schedule = serviceSchedules.find((item) => item.id === scheduleId);
        if (!schedule) return;

        const payload = {
            ...schedule,
            entries: [...schedule.rows, ...drafts].map((row) => ({
                id: row.id,
                year: row.year,
                monthRange: row.monthRange,
                plannedDate: row.plannedDate,
                actualDate: row.actualDate,
                status: row.status
            }))
        };

        try {
            const updated = await assetService.updateSchedule(scheduleId, payload);
            setServiceSchedules((prev) => prev.map((item) => item.id === scheduleId ? normalizeSchedule(updated) : item));
            setNewScheduleRowsById((prev) => ({
                ...prev,
                [scheduleId]: []
            }));
        } catch (error) {
            console.error('Failed to create schedule rows', error);
        }
    };

    const renderTopBar = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Asset Management</div>
                <h1 style={{ margin: '6px 0 0 0', fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                    {activeTab === 'inventory' && 'Laptops'}
                    {activeTab === 'category' && 'Category Assets'}
                    {activeTab === 'stock' && 'Stock Management'}
                    {activeTab === 'maintenance' && 'AC Maintenance'}
                </h1>
                <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                    {isHr ? 'HR view is read-only. Search and export remain available.' : ''}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: 280 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by asset, user, IP, email..."
                        style={{ width: '100%', height: 38, padding: '0 12px 0 36px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}
                    />
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div style={{ padding: 24, background: 'transparent', minHeight: 'auto' }}>
                <div style={{ fontSize: 14, color: '#475569', fontWeight: 700 }}>Loading asset data...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
            {scopedStyle}
            {renderTopBar()}

            <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allTabs.map(tab => {
                    const Icon = tab.icon || CircleDashed;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                height: 38,
                                padding: '0 14px',
                                borderRadius: 999,
                                border: tab.id === 'maintenance' ? '2px solid #f97316' : `1px solid ${active ? '#f97316' : '#cbd5e1'}`,
                                background: active ? '#f97316' : '#fff',
                                color: active ? '#fff' : (tab.id === 'maintenance' ? '#f97316' : '#0f172a'),
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
                {canEdit && (
                    <button
                        onClick={() => setCreateTabOpen(true)}
                        style={{ height: 38, padding: '0 14px', borderRadius: 999, border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <Plus size={16} /> New Tab
                    </button>
                )}
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeTab === 'inventory' && (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, background: '#fff', padding: 12 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: '1 1 200px' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search any inventory field..." style={{ height: 38, width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px 0 36px', fontSize: 14 }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ height: 38, minWidth: 140, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '0 32px 0 12px', fontSize: 13, fontWeight: 600, appearance: 'none', color: '#334155' }}>
                                    <option value="All">All Departments</option>
                                    {departments.filter(d => d !== 'All').map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 12, color: '#94a3b8', pointerEvents: 'none' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 38, minWidth: 120, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '0 32px 0 12px', fontSize: 13, fontWeight: 600, appearance: 'none', color: '#334155' }}>
                                    <option value="All">All Statuses</option>
                                    {statuses.filter(s => s !== 'All').map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 12, color: '#94a3b8', pointerEvents: 'none' }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select value={assetType} onChange={(e) => setAssetType(e.target.value)} style={{ height: 38, minWidth: 130, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '0 32px 0 12px', fontSize: 13, fontWeight: 600, appearance: 'none', color: '#334155' }}>
                                    <option value="All">All Types</option>
                                    {assetTypes.filter(t => t !== 'All').map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 12, color: '#94a3b8', pointerEvents: 'none' }} />
                            </div>
                            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ height: 38, padding: '0 16px', background: showAdvancedFilters ? '#e2e8f0' : '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                <Filter size={16} /> Advanced Filters
                            </button>
                            <div style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0' }}>
                                Total Records: <span style={{ color: '#0f172a' }}>{filteredInventory.length}</span>
                            </div>
                        </div>
                        
                        {showAdvancedFilters && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative' }}>
                                    <input value={assetCodeFilter} onChange={(e) => setAssetCodeFilter(e.target.value)} placeholder="Asset Code..." style={{ height: 34, width: 130, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input value={computerNameFilter} onChange={(e) => setComputerNameFilter(e.target.value)} placeholder="Computer Name..." style={{ height: 34, width: 140, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input value={userNameFilter} onChange={(e) => setUserNameFilter(e.target.value)} placeholder="User Name..." style={{ height: 34, width: 130, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <select value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)} style={{ height: 34, minWidth: 120, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 28px 0 10px', fontSize: 12, fontWeight: 800, appearance: 'none', color: '#334155' }}>
                                        <option value="All">Filter Make</option>
                                        {makes.filter(m => m !== 'All').map(x => <option key={x} value={x}>{x}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: 10, color: '#94a3b8', pointerEvents: 'none' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <select value={osFilter} onChange={(e) => setOsFilter(e.target.value)} style={{ height: 34, minWidth: 120, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 28px 0 10px', fontSize: 12, fontWeight: 800, appearance: 'none', color: '#334155' }}>
                                        <option value="All">Filter OS</option>
                                        {osList.filter(o => o !== 'All').map(x => <option key={x} value={x}>{x}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: 10, color: '#94a3b8', pointerEvents: 'none' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <select value={ramFilter} onChange={(e) => setRamFilter(e.target.value)} style={{ height: 34, minWidth: 110, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 28px 0 10px', fontSize: 12, fontWeight: 800, appearance: 'none', color: '#334155' }}>
                                        <option value="All">Filter RAM</option>
                                        {ramOptions.filter(r => r !== 'All').map(x => <option key={x} value={x}>{x}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: 10, color: '#94a3b8', pointerEvents: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>FROM</span>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>TO</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px', fontSize: 12, fontWeight: 700, color: '#0f172a' }} />
                                </div>
                                {(makeFilter !== 'All' || osFilter !== 'All' || ramFilter !== 'All' || assetCodeFilter || computerNameFilter || userNameFilter || startDate || endDate) && (
                                    <button onClick={() => { setMakeFilter('All'); setOsFilter('All'); setRamFilter('All'); setAssetCodeFilter(''); setComputerNameFilter(''); setUserNameFilter(''); setStartDate(''); setEndDate(''); }} style={{ height: 34, padding: '0 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={12} /> Clear Advanced</button>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'stock' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.keys(stockItems).map(group => {
                            const active = selectedStockGroup === group;
                            return (
                                <button key={group} onClick={() => setSelectedStockGroup(group)} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: `1px solid ${active ? '#f97316' : '#cbd5e1'}`, background: active ? '#f97316' : '#fff', color: active ? '#fff' : '#0f172a', fontWeight: 800 }}>
                                    {group}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 20 }}>
                {activeTab === 'inventory' && viewingAsset ? (
                    <AssetDetailView 
                        asset={viewingAsset} 
                        onBack={() => setViewingAsset(null)}
                        onSave={canEdit ? handleSaveView : undefined}
                    />
                ) : activeTab === 'inventory' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <TableShell>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['SL No', 'Created At', 'Asset Code', 'Computer Name', 'User Name', 'Department', 'Status', 'Actions'].map(head => (
                                            <th key={head} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {canEdit && newInventoryRows.map((row, draftIndex) => (
                                        <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                            <td style={{ padding: '10px 12px' }}><div className="asset-data-cell" style={{ background: '#fffaf5', color: '#ea580c', fontWeight: 700 }}>New Row</div></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.assetCode} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, assetCode: e.target.value } : r))} placeholder="Asset code" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.computerName} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, computerName: e.target.value } : r))} placeholder="Computer" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.userName} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, userName: e.target.value } : r))} placeholder="User" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.department} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, department: e.target.value } : r))} placeholder="Department" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <select value={row.status} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, status: e.target.value } : r))} style={{ width: 110, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }}>
                                                    <option value="Available">Available</option>
                                                    <option value="In Use">In Use</option>
                                                    <option value="Repair">Repair</option>
                                                    <option value="Scrap">Scrap</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <button onClick={() => setNewInventoryRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedInventory.map((row, index) => {
                                        const globalIndex = (inventoryPage - 1) * 8 + index;

                                        return (
                                            <tr key={row.id} style={{ borderBottom: '1px solid #edf2f7', background: 'transparent' }}>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell">{canEdit ? newInventoryRows.length + globalIndex + 1 : globalIndex + 1}</div></td>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ color: '#64748b' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</div></td>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ fontWeight: 900 }}>{row.assetCode}</div></td>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.computerName || '-'}</div></td>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.userName || '-'}</div></td>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell">{row.department || '-'}</div></td>
                                                <td style={{ padding: '12px' }}><div className="asset-data-cell" style={{ border: 'none', background: 'transparent' }}><Badge value={row.status} /></div></td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        <button onClick={() => setViewingAsset(row)} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: 8, padding: '6px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 800 }}>View</button>
                                                        {canEdit && (
                                                            <button onClick={() => deleteAsset(row)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '6px 10px', display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontWeight: 800 }}>Delete</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {canEdit && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                                <button onClick={() => setNewInventoryRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyInventoryRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Plus size={14} /> ADD ROW
                                </button>
                                
                                <Pagination 
                                    currentPage={inventoryPage} 
                                    totalItems={filteredInventory.length} 
                                    pageSize={8} 
                                    onPageChange={setInventoryPage} 
                                />

                                {newInventoryRows.length > 0 && (
                                    <button onClick={saveAllNewInventoryRows} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#fff', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <Save size={14} /> Save All
                                    </button>
                                )}
                            </div>
                        )}
                    </TableShell>
                </div>
                )}

                {activeTab === 'server' && <ServerTab canEdit={canEdit} data={categoryAssets} onViewHistory={fetchAssetLogs} />}
                {activeTab === 'it_asset' && <ITAssetTab canEdit={canEdit} data={categoryAssets} onViewHistory={fetchAssetLogs} />}
                {activeTab === 'fixtures' && <FixturesTab canEdit={canEdit} data={categoryAssets} onViewHistory={fetchAssetLogs} />}
                {activeTab === 'stock_maintenance' && <StockMaintenanceTab canEdit={canEdit} data={stockItems} onViewHistory={fetchAssetLogs} />}
                {activeTab === 'noc_team' && <NOCTeamTab canEdit={canEdit} data={categoryAssets} onViewHistory={fetchAssetLogs} />}

                {customTabs.find(t => t.id === activeTab) && (
                    <div style={{ padding: '0 0 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{customTabs.find(t => t.id === activeTab).label}</h2>
                            <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                Total Records: <span style={{ color: '#0f172a' }}>{customTabTotalCount}</span>
                            </div>
                        </div>
                        {canEdit && (
                            <button 
                                onClick={() => handleDeleteTab(activeTab)} 
                                style={{ padding: '6px 14px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                                <Trash2 size={16} /> Delete Tab
                            </button>
                        )}
                    </div>
                )}

                {/* Inject the dynamic table builder on ALL tabs (excluding maybe maintenance/inventory, or literally all of them?) */}
                {activeTab !== 'inventory' && activeTab !== 'maintenance' && activeTab !== 'stock_maintenance' && (
                    <div style={{ marginTop: 12 }}>
                        <DynamicTables key={activeTab} tabId={activeTab} canEdit={canEdit} />
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gap: 16 }}>
                            {serviceSchedules.length > 0 ? (
                            (() => {
                                const activeIndex = ((selectedACIndex % serviceSchedules.length) + serviceSchedules.length) % serviceSchedules.length;
                                const schedule = serviceSchedules[activeIndex];
                                if (!schedule) return null;

                                const activeRows = (schedule.entries || schedule.rows || []).filter(r => String(r.year) === selectedACYear);
                                const drafts = (newScheduleRowsById[schedule.id] || []).filter(r => String(r.year) === selectedACYear || !r.year);

                                const currentChecklist = selectedACRowId ? (acChecklists[selectedACRowId] || {}) : {};

                                const allYears = [...new Set((schedule.entries || schedule.rows || []).map(r => String(r.year)))];
                                if (!allYears.includes(selectedACYear) && selectedACYear) allYears.push(selectedACYear);
                                allYears.sort();


                                return (
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', overflow: 'hidden', boxShadow: '0 8px 30px rgba(156,163,175,0.4)' }}>
                                        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ height: 44, width: 44, borderRadius: 12, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                                    <Wrench size={22} />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>{schedule.assetName}</h3>
                                                    <div style={{ margin: '4px 0 0', display: 'flex', gap: 12, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                                                        <span style={{ color: '#334155', fontWeight: 800 }}>{schedule.assetCode}</span>
                                                        <span style={{ color: '#cbd5e1' }}>|</span>
                                                        <span>{schedule.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ position: 'relative' }}>
                                                    <select value={selectedACYear} onChange={e => setSelectedACYear(e.target.value)} style={{ padding: '0 32px 0 16px', height: 38, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 800, color: '#0f172a', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
                                                        {allYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                    </select>
                                                    <ChevronDown size={16} strokeWidth={3} style={{ position: 'absolute', right: 12, top: 11, color: '#94a3b8', pointerEvents: 'none' }} />
                                                </div>
                                                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, border: '1px solid #e2e8f0' }}>
                                                    <button onClick={() => setSelectedACIndex(prev => prev - 1)} style={{ height: 30, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#0f172a', boxShadow: '0 4px 15px rgba(156,163,175,0.3)' }}><ChevronLeft size={16} strokeWidth={3} /></button>
                                                    <button onClick={() => setSelectedACIndex(prev => prev + 1)} style={{ height: 30, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#64748b' }}><ChevronRight size={16} strokeWidth={3} /></button>
                                                </div>
                                                {canDoMaintenance && (
                                                    <button onClick={() => setCreateACModalOpen(true)} style={{ height: 38, padding: '0 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Plus size={16} /> New AC
                                                    </button>
                                                )}
                                                <div style={{ marginLeft: 12, background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 900, color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                                    Total Records: <span style={{ color: '#0f172a' }}>{activeRows.length + (drafts.length || 0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="asset-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                                                <thead>
                                                    <tr>
                                                        {['Month', 'Planned Date', 'Actual Date', 'Remarks', 'Status', 'Log'].map(h => (
                                                            <th key={h} style={{ background: '#fcfcfd', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const start = (acPage - 1) * pageSize;
                                                        const pActiveRows = activeRows.slice(start, start + pageSize);
                                                        return pActiveRows.length > 0 ? pActiveRows.map((row, idx) => {
                                                            const rowKey = row.id || `active-${idx}`;
                                                            const isSelected = selectedACRowId === rowKey;
                                                            return (
                                                            <tr 
                                                                key={idx} 
                                                                onClick={() => setSelectedACRowId(rowKey)}
                                                                style={{ background: isSelected ? '#f1f5f9' : '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                                                            >
                                                                <td style={{ borderBottom: '1px solid #f1f5f9', padding: '6px 20px' }}>
                                                                    {canDoMaintenance ? (
                                                                        <input 
                                                                            value={row.monthRange || ''} 
                                                                            onChange={e => updateScheduleRow(schedule.id, start + idx, { monthRange: e.target.value })}
                                                                            placeholder="Month"
                                                                            style={{ width: '100%', maxWidth: 120, height: 38, borderRadius: 8, border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', padding: '0 12px', fontSize: 13, fontWeight: 800, background: isSelected ? '#fff' : 'transparent' }}
                                                                        />
                                                                    ) : <div className="asset-data-cell" style={{ fontWeight: 800, maxWidth: 120 }}>{row.monthRange}</div>}
                                                                </td>
                                                                <td style={{ borderBottom: '1px solid #f1f5f9', padding: '6px 20px' }}>
                                                                    {canDoMaintenance ? (
                                                                        <input 
                                                                            type="date"
                                                                            value={row.plannedDate || ''} 
                                                                            onChange={e => updateScheduleRow(schedule.id, start + idx, { plannedDate: e.target.value })}
                                                                            style={{ width: '100%', maxWidth: 160, height: 38, borderRadius: 8, border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', padding: '0 12px', fontSize: 13, background: isSelected ? '#fff' : 'transparent' }}
                                                                        />
                                                                    ) : <div className="asset-data-cell" style={{ maxWidth: 160 }}>{row.plannedDate}</div>}
                                                                </td>
                                                                <td style={{ borderBottom: '1px solid #f1f5f9', padding: '6px 20px' }}>
                                                                    {canDoMaintenance ? (
                                                                        <input
                                                                            type="date"
                                                                            value={row.actualDate || ''}
                                                                            onChange={(e) => updateScheduleRow(schedule.id, start + idx, { actualDate: e.target.value })}
                                                                            style={{ width: '100%', maxWidth: 160, height: 38, borderRadius: 8, border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', padding: '0 12px', fontSize: 13, background: isSelected ? '#fff' : 'transparent' }}
                                                                        />
                                                                    ) : <div className="asset-data-cell" style={{ maxWidth: 160 }}>{row.actualDate || '-'}</div>}
                                                                </td>
                                                                <td style={{ borderBottom: '1px solid #f1f5f9', padding: '6px 20px' }}>
                                                                    {canDoMaintenance ? (
                                                                        <input
                                                                            value={row.remarks || ''}
                                                                            onChange={(e) => updateScheduleRow(schedule.id, start + idx, { remarks: e.target.value })}
                                                                            placeholder="Enter remarks..."
                                                                            style={{ width: '100%', minWidth: 160, height: 38, borderRadius: 8, border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0', padding: '0 12px', fontSize: 14, background: isSelected ? '#fff' : '#f8fafc' }}
                                                                        />
                                                                    ) : <div className="asset-data-cell" style={{ minWidth: 160 }}>{row.remarks || '-'}</div>}
                                                                </td>
                                                                <td style={{ borderBottom: '1px solid #f1f5f9', padding: '6px 20px' }}>
                                                                    {canDoMaintenance ? (
                                                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                                            <div style={{ flex: 1, position: 'relative', minWidth: 140 }}>
                                                                                <select 
                                                                                    value={row.status || ''} 
                                                                                    onChange={(e) => updateScheduleRow(schedule.id, start + idx, { status: e.target.value })} 
                                                                                    style={{ width: '100%', height: 38, padding: '0 32px 0 12px', border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, appearance: 'none', background: isSelected ? '#fff' : '#fff', color: row.status === 'Completed' ? '#ea580c' : '#0f172a', fontWeight: row.status === 'Completed' ? 800 : 500 }}
                                                                                >
                                                                                    <option value="">Select status</option>
                                                                                    <option value="Completed">Completed</option>
                                                                                    <option value="Issue Found">Issue Found</option>
                                                                                    <option value="Pending">Pending</option>
                                                                                </select>
                                                                                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8', pointerEvents: 'none' }} />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <Badge value={row.status || '-'} />
                                                                    )}
                                                                </td>
                                                                <td style={{ borderBottom: '1px solid #f1f5f9', padding: '6px 20px' }}>
                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); fetchAssetLogs(row); }} 
                                                                            style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 8, padding: '5px 8px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }} 
                                                                            title="View row history"
                                                                        >
                                                                            <Info size={14} />
                                                                        </button>
                                                                        {canDoMaintenance && (
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); deleteScheduleRow(schedule.id, start + idx); }} 
                                                                                style={{ padding: 4, height: 28, width: 28, borderRadius: 8, border: '1px solid #fee2e2', color: '#ef4444', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            );
                                                        }) : null;
                                                    })()}
                                                    
                                                    {canDoMaintenance && drafts.map((row, dIdx) => {
                                                        const rowKey = row.tempId || `draft-${dIdx}`;
                                                        const isSelected = selectedACRowId === rowKey;
                                                        return (
                                                        <tr 
                                                            key={row.tempId} 
                                                            onClick={() => setSelectedACRowId(rowKey)}
                                                            style={{ background: isSelected ? '#fef3c7' : '#fff7ed', cursor: 'pointer' }}
                                                        >
                                                            <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}><input value={row.monthRange} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, monthRange: e.target.value } : r) }))} placeholder="Month" style={{ width: 120, height: 38, border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px', fontSize: 13, fontWeight: 800, background: isSelected ? '#fff' : 'transparent' }} /></td>
                                                            <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}><input type="date" value={row.plannedDate || ''} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, plannedDate: e.target.value } : r) }))} style={{ width: '100%', minWidth: 150, height: 38, border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px', fontSize: 13, background: isSelected ? '#fff' : 'transparent' }} /></td>
                                                            <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}><input type="date" value={row.actualDate || ''} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, actualDate: e.target.value } : r) }))} style={{ width: '100%', minWidth: 120, height: 38, border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px', background: isSelected ? '#fff' : 'transparent' }} /></td>
                                                            <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}><input value={row.remarks || ''} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, remarks: e.target.value } : r) }))} placeholder="Remarks" style={{ width: '100%', minWidth: 160, height: 38, border: isSelected ? '1px solid #f59e0b' : '1px solid #e2e8f0', background: isSelected ? '#fff' : 'transparent', borderRadius: 8, padding: '0 10px' }} /></td>
                                                            <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}>
                                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                    <div style={{ position: 'relative', flex: 1 }}>
                                                                        <select value={row.status} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, status: e.target.value } : r) }))} style={{ width: '100%', height: 38, border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1', borderRadius: 8, padding: '0 30px 0 10px', appearance: 'none', background: isSelected ? '#fff' : 'transparent' }}>
                                                                            <option value="">Status</option>
                                                                            <option value="Completed">Completed</option>
                                                                            <option value="Issue Found">Issue</option>
                                                                            <option value="Pending">Pending</option>
                                                                        </select>
                                                                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: 11, color: '#94a3b8', pointerEvents: 'none' }} />
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].filter(r => r.tempId !== row.tempId) }))}} style={{ height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', borderRadius: 8, background: '#fff', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {canDoMaintenance && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                <button
                                                    onClick={() => setNewScheduleRowsById((prev) => ({
                                                        ...prev,
                                                        [schedule.id]: [
                                                            ...(prev[schedule.id] || []),
                                                            { tempId: Date.now() + Math.random() + 1, year: selectedACYear, monthRange: 'Jan - Mar', plannedDate: '', actualDate: '', remarks: '', status: '' },
                                                            { tempId: Date.now() + Math.random() + 2, year: selectedACYear, monthRange: 'Apr - June', plannedDate: '', actualDate: '', remarks: '', status: '' },
                                                            { tempId: Date.now() + Math.random() + 3, year: selectedACYear, monthRange: 'July - Sep', plannedDate: '', actualDate: '', remarks: '', status: '' },
                                                            { tempId: Date.now() + Math.random() + 4, year: selectedACYear, monthRange: 'Oct - Dec', plannedDate: '', actualDate: '', remarks: '', status: '' }
                                                        ]
                                                    }))}
                                                    style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(156,163,175,0.3)' }}
                                                >
                                                    <Plus size={16} /> ADD YEAR QUARTERS
                                                </button>

                                                <Pagination 
                                                    currentPage={acPage} 
                                                    totalItems={activeRows.length} 
                                                    pageSize={pageSize} 
                                                    onPageChange={setAcPage} 
                                                />

                                                {(newScheduleRowsById[schedule.id] || []).length > 0 && (
                                                    <button onClick={() => saveAllNewScheduleRows(schedule.id)} style={{ height: 36, padding: '0 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 2px 4px rgba(22,163,74,0.3)' }}>
                                                        <Save size={16} /> Save All
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Air Conditioner Checklist - CORRECTLY NESTED */}
                                        <div style={{ marginTop: 24, border: '1px solid #dbe3ea', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
                                            <div style={{ padding: '16px 18px', background: '#f8fafc', fontWeight: 900, color: '#0f172a' }}>Air Conditioner Checklist</div>
                                            <div style={{ padding: 18 }}>
                                                <div style={{ display: 'grid', gap: 12 }}>
                                                    {checklistItems.map((item, idx) => (
                                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: 10 }}>
                                                            <div style={{ fontSize: 14, color: '#0f172a' }}>{idx + 1}. {item}</div>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                {['OK', 'NOT OK', 'N/A'].map(choice => (
                                                                    <label key={choice} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#334155', cursor: 'pointer' }}>
                                                                        <input 
                                                                            type="radio" 
                                                                            name={`check-${selectedACRowId}-${idx}`} 
                                                                            checked={(currentChecklist[`item-${idx}`] || 'N/A') === choice} 
                                                                            onChange={() => updateChecklist(`item-${idx}`, choice)}
                                                                        /> {choice}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ marginTop: 24, padding: '20px 0 8px', borderTop: '2px dashed #edf2f7', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 2fr' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                            <input 
                                                                placeholder="Vendor Name" 
                                                                value={currentChecklist.vendor || ''}
                                                                onChange={e => updateChecklist('vendor', e.target.value)}
                                                                style={{ height: 42, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 14px', fontSize: 14 }} 
                                                            />
                                                            <input 
                                                                placeholder="Location" 
                                                                value={currentChecklist.location || ''}
                                                                onChange={e => updateChecklist('location', e.target.value)}
                                                                style={{ height: 42, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 14px', fontSize: 14 }} 
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                            <input 
                                                                placeholder="dd-mm-yyyy" 
                                                                type="date" 
                                                                value={currentChecklist.date || ''}
                                                                onChange={e => updateChecklist('date', e.target.value)}
                                                                style={{ height: 42, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 14px', fontSize: 14, color: '#64748b' }} 
                                                            />
                                                            <input 
                                                                placeholder="--:-- --" 
                                                                type="time" 
                                                                value={currentChecklist.time || ''}
                                                                onChange={e => updateChecklist('time', e.target.value)}
                                                                style={{ height: 42, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 14px', fontSize: 14, color: '#64748b' }} 
                                                            />
                                                        </div>
                                                        <textarea 
                                                            placeholder="Overall comment / cost of air conditioner maintenance" 
                                                            rows={4} 
                                                            value={currentChecklist.comment || ''}
                                                            onChange={e => updateChecklist('comment', e.target.value)}
                                                            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '14px', fontSize: 14, resize: 'vertical', height: '100%' }} 
                                                        />
                                                    </div>
                                                    
                                                    {canDoMaintenance && (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                                                            <button 
                                                                onClick={() => {
                                                                    if(window.confirm('Reset this checklist?')) {
                                                                        const upd = { ...acChecklists };
                                                                        delete upd[selectedACRowId];
                                                                        setAcChecklists(upd);
                                                                        localStorage.setItem('ems_ac_checklists', JSON.stringify(upd));
                                                                    }
                                                                }}
                                                                style={{ height: 40, padding: '0 24px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                                            >
                                                                Reset
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    alert('Checklist Report Saved successfully!');
                                                                    addTableLog('AC Maintenance', 'CREATED', `${schedule.assetName} Checklist`, 'Submitted a full AC maintenance checklist report.');
                                                                }}
                                                                style={{ height: 40, padding: '0 24px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                                            >
                                                                Save Report
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div style={{ padding: 32, border: '2px dashed #cbd5e1', borderRadius: 12, textAlign: 'center', background: '#f8fafc' }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: '#64748b', marginBottom: 12 }}>No Air Conditioner Schedules found</div>
                                {canEdit && (
                                    <button onClick={() => setCreateACModalOpen(true)} style={{ padding: '10px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}>
                                        + CREATE NEW AC MAP
                                    </button>
                                )}
                            </div>
                        )}


                    </div>
                </div>
                )}

                {activeTab !== 'maintenance' && (
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '2px dashed #e2e8f0' }}>
                        <LogHistoryTable tableScope={allTabs.find(t => t.id === activeTab)?.label || 'Activity'} />
                    </div>
                )}
            </div>

            {createTabOpen && canEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
                    <div style={{ width: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(107,114,128,0.4)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Create New Tab</h3>
                            <button onClick={() => setCreateTabOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>TAB NAME</label>
                            <input 
                                value={newTabLabel} 
                                onChange={(e) => setNewTabLabel(e.target.value)} 
                                placeholder="e.g. Employee Devices" 
                                style={{ width: '100%', height: 40, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }}
                                autoFocus
                            />
                        </div>
                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setCreateTabOpen(false)} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateTab} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Create Tab</button>
                        </div>
                    </div>
                </div>
            )}

            {createACModalOpen && canEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
                    <div style={{ width: 400, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(107,114,128,0.4)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Create New AC</h3>
                            <button onClick={() => setCreateACModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
                            <input value={newACData.assetName} onChange={e => setNewACData({ ...newACData, assetName: e.target.value })} placeholder="Asset Name (e.g. AC 2 Service Schedule)" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px' }} />
                            <input value={newACData.assetCode} onChange={e => setNewACData({ ...newACData, assetCode: e.target.value })} placeholder="Asset Code (e.g. ETIPL-AC-02)" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px' }} />
                            <input value={newACData.location} onChange={e => setNewACData({ ...newACData, location: e.target.value })} placeholder="Location / Information" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px' }} />
                        </div>
                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setCreateACModalOpen(false)} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateAC} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Create AC</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Popup */}
            <RowHistoryPopup 
                isOpen={isLogPopupOpen} 
                onClose={() => setIsLogPopupOpen(false)} 
                logs={assetRowLogs} 
                assetName={(selectedAssetForLog?.assetCode || selectedAssetForLog?.computerName || selectedAssetForLog?.particulers || selectedAssetForLog?.name || 'Asset').toUpperCase()} 
                recordId={selectedAssetForLog?.id}
            />
        </div>
    );
}