import { AssetAPI } from './api';

export const checklistItems = [
    'Check and adjust thermostat.',
    'Check the condenser coil to determine if it needs cleaning.',
    'Check all wiring and connections to controls and electrical connections.',
    'Check blower belt wear, tension and adjust.',
    'Check voltage and amperage draw on all motors with meter.',
    'Check compressor contactor.',
    'Visually inspect compressor and check amp draw.',
    'Check start capacitor and potential relay.',
    'Check pressure switch cut-out setting.',
    'Replace air filter or clean reusable type filter.',
    'Check refrigerant (Gas) level and advise if adjustments necessary.',
    'Check condensate drain and pan then advise of any discrepancies.'
];

export const assetService = {
    async getDashboard() {
        const { data } = await AssetAPI.getDashboard();
        return data;
    },

    async getInventory() {
        const { data } = await AssetAPI.getInventory();
        return data || [];
    },

    async createInventory(payload) {
        const { data } = await AssetAPI.createInventory(payload);
        return data;
    },

    async updateInventory(id, payload) {
        const { data } = await AssetAPI.updateInventory(id, payload);
        return data;
    },

    async deleteInventory(id) {
        await AssetAPI.deleteInventory(id);
    },

    async getCategoryAssets() {
        const { data } = await AssetAPI.getCategoryAssets();
        return data || [];
    },

    async createCategoryAsset(payload) {
        const { data } = await AssetAPI.createCategoryAsset(payload);
        return data;
    },

    async updateCategoryAsset(id, payload) {
        const { data } = await AssetAPI.updateCategoryAsset(id, payload);
        return data;
    },

    async getStockItems() {
        const { data } = await AssetAPI.getStockItems();
        return data || [];
    },

    async createStockItem(payload) {
        const { data } = await AssetAPI.createStockItem(payload);
        return data;
    },

    async updateStockItem(id, payload) {
        const { data } = await AssetAPI.updateStockItem(id, payload);
        return data;
    },

    async getSchedules() {
        const { data } = await AssetAPI.getSchedules();
        return data || [];
    },

    async createSchedule(payload) {
        const { data } = await AssetAPI.createSchedule(payload);
        return data;
    },

    async updateSchedule(id, payload) {
        const { data } = await AssetAPI.updateSchedule(id, payload);
        return data;
    },

    async getChecklists() {
        const { data } = await AssetAPI.getChecklists();
        return data || [];
    },

    async getDynamicData(tabId) {
        const { data } = await AssetAPI.getDynamicData(tabId);
        return data;
    },

    async saveDynamicData(payload) {
        const { data } = await AssetAPI.saveDynamicData(payload);
        return data;
    },

    async getAllLogs() {
        const { data } = await AssetAPI.getAllLogs();
        return data || [];
    },

    async getLogsByTable(table) {
        const { data } = await AssetAPI.getLogsByTable(table);
        return data || [];
    },

    async getLogsByRecordId(id) {
        const { data } = await AssetAPI.getLogsByRecordId(id);
        return data || [];
    },

    async addLog(payload) {
        const { data } = await AssetAPI.addLog(payload);
        return data;
    }
};
