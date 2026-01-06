// Item Management System for SONIC COMPANY

let currentEditingItemId = null;
let itemsToDelete = null;

// Initialize the items page
document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    updateStatistics();
    setupEventListeners();
    populateItemNamesList();
    
    // Create sample service items if none exist
    createSampleServiceItems();
});

// Function to create sample service items
function createSampleServiceItems() {
    const items = getAllItems();
    const hasServiceItems = items.some(item => item.itemType === 'service');
    
    if (!hasServiceItems) {
        const sampleServices = [
            {
                barcode: 'SVC001',
                name: 'Diagnostics Fee',
                itemType: 'service',
                category: 'Service',
                supplier: 'Internal',
                purchasePrice: 0,
                retailPrice: 15.00,
                stockQuantity: 0,
                minStockLevel: 0,
                description: 'Basic device diagnostics and troubleshooting'
            },
            {
                barcode: 'SVC002',
                name: 'Screen Replacement - iPhone',
                itemType: 'service',
                category: 'Service',
                supplier: 'Internal',
                purchasePrice: 0,
                retailPrice: 80.00,
                stockQuantity: 0,
                minStockLevel: 0,
                description: 'iPhone screen replacement service'
            },
            {
                barcode: 'SVC003',
                name: 'Battery Replacement',
                itemType: 'service',
                category: 'Service',
                supplier: 'Internal',
                purchasePrice: 0,
                retailPrice: 30.00,
                stockQuantity: 0,
                minStockLevel: 0,
                description: 'Device battery replacement service'
            },
            {
                barcode: 'SVC004',
                name: 'Laptop Repair',
                itemType: 'service',
                category: 'Service',
                supplier: 'Internal',
                purchasePrice: 0,
                retailPrice: 50.00,
                stockQuantity: 0,
                minStockLevel: 0,
                description: 'General laptop repair and maintenance'
            },
            {
                barcode: 'SVC005',
                name: 'TV Repair',
                itemType: 'service',
                category: 'Service',
                supplier: 'Internal',
                purchasePrice: 0,
                retailPrice: 60.00,
                stockQuantity: 0,
                minStockLevel: 0,
                description: 'Television repair and maintenance service'
            }
        ];
        
        sampleServices.forEach(service => {
            addItem(service);
        });
        
        // Reload items to show the new service items
        loadItems();
        updateStatistics();
        
        console.log('Sample service items created');
    }
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-items').addEventListener('input', function(e) {
        filterItems(e.target.value);
    });
    
    // Item name search functionality
    document.getElementById('item-name-search').addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim();
        if (searchTerm.length > 0) {
            filterItemsByName(searchTerm);
        } else {
            loadItems(); // Show all items if search is cleared
        }
    });
    
    // Form submission
    document.getElementById('item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('item-modal');
        const deleteModal = document.getElementById('delete-modal');
        if (e.target === modal) {
            closeItemModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

// Function to toggle service-related fields
function toggleServiceFields() {
    const itemType = document.getElementById('item-type').value;
    const stockFields = document.getElementById('stock-fields');
    const minStockFields = document.getElementById('min-stock-fields');
    const stockInput = document.getElementById('item-stock');
    const minStockInput = document.getElementById('item-min-stock');
    
    if (itemType === 'service') {
        // Hide stock fields for services
        stockFields.style.display = 'none';
        minStockFields.style.display = 'none';
        
        // Set default values for services (no stock tracking)
        stockInput.value = 0;
        minStockInput.value = 0;
        stockInput.removeAttribute('required');
        
        // Update category to Service if not already set
        const categorySelect = document.getElementById('item-category');
        if (categorySelect.value !== 'Service') {
            categorySelect.value = 'Service';
        }
    } else {
        // Show stock fields for physical products
        stockFields.style.display = 'flex';
        minStockFields.style.display = 'flex';
        stockInput.setAttribute('required', 'required');
    }
}

function loadItems() {
    const items = getAllItems();
    const tbody = document.getElementById('items-tbody');
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No items found. Click "Add New Item" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.barcode}</strong></td>
            <td>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${item.description || 'No description'}</div>
                <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                    <span style="background: ${item.itemType === 'service' ? '#dbeafe' : '#f3f4f6'}; color: ${item.itemType === 'service' ? '#1e40af' : '#374151'}; padding: 2px 6px; border-radius: 8px; font-weight: 500;">
                        ${item.itemType === 'service' ? '🔧 Service' : '📦 Product'}
                    </span>
                </div>
            </td>
            <td>
                <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${item.category}
                </span>
            </td>
            <td>${formatCurrency(item.purchasePrice)}</td>
            <td><strong>${formatCurrency(item.retailPrice)}</strong></td>
            <td>
                ${item.itemType === 'service' ? 
                    '<span style="color: #6b7280; font-style: italic;">N/A</span>' :
                    `<span class="${item.stockQuantity <= item.minStockLevel ? 'stock-low' : 'stock-ok'}">
                        ${item.stockQuantity}
                    </span>
                    ${item.stockQuantity <= item.minStockLevel ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px; color: #ef4444;"></i>' : ''}`
                }
            </td>
            <td>
                ${item.itemType === 'service' ? 
                    '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Service</span>' :
                    (item.stockQuantity <= item.minStockLevel ? 
                        '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Low Stock</span>' :
                        '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">In Stock</span>'
                    )
                }
            </td>
            <td>
                <button class="btn btn-primary" onclick="editItem(${item.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="showDeleteModal(${item.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterItems(query) {
    const items = query ? searchItems(query) : getAllItems();
    const tbody = document.getElementById('items-tbody');
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No items found matching "${query}"
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.barcode}</strong></td>
            <td>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${item.description || 'No description'}</div>
                <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                    <span style="background: ${item.itemType === 'service' ? '#dbeafe' : '#f3f4f6'}; color: ${item.itemType === 'service' ? '#1e40af' : '#374151'}; padding: 2px 6px; border-radius: 8px; font-weight: 500;">
                        ${item.itemType === 'service' ? '🔧 Service' : '📦 Product'}
                    </span>
                </div>
            </td>
            <td>
                <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${item.category}
                </span>
            </td>
            <td>${formatCurrency(item.purchasePrice)}</td>
            <td><strong>${formatCurrency(item.retailPrice)}</strong></td>
            <td>
                ${item.itemType === 'service' ? 
                    '<span style="color: #6b7280; font-style: italic;">N/A</span>' :
                    `<span class="${item.stockQuantity <= item.minStockLevel ? 'stock-low' : 'stock-ok'}">
                        ${item.stockQuantity}
                    </span>
                    ${item.stockQuantity <= item.minStockLevel ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px; color: #ef4444;"></i>' : ''}`
                }
            </td>
            <td>
                ${item.itemType === 'service' ? 
                    '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Service</span>' :
                    (item.stockQuantity <= item.minStockLevel ? 
                        '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Low Stock</span>' :
                        '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">In Stock</span>'
                    )
                }
            </td>
            <td>
                <button class="btn btn-primary" onclick="editItem(${item.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="showDeleteModal(${item.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter items by name specifically
function filterItemsByName(nameQuery) {
    const items = getAllItems();
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(nameQuery.toLowerCase())
    );
    
    const tbody = document.getElementById('items-tbody');
    
    if (filteredItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No items found with name containing "${nameQuery}"
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredItems.map(item => `
        <tr>
            <td><strong>${item.barcode}</strong></td>
            <td>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${item.description || 'No description'}</div>
                <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                    <span style="background: ${item.itemType === 'service' ? '#dbeafe' : '#f3f4f6'}; color: ${item.itemType === 'service' ? '#1e40af' : '#374151'}; padding: 2px 6px; border-radius: 8px; font-weight: 500;">
                        ${item.itemType === 'service' ? '🔧 Service' : '📦 Product'}
                    </span>
                </div>
            </td>
            <td>
                <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                    ${item.category}
                </span>
            </td>
            <td>${formatCurrency(item.purchasePrice)}</td>
            <td><strong>${formatCurrency(item.retailPrice)}</strong></td>
            <td>
                ${item.itemType === 'service' ? 
                    '<span style="color: #6b7280; font-style: italic;">N/A</span>' :
                    `<span class="${item.stockQuantity <= item.minStockLevel ? 'stock-low' : 'stock-ok'}">
                        ${item.stockQuantity}
                    </span>
                    ${item.stockQuantity <= item.minStockLevel ? '<i class="fas fa-exclamation-triangle" style="margin-left: 5px; color: #ef4444;"></i>' : ''}`
                }
            </td>
            <td>
                ${item.itemType === 'service' ? 
                    '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Service</span>' :
                    (item.stockQuantity <= item.minStockLevel ? 
                        '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Low Stock</span>' :
                        '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">In Stock</span>'
                    )
                }
            </td>
            <td>
                <button class="btn btn-primary" onclick="editItem(${item.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="showDeleteModal(${item.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Populate the item names datalist for autocomplete
function populateItemNamesList() {
    const items = getAllItems();
    const datalist = document.getElementById('item-names-list');
    
    if (datalist) {
        // Clear existing options
        datalist.innerHTML = '';
        
        // Add unique item names to datalist
        const uniqueNames = [...new Set(items.map(item => item.name))];
        uniqueNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
        });
        
        console.log(`Populated item names list with ${uniqueNames.length} unique names`);
    }
}

function updateStatistics() {
    const items = getAllItems();
    const lowStockItems = getLowStockItems();
    
    // Get unique categories
    const categories = new Set(items.map(item => item.category));
    
    document.getElementById('total-items').textContent = items.length;
    document.getElementById('low-stock-items').textContent = lowStockItems.length;
    document.getElementById('categories').textContent = categories.size;
}

function openAddItemModal() {
    currentEditingItemId = null;
    document.getElementById('modal-title').textContent = 'Add New Item';
    document.getElementById('item-form').reset();
    
    // Reset item type to product and show stock fields
    document.getElementById('item-type').value = 'product';
    toggleServiceFields();
    
    document.getElementById('item-modal').style.display = 'block';
}

function editItem(itemId) {
    const item = getItem(itemId);
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }
    
    currentEditingItemId = itemId;
    document.getElementById('modal-title').textContent = 'Edit Item';
    
    // Populate form with item data
    document.getElementById('item-barcode').value = item.barcode;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-type').value = item.itemType || 'product';
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-supplier').value = item.supplier || '';
    document.getElementById('item-purchase-price').value = item.purchasePrice;
    document.getElementById('item-retail-price').value = item.retailPrice;
    document.getElementById('item-stock').value = item.stockQuantity;
    document.getElementById('item-min-stock').value = item.minStockLevel;
    document.getElementById('item-description').value = item.description || '';
    
    // Toggle service fields based on item type
    toggleServiceFields();
    
    document.getElementById('item-modal').style.display = 'block';
}

function closeItemModal() {
    document.getElementById('item-modal').style.display = 'none';
    currentEditingItemId = null;
}

function saveItem() {
    const formData = {
        barcode: document.getElementById('item-barcode').value.trim(),
        name: document.getElementById('item-name').value.trim(),
        itemType: document.getElementById('item-type').value,
        category: document.getElementById('item-category').value,
        supplier: document.getElementById('item-supplier').value.trim(),
        purchasePrice: parseFloat(document.getElementById('item-purchase-price').value),
        retailPrice: parseFloat(document.getElementById('item-retail-price').value),
        stockQuantity: parseInt(document.getElementById('item-stock').value) || 0,
        minStockLevel: parseInt(document.getElementById('item-min-stock').value) || 0,
        description: document.getElementById('item-description').value.trim()
    };
    
    // Validation - Only essential fields required (barcode is optional)
    if (!formData.name || formData.purchasePrice < 0 || formData.retailPrice < 0) {
        showNotification('Please fill in required fields: Name and Prices', 'error');
        return;
    }
    
    // Generate a unique barcode if not provided
    if (!formData.barcode || formData.barcode.trim() === '') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        formData.barcode = `AUTO-${timestamp}-${random}`;
    }
    
    // Check for duplicate barcode (only if barcode is provided and for new items or when barcode is changed)
    if (formData.barcode && (!currentEditingItemId || formData.barcode !== getItem(currentEditingItemId).barcode)) {
        const existingItems = getAllItems();
        if (existingItems.some(item => item.barcode === formData.barcode && item.id !== currentEditingItemId)) {
            showNotification('An item with this barcode already exists', 'error');
            return;
        }
    }
    
    try {
        if (currentEditingItemId) {
            // Update existing item
            updateItem(currentEditingItemId, formData);
            showNotification('Item updated successfully', 'success');
        } else {
            // Add new item
            addItem(formData);
            showNotification('Item added successfully', 'success');
        }
        
        loadItems();
        updateStatistics();
        populateItemNamesList(); // Refresh the item names list
        closeItemModal();
        
        // Direct inventory sync - create inventory entry immediately
        createInventoryEntryForItem(formData);
        
        // Also call the sync functions as backup
        if (typeof window.syncInventoryWithItems === 'function') {
            window.syncInventoryWithItems();
        }
        
        if (typeof window.forceSyncAllItems === 'function') {
            // Triggering force sync for new item
            window.forceSyncAllItems();
        }
        
        // Refresh activity pages
        if (typeof window.refreshActivityPage === 'function') {
            window.refreshActivityPage();
        }
        if (typeof window.refreshActivityTotalPage === 'function') {
            window.refreshActivityTotalPage();
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Error saving item', 'error');
    }
}

function showDeleteModal(itemId) {
    const item = getItem(itemId);
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }
    
    itemsToDelete = itemId;
    document.getElementById('delete-modal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    itemsToDelete = null;
}

function confirmDeleteItem() {
    if (itemsToDelete) {
        try {
            // Call the actual delete function from shared.js
            const success = window.deleteItem(itemsToDelete);
            if (success) {
            showNotification('Item deleted successfully', 'success');
            loadItems();
            updateStatistics();
            populateItemNamesList(); // Refresh the item names list
            closeDeleteModal();
            
            // Sync with inventory
            if (typeof window.syncInventoryWithItems === 'function') {
                window.syncInventoryWithItems();
            }
            
            // Force sync to ensure changes are properly applied
            if (typeof window.forceSyncAllItems === 'function') {
                window.forceSyncAllItems();
            }
            
            // Refresh activity pages
            if (typeof window.refreshActivityPage === 'function') {
                window.refreshActivityPage();
            }
            if (typeof window.refreshActivityTotalPage === 'function') {
                window.refreshActivityTotalPage();
            }
            } else {
                showNotification('Error deleting item', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('Error deleting item', 'error');
        }
    }
}

// Show notification function
function showNotification(message, type = 'info', duration = 3000) {
    try {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add some basic styling
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to alert
        alert(message);
    }
}

// Export functions for use in other modules
window.loadItems = loadItems;
window.updateStatistics = updateStatistics;
window.openAddItemModal = openAddItemModal;
window.editItem = editItem;
window.closeItemModal = closeItemModal;
window.saveItem = saveItem;
window.toggleServiceFields = toggleServiceFields;
window.filterItemsByName = filterItemsByName;
window.populateItemNamesList = populateItemNamesList;
// Create inventory entry directly for a new item
function createInventoryEntryForItem(itemData) {
    try {
        console.log('Creating inventory entry for item:', itemData.name);
        
        // Load existing inventory data
        let inventoryData = JSON.parse(localStorage.getItem('sonic_inventory_data') || '[]');
        
        // Check if item already exists in inventory
        const existingInventory = inventoryData.find(inv => 
            inv.sku === itemData.barcode || inv.name === itemData.name
        );
        
        if (!existingInventory) {
            // Create new inventory entry
            const newInventoryItem = {
                id: Date.now() + Math.random(),
                sku: itemData.barcode || `SKU-${Date.now()}`,
                name: itemData.name,
                category: itemData.category || 'General',
                currentStock: itemData.stockQuantity || 0,
                minStock: itemData.minStockLevel || 5,
                maxStock: 100,
                cost: itemData.purchasePrice || 0,
                price: itemData.retailPrice || 0,
                lastUpdated: new Date().toISOString(),
                status: 'in-stock'
            };
            
            // Set status based on stock level
            if (newInventoryItem.currentStock <= 0) {
                newInventoryItem.status = 'out-of-stock';
            } else if (newInventoryItem.currentStock <= newInventoryItem.minStock) {
                newInventoryItem.status = 'low-stock';
            }
            
            // Add to inventory
            inventoryData.push(newInventoryItem);
            
            // Save to localStorage
            localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
            
            console.log(`Created inventory entry: ${itemData.name} with ${newInventoryItem.currentStock} stock`);
            
            // Create initial activity record
            createInitialActivityRecord(newInventoryItem);
            
            showNotification(`Inventory entry created for ${itemData.name}`, 'success');
            
            // Refresh inventory display if the page is open (with small delay to ensure data is saved)
            setTimeout(() => {
                if (typeof window.refreshInventoryDisplay === 'function') {
                    window.refreshInventoryDisplay();
                }
            }, 100);
        } else {
            // Update existing inventory entry
            existingInventory.currentStock = itemData.stockQuantity || existingInventory.currentStock;
            existingInventory.minStock = itemData.minStockLevel || existingInventory.minStock;
            existingInventory.name = itemData.name;
            existingInventory.category = itemData.category || existingInventory.category;
            existingInventory.cost = itemData.purchasePrice || existingInventory.cost;
            existingInventory.price = itemData.retailPrice || existingInventory.price;
            existingInventory.lastUpdated = new Date().toISOString();
            
            // Update status
            if (existingInventory.currentStock <= 0) {
                existingInventory.status = 'out-of-stock';
            } else if (existingInventory.currentStock <= existingInventory.minStock) {
                existingInventory.status = 'low-stock';
            } else {
                existingInventory.status = 'in-stock';
            }
            
            // Save to localStorage
            localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
            
            console.log(`Updated inventory entry: ${itemData.name} with ${existingInventory.currentStock} stock`);
            
            // Refresh inventory display if the page is open (with small delay to ensure data is saved)
            setTimeout(() => {
                if (typeof window.refreshInventoryDisplay === 'function') {
                    window.refreshInventoryDisplay();
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error creating inventory entry:', error);
        showNotification('Error creating inventory entry', 'error');
    }
}

// Create initial activity record for new items
function createInitialActivityRecord(inventoryItem) {
    try {
        const activityData = JSON.parse(localStorage.getItem('sonic_activity_data') || '[]');
        
        // Check if activity record already exists
        const existingActivity = activityData.find(activity => 
            activity.itemName === inventoryItem.name && activity.type === 'initial'
        );
        
        if (!existingActivity) {
            const newActivity = {
                id: Date.now() + Math.random(),
                itemName: inventoryItem.name,
                sku: inventoryItem.sku,
                category: inventoryItem.category,
                type: 'initial',
                quantity: inventoryItem.currentStock,
                price: inventoryItem.price,
                cost: inventoryItem.cost,
                timestamp: new Date().toISOString(),
                description: 'Initial stock entry',
                user: 'System'
            };
            
            activityData.push(newActivity);
            localStorage.setItem('sonic_activity_data', JSON.stringify(activityData));
            console.log('Created initial activity record for:', inventoryItem.name);
        }
    } catch (error) {
        console.error('Error creating initial activity record:', error);
    }
}

window.showDeleteModal = showDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteItem = confirmDeleteItem;
window.showNotification = showNotification;
window.createInventoryEntryForItem = createInventoryEntryForItem;

// Import TV Items from CSV
function importTVItemsFromCSV() {
    // CSV data from TV.csv
    const csvData = `SONIC TV ALL MODELS ,,,,,,,,,,,,
#,Item Name,SIZE,description - futures ,  PRICE   ,,,,,,,,
1,"TV 32"" F6000-SMT ",32,32 SMART FRAMELESS - SYSTEM ANDROID , $70.00 ,,,,,,,,
2,"TV 32""F6000 ATV  ",32,32 ATV - FRAMELESS , $60.00 ,,,,,,,,
3,"TV 32""D1700  normal",32,32 ATV - , $60.00 ,,,,,,,,
4,"TV 32""D1700SMT",32,32 SMART - SYSTEM ANDROID , $70.00 ,,,,,,,,
5,"TV 32""D22SMT/TG",32,32 SMART -DOUBLE  GLASS , $75.00 ,,,,,,,,
6,"TV 42""F4000SMT ANDROID 14",42,42 SMART -FRAMELESS-   -ANDROID 14 , $125.00 ,,,,,,,,
7,"TV 42""T6000SMT ANDROID 14",42,42 SMART -ANDROID 14 -FRAMELESS -DOUBLE GLASS, $130.00 ,,,,,,,,
8,"TV 43""LJ50 (S2+T2)",43,43 DTV - DIGITAL + SATELITE , $110.00 ,,,,,,,,
9,"TV 50""LJ40 ATV ",50,50 - ATV , $150.00 ,,,,,,,,
10,"TV 50""T8000SMT -TG SMART ",50,50- SMART DOUBLE GLASS -FRAMELESS -ANDROID, $190.00 ,,,,,,,,
11,TV 50F8000SMT - ,50,50- SMART -FRAMELESS -ANDROID, $180.00 ,,,,,,,,
12,TV 55''T8000SMT - SMART DOUBLE GLASS,55,55- SMART -FRAMELESS - DOUBLE GLASS -ANDROID, $230.00 ,,,,,,,,
13,"TV 55""F8000SMT ",55,55- SMART -FRAMELESS-ANDROID, $220.00 ,,,,,,,,
14,"TV 55""Q9000SMT-T2/S2  - CURVED",55,55-CURVED TV -SMART +DIGITAL +SATELITE +AIR MOUSE GIFT -ANDROID-, $240.00 ,,,,,,,,
15,TV 65'' Q9000-SMT T2S2 4K,65,65- CURVED TV-4K -SMART +DIGITAL +SATELITE +AIR MOUSE GIFT -ANDROID, $400.00 ,,,,,,,,
16,"TV 43"" SN43WFHD WEBOS ",43,43 - SMART -WebOS SYSTEM + MAGIC MOUSE REMOTE -2K , $150.00 ,,,,,,,,
21,"TV50"" SN50WUHD , WEBOS 4K,S2T2",50,50 - SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $245.00 ,,,,,,,,
17,"TV 55"" SN55WUHD 4K ",55,55- SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $275.00 ,,,,,,,,
18,"TV 65"" SN65WUHD 4K ",65,65 - SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $375.00 ,,,,,,,,
19,"TV 70"" QLED70UHD",70,70-QLED  SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $450.00 ,,,,,,,,
20,"TV 70"" TG70WUHD (Double Glass)",70,70-  Double Glass- SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $451.00 ,,,,,,,,
20,"TV 75"" QLED75UHD",75,75 -QLED  SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $545.00 ,,,,,,,,
20,"TV 85"" QLED85UHD",85,85 - QLED SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -, $845.00 ,,,,,,,,
21,"TV SN98""WUHD 4K SMART ",98,98 - SMART -SATELITE -DIGITAL -WebOS SYSTEM + MAGIC MOUSE REMOTE -4K -," $20,000.00 ",,,,,,,,`;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header rows (first 2 lines)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        if (fields.length >= 5) {
            const itemNumber = fields[0];
            let itemName = fields[1].replace(/""/g, '"').trim();
            const size = fields[2].trim();
            const description = fields[3].trim();
            const priceStr = fields[4].trim();
            
            const price = parsePrice(priceStr);
            
            if (!itemName || price === 0) continue;
            
            const barcode = `TV${String(itemNumber).padStart(3, '0')}`;
            
            const item = {
                barcode: barcode,
                name: itemName,
                description: `${size}" - ${description}`,
                category: 'TV',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100,
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `TV Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importTVItemsFromCSV = importTVItemsFromCSV;

// Import AC Items from CSV
function importACItemsFromCSV() {
    // CSV data from AC.csv
    const csvData = `CATEGORIES,item name ,code or SKU, price  
Wall Mounted SpliT-AC,GNR12K-E 12000BTU,GNR12K-E (1 TON), $200.00 
Wall Mounted SpliT-AC,GNR18K-E 18000BTU,GNR18K-E (1.5TON), $275.00 
Wall Mounted SpliT-AC,GNR24K-E 24000BTU,GNR24K-E (2 TON), $340.00 
Wall Mounted SpliT-AC,SONIC GNR-12K-IT /INVERTER AMP CONTROL 12000BTU ,GNR-12K-IT-T3 - INVERTER (1 TON), $300.00 
Wall Mounted SpliT-AC,SONIC GNR-18K-IT /INVERTER AMP CONTROL  18000BTU,GNR-18K-IT-T3- INVERTER (1.5 TON), $400.00 
Wall Mounted SpliT-AC,SONIC GNR-12K-IT /INVERTER AMP CONTROL -24000BTU,GNR-24K-IT-T3- INVERTER(2 TON), $500.00 
Wall Mounted SpliT-AC,SONIC GNR-30K-EY-30000BTU,GNR-30K-EY, $460.00 
Wall Mounted SpliT-AC,SONIC SNC-24KT3-24000BTU,SNC-24KT3, $370.00 
STANDING SPLIT-AC ,SONIC GNR-30K-FL-30000BTU,GNR-30K-FL, $600.00 `;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header row (first line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data (columns: CATEGORIES, item name, code or SKU, price)
        if (fields.length >= 4) {
            const categoryType = fields[0].trim();
            const itemName = fields[1].trim();
            const sku = fields[2].trim();
            const priceStr = fields[3].trim();
            
            // Parse price
            const price = parsePrice(priceStr);
            
            // Skip if no name, SKU, or price
            if (!itemName || !sku || price === 0) continue;
            
            // Use SKU as barcode
            const barcode = sku;
            
            // Create item object
            const item = {
                barcode: barcode,
                name: itemName,
                description: categoryType || 'Air Conditioner',
                category: 'Air Conditioners',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `AC Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importACItemsFromCSV = importACItemsFromCSV;

// Import BRACKET Items from CSV
function importBracketItemsFromCSV() {
    // CSV data from BRACKET.csv
    const csvData = `model,TV size(INCH), PCS COST 
G70,19 to 32 , $3.00 
E50,40 to 55, $6.00 
LED-SO600 & D40,40 to 55, $8.00 
LED-SO900,40 to 70, $12.00 
LED-SO 94,55 to 85, $17.00 
LED-S0100,40 to 55, $10.00 
LED-NS700,40 to 70, $20.00 `;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header row (first line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data (columns: model, TV size(INCH), PCS COST)
        if (fields.length >= 3) {
            const model = fields[0].trim();
            const tvSize = fields[1].trim();
            const priceStr = fields[2].trim();
            
            // Parse price
            const price = parsePrice(priceStr);
            
            // Skip if no model or price
            if (!model || price === 0) continue;
            
            // Generate barcode from model
            const barcode = `BRK-${model.replace(/\s+/g, '-')}`;
            
            // Create item name
            const itemName = model + (tvSize ? ` - ${tvSize}"` : '');
            
            // Create item object
            const item = {
                barcode: barcode,
                name: itemName,
                description: tvSize ? `TV Bracket for ${tvSize}" TVs` : 'TV Bracket',
                category: 'BRACKET',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `BRACKET Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importBracketItemsFromCSV = importBracketItemsFromCSV;

// Import CHESST FREEZER Items from CSV
function importChestFreezerItemsFromCSV() {
    // CSV data from CHESST FREEZER.csv
    const csvData = `CHESST FREZER,,,,,
CATEGORIES,item name ,code or SKU,size (L),color , wac price  
CHESST FREEZER,14قدم ,BD-301 W,299l,WIHTE, $200.00 
CHESST FREEZER,14قدم ,BD-301 B,299l,BLACK, $210.00 
CHESST FREEZER,14قدم ,BD-301 S,299l,SLIVER, $210.00 
CHESST FREEZER,10قدم ,BD-201 W,199L,white, $160.00 
upright freezer,14قدم,BD-310B,310L,WIHTE, $225.00 `;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header rows (first 2 lines)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data (columns: CATEGORIES, item name, code or SKU, size (L), color, wac price)
        if (fields.length >= 6) {
            const categoryType = fields[0].trim();
            const itemName = fields[1].trim();
            const sku = fields[2].trim();
            const size = fields[3].trim();
            const color = fields[4].trim();
            const priceStr = fields[5].trim();
            
            // Parse price
            const price = parsePrice(priceStr);
            
            // Skip if no name, SKU, or price
            if (!itemName || !sku || price === 0) continue;
            
            // Use SKU as barcode
            const barcode = sku;
            
            // Create item name with size and color
            let fullItemName = itemName;
            if (size) {
                fullItemName += ` ${size}`;
            }
            if (color) {
                fullItemName += ` ${color}`;
            }
            
            // Create description
            let description = '';
            if (size) {
                description += `Size: ${size}`;
            }
            if (color) {
                description += description ? `, Color: ${color}` : `Color: ${color}`;
            }
            if (!description) {
                description = 'Chest Freezer';
            }
            
            // Create item object
            const item = {
                barcode: barcode,
                name: fullItemName,
                description: description,
                category: 'CHESST FREEZER',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `CHESST FREEZER Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importChestFreezerItemsFromCSV = importChestFreezerItemsFromCSV;

// Import TEA MAKER Items from CSV
function importTeaMakerItemsFromCSV() {
    // CSV data from TEA MAKER.csv
    const csvData = `NO.,BARCODE,item ,model number , PCS COST 
1,6527912884534    ,tea maker ,SONIC - SN-W1311 AH, $55.00 
2,6527912884558    ,tea maker ,SONIC- W18TSH, $53.00 
3,652791288454    ,tea maker ,SONIC - W20H , $53.00 
4,6527912884565    ,tea maker ,SN-W1002 B2 , $60.00 `;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header row (first line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data (columns: NO., BARCODE, item, model number, PCS COST)
        if (fields.length >= 5) {
            const no = fields[0].trim();
            const barcode = fields[1].trim();
            const itemName = fields[2].trim();
            const modelNumber = fields[3].trim();
            const priceStr = fields[4].trim();
            
            // Parse price
            const price = parsePrice(priceStr);
            
            // Skip if no barcode, model number, or price
            if (!barcode || !modelNumber || price === 0) continue;
            
            // Create item name from model number
            const fullItemName = modelNumber;
            
            // Create description
            const description = itemName ? `${itemName} - ${modelNumber}` : modelNumber;
            
            // Create item object
            const item = {
                barcode: barcode,
                name: fullItemName,
                description: description,
                category: 'TEA MAKER',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `TEA MAKER Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importTeaMakerItemsFromCSV = importTeaMakerItemsFromCSV;

// Import Vacuum Items from CSV
function importVacuumItemsFromCSV() {
    // CSV data from vacuum.csv
    const csvData = `SONIC vacuum  ALL MODELS ,,
#,Item Name & model, COST PRICE   
1,VACUUM CLEANER 21L, $30.00 
2,mouse vacuum cleaner 2000, $45.00 
3,mouse vacuum cleaner 2400, $55.00 `;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header rows (first 2 lines)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data (columns: #, Item Name & model, COST PRICE)
        if (fields.length >= 3) {
            const itemNumber = fields[0].trim();
            const itemName = fields[1].trim();
            const priceStr = fields[2].trim();
            
            // Parse price
            const price = parsePrice(priceStr);
            
            // Skip if no name or price
            if (!itemName || price === 0) continue;
            
            // Generate barcode from item number
            const barcode = `VAC-${itemNumber.padStart(3, '0')}`;
            
            // Create item object
            const item = {
                barcode: barcode,
                name: itemName,
                description: 'Vacuum Cleaner',
                category: 'Vacuum',
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `Vacuum Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importVacuumItemsFromCSV = importVacuumItemsFromCSV;

// Import Steam Iron Items from CSV
function importSteamIronItemsFromCSV() {
    // CSV data from steam iron.csv
    const csvData = `CATEGORIES,code or SKU, wac price  
STEAM IRON ,SN-4100 , $11.00 
STEAM IRON ,SN-3100, $13.00 
STEAM IRON ,SN-2100 , $15.00 
steam press , SN-4200, $135.00 
steam press, SN-3200, $155.00 `;

    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }

    const lines = csvData.split('\n').filter(line => line.trim());
    const items = [];
    
    // Skip header row (first line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data (columns: CATEGORIES, code or SKU, wac price)
        if (fields.length >= 3) {
            const categoryType = fields[0].trim();
            const sku = fields[1].trim();
            const priceStr = fields[2].trim();
            
            // Parse price
            const price = parsePrice(priceStr);
            
            // Skip if no SKU or price
            if (!sku || price === 0) continue;
            
            // Use SKU as barcode
            const barcode = sku;
            
            // Normalize category
            let category = 'Steam Iron';
            if (categoryType.toLowerCase().includes('steam press')) {
                category = 'Steam Iron'; // Use same category for steam press
            }
            
            // Create item name from SKU
            const itemName = sku;
            
            // Create description
            const description = categoryType || 'Steam Iron';
            
            // Create item object
            const item = {
                barcode: barcode,
                name: itemName,
                description: description,
                category: category,
                supplier: 'SONIC',
                purchasePrice: Math.round(price * 0.7 * 100) / 100, // Estimate 70% of retail as purchase price
                retailPrice: price,
                stockQuantity: 1000,
                minStockLevel: 10,
                itemType: 'product'
            };
            
            items.push(item);
        }
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `Steam Iron Items Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export function to window
window.importSteamIronItemsFromCSV = importSteamIronItemsFromCSV;

// General Excel/CSV Import Function
// Expected format: #, Item Name, Quantity, Category, Sales, Price, Barcode
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
        showNotification('Please select a CSV or Excel file (.csv, .xlsx, .xls)', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    if (isExcel) {
        // Handle Excel files using SheetJS
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get the first worksheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to CSV format
                const csvText = XLSX.utils.sheet_to_csv(worksheet);
                importItemsFromCSV(csvText);
            } catch (error) {
                console.error('Error reading Excel file:', error);
                showNotification('Error reading Excel file. Please ensure it is a valid Excel file.', 'error');
            }
        };
        
        reader.onerror = function() {
            showNotification('Error reading Excel file', 'error');
        };
        
        // Read as array buffer for Excel files
        reader.readAsArrayBuffer(file);
    } else {
        // Handle CSV files
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                importItemsFromCSV(text);
            } catch (error) {
                console.error('Error reading CSV file:', error);
                showNotification('Error reading CSV file. Please ensure it is a valid CSV file.', 'error');
            }
        };
        
        reader.onerror = function() {
            showNotification('Error reading CSV file', 'error');
        };
        
        // Read as text for CSV files
        reader.readAsText(file);
    }
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
}

function importItemsFromCSV(csvText) {
    function parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        return fields;
    }
    
    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        // Remove currency symbols, commas, and whitespace
        const cleaned = priceStr.replace(/[\$,"\s]/g, '').trim();
        return parseFloat(cleaned) || 0;
    }
    
    function parseQuantity(qtyStr) {
        if (!qtyStr) return 0;
        const cleaned = qtyStr.toString().trim();
        return parseInt(cleaned) || 0;
    }
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        showNotification('File is empty', 'error');
        return;
    }
    
    // Find header row - look for columns: #, Item Name, Quantity, Category, Sales, Price, Barcode
    let headerIndex = -1;
    let columnMap = {};
    
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const fields = parseCSVLine(lines[i]);
        const headerLower = fields.map(f => f.toLowerCase().trim());
        
        // Check if this looks like a header row
        const hasNumber = headerLower.some(f => f === '#' || f === 'no' || f === 'no.' || f === 'number');
        const hasItemName = headerLower.some(f => f.includes('item') && f.includes('name'));
        const hasQuantity = headerLower.some(f => f.includes('quantity') || f.includes('qty'));
        const hasCategory = headerLower.some(f => f.includes('category'));
        const hasSales = headerLower.some(f => f.includes('sales') || f.includes('retail'));
        const hasPrice = headerLower.some(f => (f.includes('price') || f.includes('cost')) && !f.includes('sales'));
        const hasBarcode = headerLower.some(f => f.includes('barcode') || f.includes('sku') || f.includes('code'));
        
        if (hasItemName && (hasPrice || hasSales) && hasBarcode) {
            headerIndex = i;
            // Map columns
            fields.forEach((field, index) => {
                const fieldLower = field.toLowerCase().trim();
                if (fieldLower === '#' || fieldLower === 'no' || fieldLower === 'no.' || fieldLower === 'number') {
                    columnMap.number = index;
                } else if (fieldLower.includes('item') && fieldLower.includes('name')) {
                    columnMap.itemName = index;
                } else if (fieldLower.includes('quantity') || fieldLower.includes('qty')) {
                    columnMap.quantity = index;
                } else if (fieldLower.includes('category')) {
                    columnMap.category = index;
                } else if (fieldLower.includes('sales') || fieldLower.includes('retail')) {
                    columnMap.sales = index;
                } else if ((fieldLower.includes('price') || fieldLower.includes('cost')) && !fieldLower.includes('sales')) {
                    columnMap.price = index;
                } else if (fieldLower.includes('barcode') || fieldLower.includes('sku') || (fieldLower.includes('code') && !fieldLower.includes('category'))) {
                    columnMap.barcode = index;
                }
            });
            break;
        }
    }
    
    if (headerIndex === -1) {
        // Try to use first row as header if format matches expected
        const firstRowFields = parseCSVLine(lines[0]);
        if (firstRowFields.length >= 6) {
            headerIndex = 0;
            // Assume standard order: #, Item Name, Quantity, Category, Sales, Price, Barcode
            columnMap = {
                number: 0,
                itemName: 1,
                quantity: 2,
                category: 3,
                sales: 4,
                price: 5,
                barcode: 6
            };
        } else {
            showNotification('Could not find header row. Expected columns: #, Item Name, Quantity, Category, Sales, Price, Barcode', 'error');
            return;
        }
    }
    
    const items = [];
    const startRow = headerIndex + 1;
    
    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = parseCSVLine(line);
        
        // Extract data using column map
        const itemName = fields[columnMap.itemName]?.trim();
        const quantity = parseQuantity(fields[columnMap.quantity]);
        const category = fields[columnMap.category]?.trim() || 'General';
        const salesPrice = parsePrice(fields[columnMap.sales]);
        const purchasePrice = parsePrice(fields[columnMap.price]);
        const barcode = fields[columnMap.barcode]?.trim();
        
        // Skip if essential fields are missing
        if (!itemName || !barcode) {
            continue;
        }
        
        // Use sales as retail price, price as purchase price
        // If sales is not available, use price for both
        const retailPrice = salesPrice || purchasePrice || 0;
        const finalPurchasePrice = purchasePrice || (retailPrice * 0.7); // Estimate 70% if not provided
        
        const item = {
            barcode: barcode,
            name: itemName,
            description: '',
            category: category,
            supplier: 'SONIC',
            purchasePrice: Math.round(finalPurchasePrice * 100) / 100,
            retailPrice: Math.round(retailPrice * 100) / 100,
            stockQuantity: quantity || 0,
            minStockLevel: 10,
            itemType: 'product'
        };
        
        items.push(item);
    }
    
    if (items.length === 0) {
        showNotification('No valid items found in file', 'error');
        return;
    }
    
    // Load existing data
    if (typeof window.loadData === 'function') {
        window.loadData();
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    items.forEach(item => {
        try {
            const existingItems = window.getAllItems ? window.getAllItems() : [];
            const exists = existingItems.some(existing => 
                existing.barcode === item.barcode || existing.name === item.name
            );
            
            if (exists) {
                skipped++;
            } else {
                if (window.addItem) {
                    window.addItem(item);
                    imported++;
                    
                    // Create inventory entry
                    if (typeof window.createInventoryEntryForItem === 'function') {
                        try {
                            window.createInventoryEntryForItem(item);
                        } catch (invError) {
                            console.error(`Error creating inventory entry for ${item.name}:`, invError);
                        }
                    }
                } else {
                    errors++;
                }
            }
        } catch (error) {
            errors++;
            console.error(`Error importing ${item.name}:`, error);
        }
    });
    
    // Refresh display
    if (typeof window.loadItems === 'function') {
        window.loadItems();
    }
    if (typeof window.updateStatistics === 'function') {
        window.updateStatistics();
    }
    
    const message = `Import Complete!\n\nImported: ${imported}\nSkipped (already exist): ${skipped}\nErrors: ${errors}\n\nTotal: ${items.length} items processed`;
    
    if (window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert(message);
    }
    
    console.log('Import Summary:', { imported, skipped, errors, total: items.length });
    
    return { imported, skipped, errors, total: items.length };
}

// Export functions to window
window.handleFileImport = handleFileImport;
window.importItemsFromCSV = importItemsFromCSV;
