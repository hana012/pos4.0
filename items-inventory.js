// Items Inventory Management
let inventoryData = [];
let filteredInventory = [];
let itemsData = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Items Inventory page loaded');
    try {
        // Hide loading indicator
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
        
        loadInventoryData();
        loadItemsData();
        populateFilters();
        filterInventory();
        updateSummaryCards();
        setupEventListeners();
        initializeItemSearch();
        
        // Ensure sync with items data on page load
        if (typeof window.syncInventoryWithItems === 'function') {
            window.syncInventoryWithItems();
        }
        console.log('Items Inventory initialized successfully');
    } catch (error) {
        console.error('Error initializing Items Inventory:', error);
        
        // Hide loading indicator
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Show error message
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        if (errorDiv && errorText) {
            errorText.textContent = error.message || 'Failed to load inventory data';
            errorDiv.style.display = 'block';
        }
        
        showNotification('Error loading inventory. Please refresh.', 'error');
    }
});

// Setup event listeners
function setupEventListeners() {
    try {
        // Stock adjustment form
        const form = document.getElementById('stock-adjustment-form');
        if (form) {
            form.addEventListener('submit', handleStockAdjustment);
        }
        
        // Auto-refresh inventory every 30 seconds
        setInterval(() => {
            try {
                loadInventoryData();
                filterInventory();
                updateSummaryCards();
            } catch (error) {
                console.error('Error in auto-refresh:', error);
            }
        }, 30000);
        
        console.log('Event listeners setup complete');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Load inventory data from localStorage
function loadInventoryData() {
    try {
        const savedData = localStorage.getItem('sonic_inventory_data');
        if (savedData) {
            inventoryData = JSON.parse(savedData);
        } else {
            inventoryData = [];
            console.log('No inventory data found - starting with empty inventory');
        }
        console.log('Inventory data loaded:', inventoryData.length, 'items');
    } catch (error) {
        console.error('Error loading inventory data:', error);
        inventoryData = [];
    }
}

// Load items data to sync with inventory
function loadItemsData() {
    try {
        // Load items from shop data (where items are actually stored)
        const shopData = JSON.parse(localStorage.getItem('sonic_shop_data') || '{}');
        if (shopData.items) {
            itemsData = Object.values(shopData.items);
            
            // Filter out sample data - only keep user-added items
            itemsData = itemsData.filter(item => {
                // Remove sample items (those with ITEM001, ITEM002, etc.)
                if (item.barcode && item.barcode.startsWith('ITEM00')) {
                    return false;
                }
                // Remove sample items by name patterns
                const sampleNames = ['Tablet Computer', 'T-Shirt', 'Apple iPhone', 'Book - Programming Guide', 'Samsung Monitor', 'Tool Set'];
                if (sampleNames.includes(item.name)) {
                    return false;
                }
                return true;
            });
            
            // Sync items with inventory - create inventory entries for all items
            itemsData.forEach(item => {
                const existingInventory = inventoryData.find(inv => 
                    inv.sku === item.sku || inv.name === item.name
                );
                
                if (!existingInventory) {
                    // Add new item to inventory with default stock
                    const newInventoryItem = {
                        id: Date.now() + Math.random(),
                        sku: item.sku || item.barcode || `SKU-${Date.now()}`,
                        name: item.name,
                        category: item.category || 'General',
                        currentStock: item.stockQuantity || item.currentStock || 10, // Default stock
                        minStock: item.minStockLevel || item.minStock || 5,
                        maxStock: item.maxStock || 100,
                        cost: item.cost || item.purchasePrice || 0,
                        price: item.price || item.retailPrice || 0,
                        lastUpdated: new Date().toISOString(),
                        status: 'in-stock'
                    };
                    
                    // Set status based on stock level
                    if (newInventoryItem.currentStock <= 0) {
                        newInventoryItem.status = 'out-of-stock';
                    } else if (newInventoryItem.currentStock <= newInventoryItem.minStock) {
                        newInventoryItem.status = 'low-stock';
                    }
                    
                    inventoryData.push(newInventoryItem);
                } else {
                    // Update existing inventory item with latest item data
                    existingInventory.name = item.name;
                    existingInventory.category = item.category || existingInventory.category;
                    existingInventory.cost = item.cost || item.purchasePrice || existingInventory.cost;
                    existingInventory.price = item.price || item.retailPrice || existingInventory.price;
                    existingInventory.lastUpdated = new Date().toISOString();
                }
            });
            
            // Remove inventory items that no longer exist in items data
            inventoryData = inventoryData.filter(inv => 
                itemsData.some(item => 
                    item.sku === inv.sku || item.name === inv.name
                )
            );
            
            saveInventoryData();
        } else {
            itemsData = [];
        }
        console.log('Items data loaded and synced (sample data filtered):', itemsData.length, 'items');
    } catch (error) {
        console.error('Error loading items data:', error);
        itemsData = [];
    }
}

// Save inventory data to localStorage
function saveInventoryData() {
    try {
        localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
        console.log('Inventory data saved');
    } catch (error) {
        console.error('Error saving inventory data:', error);
    }
}

// Populate filter dropdowns
function populateFilters() {
    try {
        // Populate category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            const categories = [...new Set(inventoryData.map(item => item.category))];
            categoryFilter.innerHTML = '<option value="all">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
        
        console.log('Filters populated');
    } catch (error) {
        console.error('Error populating filters:', error);
    }
}

// Filter inventory based on selected criteria
function filterInventory() {
    try {
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        const stockFilter = document.getElementById('stock-filter')?.value || 'all';
        const searchInput = document.getElementById('search-input')?.value.toLowerCase() || '';
        
        filteredInventory = inventoryData.filter(item => {
            const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
            const stockMatch = stockFilter === 'all' || getStockStatus(item) === stockFilter;
            const searchMatch = searchInput === '' || 
                item.name.toLowerCase().includes(searchInput) ||
                item.sku.toLowerCase().includes(searchInput);
            
            return categoryMatch && stockMatch && searchMatch;
        });
        
        updateInventoryTable();
        console.log('Inventory filtered:', filteredInventory.length, 'items');
    } catch (error) {
        console.error('Error filtering inventory:', error);
        filteredInventory = inventoryData;
        updateInventoryTable();
    }
}

// Get stock status for an item
function getStockStatus(item) {
    if (item.currentStock <= 0) return 'out-of-stock';
    if (item.currentStock <= item.minStock) return 'low-stock';
    return 'in-stock';
}

// Update inventory table display
function updateInventoryTable() {
    try {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) {
            console.error('Inventory tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        filteredInventory.forEach(item => {
            const status = getStockStatus(item);
            const statusClass = status.replace('-', '');
            const lastUpdated = new Date(item.lastUpdated).toLocaleDateString();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.currentStock}</td>
                <td>${item.minStock}</td>
                <td>${item.maxStock}</td>
                <td><span class="stock-status ${statusClass}">${status.replace('-', ' ').toUpperCase()}</span></td>
                <td>${lastUpdated}</td>
                <td>
                    <button onclick="adjustStock('${item.name}', 'restock')" class="btn btn-sm btn-primary">Restock</button>
                    <button onclick="adjustStock('${item.name}', 'adjustment')" class="btn btn-sm btn-secondary">Adjust</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (filteredInventory.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="9" style="text-align: center; padding: 20px; color: #666;">
                    No inventory items found matching the selected criteria
                </td>
            `;
            tbody.appendChild(row);
        }
        
        console.log('Inventory table updated');
    } catch (error) {
        console.error('Error updating inventory table:', error);
    }
}

// Update summary cards
function updateSummaryCards() {
    try {
        const totalItems = inventoryData.length;
        const inStockItems = inventoryData.filter(item => getStockStatus(item) === 'in-stock').length;
        const lowStockItems = inventoryData.filter(item => getStockStatus(item) === 'low-stock').length;
        const outOfStockItems = inventoryData.filter(item => getStockStatus(item) === 'out-of-stock').length;
        
        const totalItemsEl = document.getElementById('total-items');
        const inStockItemsEl = document.getElementById('in-stock-items');
        const lowStockItemsEl = document.getElementById('low-stock-items');
        const outOfStockItemsEl = document.getElementById('out-of-stock-items');
        
        if (totalItemsEl) totalItemsEl.textContent = totalItems.toString();
        if (inStockItemsEl) inStockItemsEl.textContent = inStockItems.toString();
        if (lowStockItemsEl) lowStockItemsEl.textContent = lowStockItems.toString();
        if (outOfStockItemsEl) outOfStockItemsEl.textContent = outOfStockItems.toString();
        
        // Update change indicators (simplified for demo)
        const itemsChangeEl = document.getElementById('items-change');
        const stockChangeEl = document.getElementById('stock-change');
        const lowStockChangeEl = document.getElementById('low-stock-change');
        const outStockChangeEl = document.getElementById('out-stock-change');
        
        if (itemsChangeEl) itemsChangeEl.textContent = `+${Math.floor(Math.random() * 5)}`;
        if (stockChangeEl) stockChangeEl.textContent = `+${Math.floor(Math.random() * 3)}`;
        if (lowStockChangeEl) lowStockChangeEl.textContent = `+${Math.floor(Math.random() * 2)}`;
        if (outStockChangeEl) outStockChangeEl.textContent = `+${Math.floor(Math.random() * 2)}`;
        
        console.log('Summary cards updated');
    } catch (error) {
        console.error('Error updating summary cards:', error);
    }
}

// Handle stock adjustment form submission
function handleStockAdjustment(event) {
    try {
        event.preventDefault();
        
        const itemName = document.getElementById('adjust-item-name')?.value;
        const quantity = parseInt(document.getElementById('adjust-quantity')?.value);
        const reason = document.getElementById('adjust-reason')?.value;
        
        if (!itemName || isNaN(quantity)) {
            showNotification('Please select an item and enter valid quantity', 'error');
            return;
        }
        
        const item = inventoryData.find(inv => inv.name === itemName);
        if (!item) {
            showNotification('Item not found in inventory', 'error');
            return;
        }
        
        // Update stock
        item.currentStock += quantity;
        item.lastUpdated = new Date().toISOString();
        item.status = getStockStatus(item);
        
        // Save changes
        saveInventoryData();
        
        // Refresh display
        filterInventory();
        updateSummaryCards();
        
        // Clear form
        clearAdjustmentForm();
        
        showNotification(`Stock updated for ${item.name}. New stock: ${item.currentStock}`, 'success');
        console.log('Stock adjusted for', itemName, 'by', quantity);
    } catch (error) {
        console.error('Error handling stock adjustment:', error);
        showNotification('Error updating stock', 'error');
    }
}

// Adjust stock for a specific item
function adjustStock(itemName, type) {
    try {
        const item = inventoryData.find(inv => inv.name === itemName);
        if (!item) {
            showNotification('Item not found', 'error');
            return;
        }
        
        // Pre-fill form
        document.getElementById('adjust-item-name').value = itemName;
        document.getElementById('adjust-reason').value = type;
        
        if (type === 'restock') {
            document.getElementById('adjust-quantity').value = item.maxStock - item.currentStock;
        }
        
        // Scroll to form
        document.getElementById('stock-adjustment-form').scrollIntoView({ behavior: 'smooth' });
        
        console.log('Stock adjustment form pre-filled for', itemName);
    } catch (error) {
        console.error('Error adjusting stock:', error);
    }
}

// Clear adjustment form
function clearAdjustmentForm() {
    try {
        document.getElementById('stock-adjustment-form').reset();
        hideSearchResults();
        console.log('Adjustment form cleared');
    } catch (error) {
        console.error('Error clearing form:', error);
    }
}

// Search functionality for item selection
function initializeItemSearch() {
    const searchInput = document.getElementById('adjust-item-name');
    const searchResults = document.getElementById('item-search-results');
    
    if (!searchInput || !searchResults) return;
    
    // Handle input events
    searchInput.addEventListener('input', handleItemSearch);
    searchInput.addEventListener('focus', handleItemSearch);
    searchInput.addEventListener('blur', () => {
        // Delay hiding to allow click on results
        setTimeout(hideSearchResults, 200);
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', handleSearchKeydown);
}

function handleItemSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const searchResults = document.getElementById('item-search-results');
    
    if (!query) {
        hideSearchResults();
        return;
    }
    
    // Filter inventory items
    const filteredItems = inventoryData.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    if (filteredItems.length === 0) {
        hideSearchResults();
        return;
    }
    
    // Display search results
    displaySearchResults(filteredItems);
}

function displaySearchResults(items) {
    const searchResults = document.getElementById('item-search-results');
    
    const resultsHTML = items.map(item => `
        <div class="search-result-item" onclick="selectItem('${item.name}')">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
                <span>SKU: ${item.sku}</span>
                <span>Category: ${item.category}</span>
                <span>Stock: ${item.currentStock}</span>
            </div>
        </div>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
    searchResults.classList.add('show');
}

function selectItem(itemName) {
    const searchInput = document.getElementById('adjust-item-name');
    const searchResults = document.getElementById('item-search-results');
    
    searchInput.value = itemName;
    hideSearchResults();
    
    // Focus on quantity field
    document.getElementById('adjust-quantity').focus();
}

function hideSearchResults() {
    const searchResults = document.getElementById('item-search-results');
    if (searchResults) {
        searchResults.classList.remove('show');
    }
}

function handleSearchKeydown(event) {
    const searchResults = document.getElementById('item-search-results');
    const items = searchResults.querySelectorAll('.search-result-item');
    
    if (!searchResults.classList.contains('show') || items.length === 0) {
        return;
    }
    
    const currentIndex = Array.from(items).findIndex(item => 
        item.classList.contains('highlighted')
    );
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (currentIndex < items.length - 1) {
                items[currentIndex]?.classList.remove('highlighted');
                items[currentIndex + 1].classList.add('highlighted');
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (currentIndex > 0) {
                items[currentIndex]?.classList.remove('highlighted');
                items[currentIndex - 1].classList.add('highlighted');
            }
            break;
        case 'Enter':
            event.preventDefault();
            if (currentIndex >= 0) {
                items[currentIndex].click();
            }
            break;
        case 'Escape':
            hideSearchResults();
            break;
    }
}

// Refresh inventory data
function refreshInventory() {
    try {
        loadInventoryData();
        loadItemsData();
        populateFilters();
        filterInventory();
        updateSummaryCards();
        showNotification('Inventory refreshed successfully', 'success');
        console.log('Inventory refreshed');
    } catch (error) {
        console.error('Error refreshing inventory:', error);
        showNotification('Error refreshing inventory', 'error');
    }
}

// Manual sync function for the sync button
function syncInventoryWithItems() {
    try {
        const success = window.syncInventoryWithItems();
        if (success) {
            loadInventoryData();
            loadItemsData();
            populateFilters();
            filterInventory();
            updateSummaryCards();
            showNotification('Inventory synced with items successfully', 'success');
        } else {
            showNotification('Error syncing inventory', 'error');
        }
    } catch (error) {
        console.error('Error syncing inventory:', error);
        showNotification('Error syncing inventory', 'error');
    }
}

// Export inventory data
function exportInventory() {
    try {
        const exportData = {
            inventory: filteredInventory,
            summary: {
                totalItems: inventoryData.length,
                inStock: inventoryData.filter(item => getStockStatus(item) === 'in-stock').length,
                lowStock: inventoryData.filter(item => getStockStatus(item) === 'low-stock').length,
                outOfStock: inventoryData.filter(item => getStockStatus(item) === 'out-of-stock').length
            },
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Inventory report exported successfully!', 'success');
        console.log('Inventory exported');
    } catch (error) {
        console.error('Error exporting inventory:', error);
        showNotification('Error exporting inventory', 'error');
    }
}

// Global inventory synchronization function
function syncInventoryWithItems() {
    try {
        console.log('Syncing inventory with items...');
        
        // Load both datasets
        const shopData = JSON.parse(localStorage.getItem('sonic_shop_data') || '{}');
        const itemsData = shopData.items ? Object.values(shopData.items) : [];
        const inventoryData = JSON.parse(localStorage.getItem('sonic_inventory_data') || '[]');
        
        let updated = false;
        
        // Sync items to inventory
        itemsData.forEach(item => {
            const existingInventory = inventoryData.find(inv => 
                inv.sku === item.sku || inv.name === item.name
            );
            
            if (!existingInventory) {
                // Create new inventory item
                const newInventoryItem = {
                    id: Date.now() + Math.random(),
                    sku: item.sku || item.barcode || `SKU-${Date.now()}`,
                    name: item.name,
                    category: item.category || 'General',
                    currentStock: item.stockQuantity || item.currentStock || 10,
                    minStock: item.minStockLevel || item.minStock || 5,
                    maxStock: item.maxStock || 100,
                    cost: item.cost || item.purchasePrice || 0,
                    price: item.price || item.retailPrice || 0,
                    lastUpdated: new Date().toISOString(),
                    status: 'in-stock'
                };
                
                // Set status based on stock level
                if (newInventoryItem.currentStock <= 0) {
                    newInventoryItem.status = 'out-of-stock';
                } else if (newInventoryItem.currentStock <= newInventoryItem.minStock) {
                    newInventoryItem.status = 'low-stock';
                }
                
                inventoryData.push(newInventoryItem);
                updated = true;
                console.log(`Added new inventory item: ${item.name} with ${newInventoryItem.currentStock} stock`);
                
                // Create initial activity record for new item
                createInitialActivityRecord(newInventoryItem);
            } else {
                // Update existing inventory item
                const oldStock = existingInventory.currentStock;
                existingInventory.name = item.name;
                existingInventory.category = item.category || existingInventory.category;
                existingInventory.currentStock = item.stockQuantity || item.currentStock || existingInventory.currentStock;
                existingInventory.minStock = item.minStockLevel || item.minStock || existingInventory.minStock;
                existingInventory.cost = item.cost || item.purchasePrice || existingInventory.cost;
                existingInventory.price = item.price || item.retailPrice || existingInventory.price;
                existingInventory.lastUpdated = new Date().toISOString();
                
                // Update status based on stock level
                if (existingInventory.currentStock <= 0) {
                    existingInventory.status = 'out-of-stock';
                } else if (existingInventory.currentStock <= existingInventory.minStock) {
                    existingInventory.status = 'low-stock';
                } else {
                    existingInventory.status = 'in-stock';
                }
                
                if (oldStock !== existingInventory.currentStock) {
                    updated = true;
                }
            }
        });
        
        // Remove inventory items that no longer exist in items
        const originalLength = inventoryData.length;
        const filteredInventory = inventoryData.filter(inv => 
            itemsData.some(item => 
                item.sku === inv.sku || item.name === inv.name
            )
        );
        
        if (filteredInventory.length !== originalLength) {
            updated = true;
            // Use filtered inventory if items were removed
            inventoryData = filteredInventory;
        }
        
        // Save updated inventory data
        if (updated) {
            localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
            console.log('Inventory synced successfully');
            
            // Trigger refresh on inventory page if it's open
            if (typeof window.refreshInventoryDisplay === 'function') {
                window.refreshInventoryDisplay();
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error syncing inventory:', error);
        return false;
    }
}

// Update inventory stock when items are sold
function updateInventoryStockOnSale(itemName, quantitySold) {
    try {
        const inventoryData = JSON.parse(localStorage.getItem('sonic_inventory_data') || '[]');
        const inventoryItem = inventoryData.find(inv => inv.name === itemName);
        
        if (inventoryItem) {
            inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - quantitySold);
            inventoryItem.lastUpdated = new Date().toISOString();
            
            // Update status based on new stock level
            if (inventoryItem.currentStock <= 0) {
                inventoryItem.status = 'out-of-stock';
            } else if (inventoryItem.currentStock <= inventoryItem.minStock) {
                inventoryItem.status = 'low-stock';
            } else {
                inventoryItem.status = 'in-stock';
            }
            
            localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
            console.log(`Updated stock for ${itemName}: -${quantitySold}, new stock: ${inventoryItem.currentStock}`);
            
            // Trigger refresh on inventory page if it's open
            if (typeof window.refreshInventoryDisplay === 'function') {
                window.refreshInventoryDisplay();
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error updating inventory stock on sale:', error);
        return false;
    }
}

// Refresh inventory display (called from other pages)
function refreshInventoryDisplay() {
    try {
        if (typeof loadInventoryData === 'function') {
            loadInventoryData();
        }
        if (typeof filterInventory === 'function') {
            filterInventory();
        }
        if (typeof updateSummaryCards === 'function') {
            updateSummaryCards();
        }
        console.log('Inventory display refreshed');
    } catch (error) {
        console.error('Error refreshing inventory display:', error);
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    try {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Logout function
function logout() {
    try {
        sessionStorage.removeItem('sonic_logged_in');
        sessionStorage.removeItem('sonic_username');
        sessionStorage.removeItem('sonic_user_role');
        sessionStorage.removeItem('sonic_login_time');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = 'login.html';
    }
}

// Export global functions for use by other pages
// Create initial activity record for new items
function createInitialActivityRecord(inventoryItem) {
    try {
        const activityData = JSON.parse(localStorage.getItem('sonic_activity_data') || '[]');
        
        // Check if activity record already exists for this item
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

// Force sync all items from items data to inventory
function forceSyncAllItems() {
    try {
        console.log('Force syncing all items...');
        
        // Load items data
        const shopData = JSON.parse(localStorage.getItem('sonic_shop_data') || '{}');
        const itemsData = shopData.items ? Object.values(shopData.items) : [];
        let inventoryData = JSON.parse(localStorage.getItem('sonic_inventory_data') || '[]');
        
        let updated = false;
        
        // Process each item
        itemsData.forEach(item => {
            const existingInventory = inventoryData.find(inv => 
                inv.sku === item.sku || inv.name === item.name
            );
            
            if (existingInventory) {
                // Update existing inventory item with correct stock
                const oldStock = existingInventory.currentStock;
                existingInventory.currentStock = item.stockQuantity || item.currentStock || existingInventory.currentStock;
                existingInventory.minStock = item.minStockLevel || item.minStock || existingInventory.minStock;
                existingInventory.name = item.name;
                existingInventory.category = item.category || existingInventory.category;
                existingInventory.cost = item.purchasePrice || item.cost || existingInventory.cost;
                existingInventory.price = item.retailPrice || item.price || existingInventory.price;
                existingInventory.lastUpdated = new Date().toISOString();
                
                // Update status based on stock level
                if (existingInventory.currentStock <= 0) {
                    existingInventory.status = 'out-of-stock';
                } else if (existingInventory.currentStock <= existingInventory.minStock) {
                    existingInventory.status = 'low-stock';
                } else {
                    existingInventory.status = 'in-stock';
                }
                
                updated = true;
                console.log(`Updated inventory for ${item.name}: ${oldStock} → ${existingInventory.currentStock}`);
            } else {
                // Create new inventory entry
                const newInventoryItem = {
                    id: Date.now() + Math.random(),
                    sku: item.sku || item.barcode || `SKU-${Date.now()}`,
                    name: item.name,
                    category: item.category || 'General',
                    currentStock: item.stockQuantity || item.currentStock || 0,
                    minStock: item.minStockLevel || item.minStock || 5,
                    maxStock: item.maxStock || 100,
                    cost: item.purchasePrice || item.cost || 0,
                    price: item.retailPrice || item.price || 0,
                    lastUpdated: new Date().toISOString(),
                    status: 'in-stock'
                };
                
                // Set status based on stock level
                if (newInventoryItem.currentStock <= 0) {
                    newInventoryItem.status = 'out-of-stock';
                } else if (newInventoryItem.currentStock <= newInventoryItem.minStock) {
                    newInventoryItem.status = 'low-stock';
                }
                
                inventoryData.push(newInventoryItem);
                updated = true;
                console.log(`Created inventory entry for ${item.name}: ${newInventoryItem.currentStock} stock`);
            }
        });
        
        if (updated) {
            // Save updated inventory data
            localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
            
            // Refresh the display
            loadInventoryData();
            filterInventory();
            updateSummaryCards();
            
            showNotification('All items synced successfully!', 'success');
            console.log('Force sync completed');
        } else {
            showNotification('No items to sync', 'info');
        }
    } catch (error) {
        console.error('Error force syncing items:', error);
        showNotification('Error syncing items', 'error');
    }
}

// Debug function to check data
function debugData() {
    try {
        console.log('=== DEBUG DATA ===');
        
        // Check items data from shop data
        const shopData = JSON.parse(localStorage.getItem('sonic_shop_data') || '{}');
        const itemsData = shopData.items ? Object.values(shopData.items) : [];
        console.log('Items Data (from shop):', itemsData);
        console.log('Items Count:', itemsData.length);
        
        // Also check sonic_items_data for comparison
        const sonicItemsData = JSON.parse(localStorage.getItem('sonic_items_data') || '[]');
        console.log('Sonic Items Data:', sonicItemsData);
        console.log('Sonic Items Count:', sonicItemsData.length);
        
        // Check inventory data
        const inventoryData = JSON.parse(localStorage.getItem('sonic_inventory_data') || '[]');
        console.log('Inventory Data:', inventoryData);
        console.log('Inventory Count:', inventoryData.length);
        
        // Check activity data
        const activityData = JSON.parse(localStorage.getItem('sonic_activity_data') || '[]');
        console.log('Activity Data:', activityData);
        console.log('Activity Count:', activityData.length);
        
        // Show in alert
        let message = `Items (from shop): ${itemsData.length}\n`;
        message += `Items (sonic): ${sonicItemsData.length}\n`;
        message += `Inventory: ${inventoryData.length}\n`;
        message += `Activity: ${activityData.length}\n\n`;
        
        if (itemsData.length > 0) {
            message += 'Items from Shop Data:\n';
            itemsData.forEach(item => {
                message += `- ${item.name}: ${item.stockQuantity || 0} stock\n`;
            });
        }
        
        if (sonicItemsData.length > 0) {
            message += '\nItems from Sonic Data:\n';
            sonicItemsData.forEach(item => {
                message += `- ${item.name}: ${item.stockQuantity || 0} stock\n`;
            });
        }
        
        if (inventoryData.length > 0) {
            message += '\nInventory:\n';
            inventoryData.forEach(item => {
                message += `- ${item.name}: ${item.currentStock || 0} stock\n`;
            });
        }
        
        alert(message);
        
    } catch (error) {
        console.error('Debug error:', error);
        alert('Debug error: ' + error.message);
    }
}

window.syncInventoryWithItems = syncInventoryWithItems;
window.updateInventoryStockOnSale = updateInventoryStockOnSale;
window.refreshInventoryDisplay = refreshInventoryDisplay;
window.refreshInventory = refreshInventory;
window.clearAllSampleData = clearAllSampleData;
window.forceSyncAllItems = forceSyncAllItems;
window.debugData = debugData;

// Initialize with empty inventory data (no sample data)
function initializeSampleInventoryData() {
    try {
        console.log('Initializing empty inventory - no sample data');
        
        // Force clear any existing sample data
        localStorage.removeItem('sonic_inventory_data');
        localStorage.removeItem('sonic_activity_data');
        
        // Clear any sample data from shop data
        const shopData = JSON.parse(localStorage.getItem('sonic_shop_data') || '{}');
        if (shopData.items) {
            // Remove sample items (those with ITEM001, ITEM002, etc.)
            Object.keys(shopData.items).forEach(key => {
                const item = shopData.items[key];
                if (item.barcode && item.barcode.startsWith('ITEM00')) {
                    delete shopData.items[key];
                }
            });
        }
        
        if (shopData.customers) {
            // Remove sample customers (John Doe, Jane Smith, etc.)
            Object.keys(shopData.customers).forEach(key => {
                const customer = shopData.customers[key];
                if (customer.name && ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'].includes(customer.name)) {
                    delete shopData.customers[key];
                }
            });
        }
        
        localStorage.setItem('sonic_shop_data', JSON.stringify(shopData));
        
        // Also clear sample data from sonic_items_data if it exists
        const itemsData = JSON.parse(localStorage.getItem('sonic_items_data') || '[]');
        const filteredItems = itemsData.filter(item => {
            // Remove sample items (those with ITEM001, ITEM002, etc.)
            if (item.barcode && item.barcode.startsWith('ITEM00')) {
                return false;
            }
            // Remove sample items by name patterns
            const sampleNames = ['Tablet Computer', 'T-Shirt', 'Apple iPhone', 'Book - Programming Guide', 'Samsung Monitor', 'Tool Set'];
            if (sampleNames.includes(item.name)) {
                return false;
            }
            return true;
        });
        localStorage.setItem('sonic_items_data', JSON.stringify(filteredItems));
        
        // Start with empty inventory
        inventoryData = [];
        saveInventoryData();
        
        console.log('Sample data cleared and inventory initialized as empty');
    } catch (error) {
        console.error('Error initializing inventory data:', error);
    }
}

// Clear all sample data from localStorage
function clearAllSampleData() {
    try {
        console.log('Clearing all sample data...');
        
        // Clear inventory data completely
        localStorage.removeItem('sonic_inventory_data');
        
        // Clear activity data completely
        localStorage.removeItem('sonic_activity_data');
        
        // Clear any sample data from shop data
        const shopData = JSON.parse(localStorage.getItem('sonic_shop_data') || '{}');
        if (shopData.items) {
            // Remove sample items (those with ITEM001, ITEM002, etc.)
            Object.keys(shopData.items).forEach(key => {
                const item = shopData.items[key];
                if (item.barcode && item.barcode.startsWith('ITEM00')) {
                    delete shopData.items[key];
                }
            });
        }
        
        if (shopData.customers) {
            // Remove sample customers (John Doe, Jane Smith, etc.)
            Object.keys(shopData.customers).forEach(key => {
                const customer = shopData.customers[key];
                if (customer.name && ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'].includes(customer.name)) {
                    delete shopData.customers[key];
                }
            });
        }
        
        localStorage.setItem('sonic_shop_data', JSON.stringify(shopData));
        
        // Also clear sample data from sonic_items_data if it exists
        const itemsData = JSON.parse(localStorage.getItem('sonic_items_data') || '[]');
        const filteredItems = itemsData.filter(item => {
            // Remove sample items (those with ITEM001, ITEM002, etc.)
            if (item.barcode && item.barcode.startsWith('ITEM00')) {
                return false;
            }
            // Remove sample items by name patterns
            const sampleNames = ['Tablet Computer', 'T-Shirt', 'Apple iPhone', 'Book - Programming Guide', 'Samsung Monitor', 'Tool Set'];
            if (sampleNames.includes(item.name)) {
                return false;
            }
            return true;
        });
        localStorage.setItem('sonic_items_data', JSON.stringify(filteredItems));
        
        // Reset inventory data in memory
        inventoryData = [];
        
        // Keep only user-added items, customers, and invoices
        console.log('Sample data cleared - only user data remains');
        
        // Show success message
        showNotification('Sample data cleared successfully!', 'success');
        
        // Refresh the page to show clean state
        setTimeout(() => {
            if (typeof window.location !== 'undefined') {
                window.location.reload();
            }
        }, 1000);
    } catch (error) {
        console.error('Error clearing sample data:', error);
        showNotification('Error clearing sample data', 'error');
    }
}

// Get all unique item names from inventory
function getAllItemNamesInventory() {
    const itemSet = new Set();
    inventoryData.forEach(item => {
        if (item.itemName || item.name) {
            itemSet.add(item.itemName || item.name);
        }
    });
    
    itemsData.forEach(item => {
        if (item.name) {
            itemSet.add(item.name);
        }
    });
    
    return Array.from(itemSet).sort();
}

// Handle item search with autocomplete
function handleItemSearchInventory() {
    const input = document.getElementById('search-input');
    const searchText = input.value.toLowerCase().trim();
    
    if (searchText.length > 0) {
        showItemSuggestionsInventory();
    } else {
        hideItemSuggestionsInventory();
    }
    
    filterInventory();
}

// Show item suggestions dropdown
function showItemSuggestionsInventory() {
    const input = document.getElementById('search-input');
    const suggestionsDiv = document.getElementById('item-suggestions-inventory');
    const searchText = input.value.toLowerCase().trim();
    
    if (!suggestionsDiv) return;
    
    const allItems = getAllItemNamesInventory();
    const filteredItems = searchText.length > 0
        ? allItems.filter(item => item.toLowerCase().includes(searchText))
        : allItems.slice(0, 10);
    
    if (filteredItems.length === 0) {
        suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #6b7280; text-align: center;">No items found</div>';
        suggestionsDiv.style.display = 'block';
        return;
    }
    
    suggestionsDiv.innerHTML = filteredItems.map(item => {
        const index = item.toLowerCase().indexOf(searchText);
        let highlightedName = item;
        if (index !== -1 && searchText.length > 0) {
            const before = item.substring(0, index);
            const match = item.substring(index, index + searchText.length);
            const after = item.substring(index + searchText.length);
            highlightedName = `${before}<strong style="color: #6b7280;">${match}</strong>${after}`;
        }
        
        return `
            <div class="item-suggestion-item" 
                 onclick="selectItemSuggestionInventory('${item.replace(/'/g, "\\'")}')"
                 onmouseover="this.style.background='#f3f4f6'" 
                 onmouseout="this.style.background='white'"
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.2s;">
                <i class="fas fa-box" style="color: #6b7280; margin-right: 8px;"></i>
                <span>${highlightedName}</span>
            </div>
        `;
    }).join('');
    
    suggestionsDiv.style.display = 'block';
}

// Hide item suggestions dropdown
function hideItemSuggestionsInventory() {
    setTimeout(() => {
        const suggestionsDiv = document.getElementById('item-suggestions-inventory');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }, 200);
}

// Select an item suggestion
function selectItemSuggestionInventory(itemName) {
    const input = document.getElementById('search-input');
    if (input) {
        input.value = itemName;
        hideItemSuggestionsInventory();
        filterInventory();
    }
}

// Expose functions globally
window.handleItemSearchInventory = handleItemSearchInventory;
window.showItemSuggestionsInventory = showItemSuggestionsInventory;
window.hideItemSuggestionsInventory = hideItemSuggestionsInventory;
window.selectItemSuggestionInventory = selectItemSuggestionInventory;