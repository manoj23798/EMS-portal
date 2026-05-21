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
    HardDrive,
    Server,
    Boxes,
    Wrench,
    Monitor,
    Save,
    X,
    AlertTriangle,
    CheckCircle2,
    CircleDashed
} from 'lucide-react';

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
    Recheck: { bg: '#fffbeb', color: '#d97706' }
};

const roleFromToken = tokenManager.getUserRole() || '';
const isHr = roleFromToken === 'HR';
const isAdmin = roleFromToken === 'ADMIN';
const canEdit = isAdmin;

const sectionTabs = [
    { id: 'inventory', label: 'Asset Inventory', icon: Monitor },
    { id: 'category', label: 'Category Assets', icon: Boxes },
    { id: 'stock', label: 'Stock Management', icon: HardDrive },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench }
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
            type: item.specification || item.type || ''
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

export default function AssetManagementDashboard() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [assetType, setAssetType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const [inventory, setInventory] = useState([]);
    const [itAssets, setItAssets] = useState([]);
    const [stockItems, setStockItems] = useState({});
    const [serviceSchedules, setServiceSchedules] = useState([]);
    const [expandedScheduleIds, setExpandedScheduleIds] = useState([]);
    const [selectedStockGroup, setSelectedStockGroup] = useState('');
    const [editingQuantity, setEditingQuantity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newInventoryRows, setNewInventoryRows] = useState([]);
    const [newItAssetRows, setNewItAssetRows] = useState([]);
    const [newStockRows, setNewStockRows] = useState([]);
    const [newScheduleRowsById, setNewScheduleRowsById] = useState({});

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [formData, setFormData] = useState({
        assetCode: '', computerName: '', userName: '', department: '', emailId: '', mobileNumber: '', ipAddress: '',
        make: '', model: '', cpu: '', ram: '', hddType: '', os: '', status: 'Available', remarks: '', assetType: 'Laptop'
    });

    const emptyInventoryRow = {
        assetCode: '', computerName: '', userName: '', department: '', emailId: '', mobileNumber: '', ipAddress: '',
        make: '', model: '', cpu: '', ram: '', hddType: '', os: '', status: 'Available', remarks: '', maintenance: 'Pending', assetType: 'Laptop'
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

    const departments = ['All', ...new Set(inventory.map(item => item.department).filter(Boolean))];
    const statuses = ['All', 'In Use', 'Available', 'Repair'];
    const assetTypes = ['All', 'Laptop', 'Server'];

    const filteredInventory = useMemo(() => {
        return inventory.filter(row => {
            const matchesSearch = !searchQuery || [
                row.assetCode,
                row.computerName,
                row.userName,
                row.ipAddress,
                row.emailId
            ].some(value => (value || '').toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesDepartment = departmentFilter === 'All' || row.department === departmentFilter;
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
            const matchesType = assetType === 'All' || row.assetType === assetType;

            return matchesSearch && matchesDepartment && matchesStatus && matchesType;
        });
    }, [inventory, searchQuery, departmentFilter, statusFilter, assetType]);

    const openNewModal = () => {
        setEditingRow(null);
        setFormData({
            assetCode: '', computerName: '', userName: '', department: '', emailId: '', mobileNumber: '', ipAddress: '',
            make: '', model: '', cpu: '', ram: '', hddType: '', os: '', status: 'Available', remarks: '', assetType: 'Laptop'
        });
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);
        setFormData(row);
        setModalOpen(true);
    };

    const saveAsset = async () => {
        try {
            const payload = {
                ...formData,
                hddAndType: formData.hddType
            };

            if (editingRow) {
                const updated = await assetService.updateInventory(editingRow.id, payload);
                setInventory((prev) => prev.map((row) => row.id === editingRow.id
                    ? { ...updated, hddType: updated.hddAndType || updated.hddType || '' }
                    : row));
            } else {
                const created = await assetService.createInventory(payload);
                setInventory((prev) => [{ ...created, hddType: created.hddAndType || created.hddType || '' }, ...prev]);
            }
            setModalOpen(false);
        } catch (error) {
            console.error('Failed to save asset', error);
        }
    };

    const deleteAsset = async (row) => {
        if (!window.confirm(`Delete asset ${row.assetCode}?`)) return;
        try {
            await assetService.deleteInventory(row.id);
            setInventory(prev => prev.filter(item => item.id !== row.id));
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
        } catch (error) {
            console.error('Failed to update maintenance schedule', error);
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
                    {activeTab === 'inventory' && 'Asset Inventory'}
                    {activeTab === 'category' && 'Category Assets'}
                    {activeTab === 'stock' && 'Stock Management'}
                    {activeTab === 'maintenance' && 'Maintenance & Service Tracking'}
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
            {renderTopBar()}

            <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sectionTabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                height: 38,
                                padding: '0 14px',
                                borderRadius: 999,
                                border: `1px solid ${active ? '#0f172a' : '#cbd5e1'}`,
                                background: active ? '#0f172a' : '#fff',
                                color: active ? '#fff' : '#0f172a',
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
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {activeTab === 'inventory' && (
                    <>
                        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ height: 38, minWidth: 160, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px' }}>
                            {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: 38, minWidth: 160, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px' }}>
                            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <select value={assetType} onChange={(e) => setAssetType(e.target.value)} style={{ height: 38, minWidth: 160, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '0 10px' }}>
                            {assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </>
                )}
                {activeTab === 'stock' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.keys(stockItems).map(group => {
                            const active = selectedStockGroup === group;
                            return (
                                <button key={group} onClick={() => setSelectedStockGroup(group)} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: `1px solid ${active ? '#0f172a' : '#cbd5e1'}`, background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#0f172a', fontWeight: 800 }}>
                                    {group}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 20 }}>
                {activeTab === 'inventory' && (
                    <TableShell>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1800 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['SL No', 'Asset Code', 'Computer Name', 'User Name', 'Department', 'Email ID', 'Mobile Number', 'IP ADDRESS', 'MAKE', 'MODEL', 'CPU', 'RAM', 'HDD and Type', 'OS', 'Status', 'Remarks', 'Maintenance', 'Actions'].map(head => (
                                            <th key={head} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {canEdit && newInventoryRows.map((row, draftIndex) => (
                                        <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{draftIndex + 1}</td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.assetCode} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, assetCode: e.target.value } : r))} placeholder="Asset code" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.computerName} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, computerName: e.target.value } : r))} placeholder="Computer" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.userName} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, userName: e.target.value } : r))} placeholder="User" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.department} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, department: e.target.value } : r))} placeholder="Department" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.emailId} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, emailId: e.target.value } : r))} placeholder="Email" style={{ width: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.mobileNumber} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, mobileNumber: e.target.value } : r))} placeholder="Mobile" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.ipAddress} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, ipAddress: e.target.value } : r))} placeholder="IP" style={{ width: 110, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.make} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, make: e.target.value } : r))} placeholder="Make" style={{ width: 100, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.model} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, model: e.target.value } : r))} placeholder="Model" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.cpu} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, cpu: e.target.value } : r))} placeholder="CPU" style={{ width: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.ram} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, ram: e.target.value } : r))} placeholder="RAM" style={{ width: 90, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.hddType} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, hddType: e.target.value } : r))} placeholder="HDD" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.os} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, os: e.target.value } : r))} placeholder="OS" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <select value={row.status} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, status: e.target.value } : r))} style={{ width: 110, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }}>
                                                    <option value="Available">Available</option>
                                                    <option value="In Use">In Use</option>
                                                    <option value="Repair">Repair</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.remarks} onChange={(e) => setNewInventoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, remarks: e.target.value } : r))} placeholder="Remarks" style={{ width: 160, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><Badge value={row.maintenance} /></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => setNewInventoryRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInventory.map((row, index) => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px' }}>{canEdit ? newInventoryRows.length + index + 1 : index + 1}</td>
                                            <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{row.assetCode}</td>
                                            <td style={{ padding: '12px' }}>{row.computerName || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.userName || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.department || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.emailId || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.mobileNumber || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.ipAddress || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.make || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.model || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.cpu || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.ram || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.hddType || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.os || '-'}</td>
                                            <td style={{ padding: '12px' }}><Badge value={row.status} /></td>
                                            <td style={{ padding: '12px', maxWidth: 260 }}>{row.remarks || '-'}</td>
                                            <td style={{ padding: '12px' }}><Badge value={row.maintenance} /></td>
                                            <td style={{ padding: '12px' }}>
                                                {canEdit ? (
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => openEditModal(row)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '6px 10px', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Edit size={14} /> Edit</button>
                                                        <button onClick={() => deleteAsset(row)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '6px 10px', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Trash2 size={14} /> Delete</button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>View only</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {canEdit && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                                <button onClick={() => setNewInventoryRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyInventoryRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Plus size={14} /> ADD ROW
                                </button>
                                {newInventoryRows.length > 0 && (
                                    <button onClick={saveAllNewInventoryRows} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #fdba74', background: '#fff', color: '#ea580c', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <Save size={14} /> Save All
                                    </button>
                                )}
                            </div>
                        )}
                    </TableShell>
                )}

                {activeTab === 'category' && (
                    <TableShell>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['Asset Class', 'Product Name', 'Asset Code', 'Location', 'Department', 'Responsibility', 'Make', 'Model', 'Description', 'Status', 'Last Maintenance', 'Additional Support', 'Remarks', 'Actions'].map(head => (
                                            <th key={head} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {canEdit && newCategoryRows.map(row => (
                                        <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                            <td style={{ padding: '10px 12px' }}><input value={row.assetClass} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, assetClass: e.target.value } : r))} placeholder="Class" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.productName} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, productName: e.target.value } : r))} placeholder="Product" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.assetCode} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, assetCode: e.target.value } : r))} placeholder="Asset code" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.location} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, location: e.target.value } : r))} placeholder="Location" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.department} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, department: e.target.value } : r))} placeholder="Department" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.responsibility} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, responsibility: e.target.value } : r))} placeholder="Responsibility" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.make} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, make: e.target.value } : r))} placeholder="Make" style={{ width: 100, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.model} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, model: e.target.value } : r))} placeholder="Model" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.description} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, description: e.target.value } : r))} placeholder="Description" style={{ width: 180, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <select value={row.status} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, status: e.target.value } : r))} style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }}>
                                                    <option value="Working">Working</option>
                                                    <option value="Not Working">Not Working</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.lastMaintenance} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, lastMaintenance: e.target.value } : r))} placeholder="Last maintenance" style={{ width: 130, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.additionalSupport} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, additionalSupport: e.target.value } : r))} placeholder="Support" style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.remarks} onChange={(e) => setNewCategoryRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, remarks: e.target.value } : r))} placeholder="Remarks" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => setNewCategoryRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {categoryAssets.map(row => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px', fontWeight: 800 }}>{row.assetClass}</td>
                                            <td style={{ padding: '12px' }}>{row.productName}</td>
                                            <td style={{ padding: '12px', fontWeight: 900 }}>{row.assetCode}</td>
                                            <td style={{ padding: '12px' }}>{row.location}</td>
                                            <td style={{ padding: '12px' }}>{row.department}</td>
                                            <td style={{ padding: '12px' }}>{row.responsibility}</td>
                                            <td style={{ padding: '12px' }}>{row.make}</td>
                                            <td style={{ padding: '12px' }}>{row.model}</td>
                                            <td style={{ padding: '12px', maxWidth: 280 }}>{row.description}</td>
                                            <td style={{ padding: '12px' }}><Badge value={row.status} /></td>
                                            <td style={{ padding: '12px' }}>{row.lastMaintenance || '-'}</td>
                                            <td style={{ padding: '12px' }}>{row.additionalSupport || '-'}</td>
                                            <td style={{ padding: '12px', maxWidth: 240 }}>{row.remarks || '-'}</td>
                                            <td style={{ padding: '12px' }}>{canEdit ? <button style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '6px 10px' }}>Edit</button> : <span style={{ color: '#94a3b8', fontSize: 12 }}>View only</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {canEdit && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                                <button onClick={() => setNewCategoryRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyCategoryRow }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Plus size={14} /> ADD ROW
                                </button>
                                {newCategoryRows.length > 0 && (
                                    <button onClick={saveAllNewCategoryRows} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #fdba74', background: '#fff', color: '#ea580c', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <Save size={14} /> Save All
                                    </button>
                                )}
                            </div>
                        )}
                    </TableShell>
                )}

                {activeTab === 'stock' && (
                    <TableShell>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['Item Name', 'Type / Specification', 'Brand', 'Quantity', 'Status', 'Remarks'].map(head => (
                                            <th key={head} style={{ textAlign: 'left', padding: '14px 12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 900, color: '#334155', borderBottom: '1px solid #dbe3ea' }}>{head}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {canEdit && newStockRows.map(row => (
                                        <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                            <td style={{ padding: '10px 12px' }}><input value={row.itemName} onChange={(e) => setNewStockRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, itemName: e.target.value } : r))} placeholder="Item" style={{ width: 180, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.type} onChange={(e) => setNewStockRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, type: e.target.value } : r))} placeholder="Specification" style={{ width: 180, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}><input value={row.brand} onChange={(e) => setNewStockRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, brand: e.target.value } : r))} placeholder="Brand" style={{ width: 140, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px', width: 160 }}><input type="number" value={row.quantity} onChange={(e) => setNewStockRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, quantity: Number(e.target.value) } : r))} placeholder="Qty" style={{ width: 100, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <select value={row.status} onChange={(e) => setNewStockRows(prev => prev.map(r => r.tempId === row.tempId ? { ...r, status: e.target.value } : r))} style={{ width: 120, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }}>
                                                    <option value="New">New</option>
                                                    <option value="Used">Used</option>
                                                    <option value="Faulty">Faulty</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => setNewStockRows(prev => prev.filter(r => r.tempId !== row.tempId))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(stockItems[selectedStockGroup] || []).map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px', fontWeight: 800 }}>{item.itemName}</td>
                                            <td style={{ padding: '12px' }}>{item.type}</td>
                                            <td style={{ padding: '12px' }}>{item.brand}</td>
                                            <td style={{ padding: '12px', width: 160 }}>
                                                {canEdit ? (
                                                    <input
                                                        type="number"
                                                        value={editingQuantity?.group === selectedStockGroup && editingQuantity?.id === item.id ? editingQuantity.value : item.quantity}
                                                        onChange={(e) => setEditingQuantity({ group: selectedStockGroup, id: item.id, value: e.target.value })}
                                                        onBlur={() => {
                                                            if (editingQuantity && editingQuantity.group === selectedStockGroup && editingQuantity.id === item.id) {
                                                                updateStockQty(selectedStockGroup, item.id, editingQuantity.value);
                                                                setEditingQuantity(null);
                                                            }
                                                        }}
                                                        style={{ width: 100, height: 34, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 10px' }}
                                                    />
                                                ) : item.quantity}
                                            </td>
                                            <td style={{ padding: '12px' }}><Badge value={item.status} /></td>
                                            <td style={{ padding: '12px' }}>{item.quantity <= 2 ? <span style={{ color: '#d97706', fontWeight: 700 }}>Low stock</span> : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {canEdit && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                                <button onClick={() => setNewStockRows(prev => [...prev, { tempId: Date.now() + Math.random(), ...emptyStockRow, sectionName: selectedStockGroup || 'Uncategorized' }])} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <Plus size={14} /> ADD ROW
                                </button>
                                {newStockRows.length > 0 && (
                                    <button onClick={saveAllNewStockRows} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #fdba74', background: '#fff', color: '#ea580c', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <Save size={14} /> Save All
                                    </button>
                                )}
                            </div>
                        )}
                    </TableShell>
                )}

                {activeTab === 'maintenance' && (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {serviceSchedules.map(schedule => {
                            const isExpanded = expandedScheduleIds.includes(schedule.id);
                            return (
                                <div key={schedule.id} style={{ border: '1px solid #dbe3ea', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
                                    <button
                                        onClick={() => setExpandedScheduleIds(prev => prev.includes(schedule.id) ? prev.filter(id => id !== schedule.id) : [...prev, schedule.id])}
                                        style={{ width: '100%', padding: '16px 18px', background: '#f8fafc', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, color: '#0f172a' }}
                                    >
                                        <span>{schedule.assetName} | {schedule.assetCode} | {schedule.location}</span>
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </button>
                                    {isExpanded && (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                                                <thead>
                                                    <tr>
                                                        {['Year', 'Month Range', 'Planned Date', 'Actual Date', 'Status'].map(head => (
                                                            <th key={head} style={{ textAlign: 'left', padding: '12px', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{head}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {canEdit && (newScheduleRowsById[schedule.id] || []).map(row => (
                                                        <tr key={row.tempId} style={{ borderBottom: '1px solid #ffedd5', background: '#fff7ed' }}>
                                                            <td style={{ padding: '12px' }}><input value={row.year} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, year: e.target.value } : r) }))} placeholder="Year" style={{ width: 90, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                                            <td style={{ padding: '12px' }}><input value={row.monthRange} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, monthRange: e.target.value } : r) }))} placeholder="Month range" style={{ width: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                                            <td style={{ padding: '12px' }}><input value={row.plannedDate} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, plannedDate: e.target.value } : r) }))} placeholder="Planned" style={{ width: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                                            <td style={{ padding: '12px' }}><input value={row.actualDate} onChange={(e) => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].map(r => r.tempId === row.tempId ? { ...r, actualDate: e.target.value } : r) }))} placeholder="Actual" style={{ width: 150, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 8px' }} /></td>
                                                            <td style={{ padding: '12px' }}>
                                                                <div style={{ display: 'flex', gap: 6 }}>
                                                                    <button onClick={() => setNewScheduleRowsById(prev => ({ ...prev, [schedule.id]: prev[schedule.id].filter(r => r.tempId !== row.tempId) }))} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {schedule.rows.map((row, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                            <td style={{ padding: '12px' }}>{row.year}</td>
                                                            <td style={{ padding: '12px' }}>{row.monthRange}</td>
                                                            <td style={{ padding: '12px' }}>{row.plannedDate}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                {canEdit ? (
                                                                    <input
                                                                        value={row.actualDate}
                                                                        onChange={(e) => updateScheduleRow(schedule.id, idx, { actualDate: e.target.value })}
                                                                        placeholder="Enter actual date"
                                                                        style={{ width: 160, height: 34, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 10px' }}
                                                                    />
                                                                ) : (row.actualDate || '-')}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <Badge value={row.actualDate ? 'Completed' : (row.status || 'Pending')} />
                                                                {canEdit && (
                                                                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                                                        <button onClick={() => updateScheduleRow(schedule.id, idx, { status: 'Completed' })} style={{ border: '1px solid #fdba74', background: '#fff', borderRadius: 8, padding: '5px 8px', color: '#ea580c' }}>Complete</button>
                                                                        <button onClick={() => updateScheduleRow(schedule.id, idx, { status: 'Issue' })} style={{ border: '1px solid #fecaca', background: '#fff', borderRadius: 8, padding: '5px 8px', color: '#dc2626' }}>Issue</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {canEdit && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: '1px solid #dbe3ea', background: '#f8fafc' }}>
                                                    <button
                                                        onClick={() => setNewScheduleRowsById((prev) => ({
                                                            ...prev,
                                                            [schedule.id]: [...(prev[schedule.id] || []), { tempId: Date.now() + Math.random(), year: '', monthRange: '', plannedDate: '', actualDate: '', status: 'Pending' }]
                                                        }))}
                                                        style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                                                    >
                                                        <Plus size={14} /> ADD ROW
                                                    </button>
                                                    {(newScheduleRowsById[schedule.id] || []).length > 0 && (
                                                        <button onClick={() => saveAllNewScheduleRows(schedule.id)} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #fdba74', background: '#fff', color: '#ea580c', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                            <Save size={14} /> Save All
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div style={{ border: '1px solid #dbe3ea', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 18px', background: '#f8fafc', fontWeight: 900, color: '#0f172a' }}>Air Conditioner Checklist</div>
                            <div style={{ padding: 18 }}>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {checklistItems.map((item, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: 10 }}>
                                            <div style={{ fontSize: 14, color: '#0f172a' }}>{idx + 1}. {item}</div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {['OK', 'NOT OK', 'N/A'].map(choice => (
                                                    <label key={choice} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#334155' }}>
                                                        <input type="radio" name={`check-${idx}`} defaultChecked={choice === 'N/A'} /> {choice}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 18, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                                    <input placeholder="Vendor Name" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }} />
                                    <input placeholder="Location" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }} />
                                    <input placeholder="Conducted Date" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }} />
                                    <input placeholder="Time" style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }} />
                                    <textarea placeholder="Overall comment / cost of air conditioner maintenance" rows={4} style={{ gridColumn: '1 / -1', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {modalOpen && canEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}>
                    <div style={{ width: 'min(1120px, 100%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 20px 60px rgba(107,114,128,0.4)' }}>
                        <div style={{ padding: 18, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Asset Form</div>
                                <h3 style={{ margin: '4px 0 0 0' }}>{editingRow ? 'Edit Asset' : 'Add Asset'}</h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}><X size={18} /></button>
                        </div>

                        <div style={{ padding: 18, display: 'grid', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                                {['assetCode', 'computerName', 'userName', 'department', 'emailId', 'mobileNumber', 'ipAddress', 'make', 'model', 'cpu', 'ram', 'hddType', 'os'].map(key => (
                                    <input
                                        key={key}
                                        value={formData[key] || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={key}
                                        style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }}
                                    />
                                ))}
                                <select value={formData.assetType} onChange={(e) => setFormData(prev => ({ ...prev, assetType: e.target.value }))} style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }}>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Server">Server</option>
                                </select>
                                <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} style={{ height: 38, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px' }}>
                                    <option value="Available">Available</option>
                                    <option value="In Use">In Use</option>
                                    <option value="Repair">Repair</option>
                                </select>
                            </div>

                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                placeholder="Remarks"
                                rows={4}
                                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12 }}
                            />
                        </div>

                        <div style={{ padding: 18, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setModalOpen(false)} style={{ height: 38, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}>Cancel</button>
                            <button onClick={saveAsset} style={{ height: 38, padding: '0 14px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}