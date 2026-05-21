import sys

def main():
    with open('../src/pages/assets/AssetManagementDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # The tabs definition
    old_tabs = r"""const tabs = [
        { id: 'inventory', label: 'Asset Inventory', icon: Monitor },
        { id: 'category', label: 'Category Assets', icon: Box },
        { id: 'stock', label: 'Stock Management', icon: HardDrive },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench }
    ];"""
    new_tabs = r"""const tabs = [
        { id: 'inventory', label: 'Asset Inventory', icon: Monitor },
        { id: 'server', label: 'Server', icon: Server },
        { id: 'it_asset', label: 'IT Asset', icon: Laptop },
        { id: 'fixtures', label: 'Fixtures', icon: Box },
        { id: 'stock_maintenance', label: 'Stock Maintenance', icon: HardDrive },
        { id: 'noc_team', label: 'NOC Team Asset', icon: Shield },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench }
    ];"""
    content = content.replace(old_tabs, new_tabs)
    
    # 1. We replace empty objects
    content = content.replace('const emptyCategoryRow = {', 'const emptyItAssetRow = {')
    
    empty_stock_row = r"""const emptyStockRow = {
        itemName: '',
        type: '',
        brand: '',
        quantity: 0,
        status: 'New'
    };"""
    new_empty_rows = r"""
    const emptyServerRow = { assetCode: '', computerName: '', userName: '', department: '', ipAddress: '', make: '', model: '', cpu: '', ram: '', hddType: '', os: '', remarks: '' };
    const emptyFixtureRow = { assetClass: '', productName: '', assetCode: '', user: '', department: '', responsibility: '', make: '', model: '', description: '', status: 'Working' };
    const emptyStockMaintRow = { typeInfo: '', name: '', capacity: '', materials: '', brand: '', qty: 0 };
    const emptyNocSafetyRow = { particulers: '', brand: '', qty: 0 };
    const emptyNocOtherRow = { name: '', using: '', stock: '' };
    """
    content = content.replace(empty_stock_row, empty_stock_row + new_empty_rows)

    with open('../src/pages/assets/AssetManagementDashboard_mod2.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
