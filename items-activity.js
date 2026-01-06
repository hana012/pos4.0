// Item Activity Management
let activityData = [];
let filteredData = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Item Activity page loaded');
    loadActivityData();
    setupEventListeners();
    populateItemFilter();
    filterActivities();
});

// Global function to refresh the page data
function refreshActivityPage() {
    loadActivityData();
    populateItemFilter();
    filterActivities();
    updateSummaryCards();
}

// Expose refresh function globally
window.refreshActivityPage = refreshActivityPage;

// Setup event listeners
function setupEventListeners() {
    // Set default dates
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (dateFrom && dateTo) {
        dateFrom.value = lastWeek.toISOString().split('T')[0];
        dateTo.value = today.toISOString().split('T')[0];
    }
}

// Load activity data from localStorage
function loadActivityData() {
    try {
        const savedData = localStorage.getItem('sonic_activity_data');
        if (savedData) {
            activityData = JSON.parse(savedData);
        } else {
            activityData = [];
            // Initialize with sample data if empty
            initializeSampleData();
        }
        console.log('Activity data loaded:', activityData.length, 'records');
    } catch (error) {
        console.error('Error loading activity data:', error);
        activityData = [];
    }
}

// Save activity data to localStorage
function saveActivityData() {
    try {
        localStorage.setItem('sonic_activity_data', JSON.stringify(activityData));
        console.log('Activity data saved');
    } catch (error) {
        console.error('Error saving activity data:', error);
    }
}

// Add new activity record
function addActivityRecord(type, itemName, quantity, price, total, details = {}) {
    const activity = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: type,
        itemName: itemName,
        quantity: quantity,
        price: price,
        total: total,
        details: details
    };
    
    activityData.push(activity);
    saveActivityData();
    filterActivities();
    updateStatistics();
    showNotification('Activity added successfully!', 'success');
}

// Filter activities based on current filters
function filterActivities() {
    try {
        const activityType = document.getElementById('activity-type')?.value || 'all';
        const itemFilterInput = document.getElementById('item-filter-input');
        const itemFilterSelect = document.getElementById('item-filter');
        const itemFilter = itemFilterInput?.value?.toLowerCase().trim() || itemFilterSelect?.value || 'all';
        const customerFilter = document.getElementById('customer-filter')?.value?.toLowerCase().trim() || '';
        const dateFrom = document.getElementById('date-from')?.value;
        const dateTo = document.getElementById('date-to')?.value;
        
        filteredData = activityData.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
            const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
            
            const typeMatch = activityType === 'all' || activity.type === activityType;
            const itemMatch = itemFilter === 'all' || itemFilter === '' || activity.itemName?.toLowerCase().includes(itemFilter);
            const customerMatch = !customerFilter || (activity.details?.customer?.toLowerCase().includes(customerFilter) || 'No Customer'.toLowerCase().includes(customerFilter));
            const dateMatch = activityDate >= fromDate && activityDate <= toDate;
            
            return typeMatch && itemMatch && customerMatch && dateMatch;
        });
        
        displayActivities();
        updateStatistics();
        displayCustomerSummary();
    } catch (error) {
        console.error('Error filtering activities:', error);
    }
}

// Display filtered activities
function displayActivities() {
    const tbody = document.getElementById('activity-log-tbody');
    if (!tbody) {
        console.error('Activity log tbody not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    // Sort by timestamp (newest first)
    const sortedData = filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (sortedData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                No activities found for the selected filters
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    // Group activities by item and customer to show totals
    const customerItemTotals = {};
    sortedData.forEach(activity => {
        const itemName = activity.itemName;
        const customer = activity.details?.customer || 'No Customer';
        const key = `${itemName}|||${customer}`;
        
        if (!customerItemTotals[key]) {
            customerItemTotals[key] = {
                itemName: itemName,
                customer: customer,
                totalQuantity: 0,
                activities: []
            };
        }
        customerItemTotals[key].totalQuantity += activity.quantity;
        customerItemTotals[key].activities.push(activity);
    });
    
    sortedData.forEach(activity => {
        const row = document.createElement('tr');
        const date = new Date(activity.timestamp);
        const typeClass = getActivityTypeClass(activity.type);
        const typeIcon = getActivityTypeIcon(activity.type);
        const customer = activity.details?.customer || 'No Customer';
        const invoiceNumber = activity.details?.invoiceNumber || '';
        
        // Get total quantity for this customer and item
        const key = `${activity.itemName}|||${customer}`;
        const customerTotal = customerItemTotals[key]?.totalQuantity || activity.quantity;
        
        row.innerHTML = `
            <td>${date.toLocaleString()}</td>
            <td><span class="activity-type ${typeClass}">${typeIcon} ${activity.type.toUpperCase()}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <div>
                        <span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase;">Item:</span>
                        <strong style="margin-left: 6px;">${activity.itemName}</strong>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="background: #4f46e5; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase;">Customer:</span>
                        <span style="font-weight: 600; color: #4f46e5; font-size: 13px;">${customer}</span>
                    </div>
                </div>
                ${customerTotal > activity.quantity ? `<div style="margin-top: 4px;"><small style="color: #6b7280; font-size: 11px;">📊 Total: ${customerTotal} pieces</small></div>` : ''}
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="background: #4f46e5; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase;">Customer</span>
                    <span style="font-weight: 600; color: #4f46e5; font-size: 13px;">${customer}</span>
                </div>
            </td>
            <td>${activity.quantity}</td>
            <td>$${activity.price.toFixed(2)}</td>
            <td>$${activity.total.toFixed(2)}</td>
            <td>
                ${invoiceNumber ? `<div style="font-size: 11px; color: #6b7280;">Invoice: ${invoiceNumber}</div>` : ''}
                ${formatActivityDetails(activity.details)}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get activity type CSS class
function getActivityTypeClass(type) {
    switch (type) {
        case 'sale': return 'sale';
        case 'return': return 'return';
        case 'adjustment': return 'adjustment';
        case 'transfer': return 'transfer';
        default: return 'default';
    }
}

// Get activity type icon
function getActivityTypeIcon(type) {
    switch (type) {
        case 'sale': return '💰';
        case 'return': return '↩️';
        case 'adjustment': return '⚙️';
        case 'transfer': return '🔄';
        default: return '📝';
    }
}

// Format activity details
function formatActivityDetails(details) {
    if (!details || Object.keys(details).length === 0) {
        return 'No additional details';
    }
    
    const detailItems = [];
    // Don't show customer here since it's now in its own column
    if (details.reason) detailItems.push(`Reason: ${details.reason}`);
    if (details.location) detailItems.push(`Location: ${details.location}`);
    if (details.notes) detailItems.push(`Notes: ${details.notes}`);
    if (details.paymentMethod) detailItems.push(`Payment: ${details.paymentMethod}`);
    
    return detailItems.length > 0 ? detailItems.join(', ') : 'No additional details';
}

// Update statistics
function updateStatistics() {
    const totalActivities = filteredData.length;
    const salesCount = filteredData.filter(a => a.type === 'sale').length;
    const returnsCount = filteredData.filter(a => a.type === 'return').length;
    const adjustmentsCount = filteredData.filter(a => a.type === 'adjustment').length;
    
    const totalEl = document.getElementById('total-activities');
    const salesEl = document.getElementById('sales-count');
    const returnsEl = document.getElementById('returns-count');
    const adjustmentsEl = document.getElementById('adjustments-count');
    
    if (totalEl) totalEl.textContent = totalActivities;
    if (salesEl) salesEl.textContent = salesCount;
    if (returnsEl) returnsEl.textContent = returnsCount;
    if (adjustmentsEl) adjustmentsEl.textContent = adjustmentsCount;
}

// Display customer purchase summary by item
function displayCustomerSummary() {
    const tbody = document.getElementById('customer-summary-tbody');
    const section = document.getElementById('customer-summary-section');
    
    if (!tbody || !section) return;
    
    // Group activities by item and customer
    const summary = {};
    
    filteredData.forEach(activity => {
        if (activity.type === 'sale' || activity.type === 'return') {
            const itemName = activity.itemName;
            const customer = activity.details?.customer || 'No Customer';
            const key = `${itemName}|||${customer}`;
            
            if (!summary[key]) {
                summary[key] = {
                    itemName: itemName,
                    customer: customer,
                    totalQuantity: 0,
                    totalAmount: 0,
                    transactionCount: 0
                };
            }
            
            if (activity.type === 'sale') {
                summary[key].totalQuantity += activity.quantity;
                summary[key].totalAmount += activity.total;
            } else if (activity.type === 'return') {
                summary[key].totalQuantity -= activity.quantity;
                summary[key].totalAmount -= activity.total;
            }
            summary[key].transactionCount++;
        }
    });
    
    const summaryArray = Object.values(summary).filter(item => item.totalQuantity > 0);
    
    if (summaryArray.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    tbody.innerHTML = '';
    
    // Sort by item name, then by customer
    summaryArray.sort((a, b) => {
        if (a.itemName !== b.itemName) {
            return a.itemName.localeCompare(b.itemName);
        }
        return a.customer.localeCompare(b.customer);
    });
    
    summaryArray.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.itemName}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="background: #4f46e5; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase;">Customer</span>
                    <span style="color: #4f46e5; font-weight: 600; font-size: 13px;">${item.customer}</span>
                </div>
            </td>
            <td><strong style="color: #059669;">${item.totalQuantity}</strong> <span style="color: #6b7280; font-size: 12px;">pieces</span></td>
            <td><strong>$${item.totalAmount.toFixed(2)}</strong></td>
            <td><span style="background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-size: 11px;">${item.transactionCount} transaction${item.transactionCount !== 1 ? 's' : ''}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Populate item filter dropdown
function populateItemFilter() {
    const select = document.getElementById('item-filter');
    if (!select) return;
    
    // Get items from activity data
    const activityItems = [...new Set(activityData.map(activity => activity.itemName))];
    
    // Get items from items data
    let itemsData = [];
    try {
        const itemsDataStr = localStorage.getItem('sonic_items_data');
        if (itemsDataStr) {
            itemsData = JSON.parse(itemsDataStr);
        }
    } catch (error) {
        console.error('Error loading items data:', error);
    }
    
    const itemsFromData = itemsData.map(item => item.name);
    
    // Combine and deduplicate all items
    const allItems = [...new Set([...activityItems, ...itemsFromData])];
    
    // Clear existing options except "All Items"
    select.innerHTML = '<option value="all">All Items</option>';
    
    allItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

// Get all unique item names from activity data
function getAllItemNames() {
    const itemSet = new Set();
    activityData.forEach(activity => {
        if (activity.itemName) {
            itemSet.add(activity.itemName);
        }
    });
    
    // Also get items from items data
    try {
        const itemsDataStr = localStorage.getItem('sonic_items_data');
        if (itemsDataStr) {
            const itemsData = JSON.parse(itemsDataStr);
            itemsData.forEach(item => {
                if (item.name) {
                    itemSet.add(item.name);
                }
            });
        }
    } catch (error) {
        console.error('Error loading items data:', error);
    }
    
    return Array.from(itemSet).sort();
}

// Handle item search with autocomplete
function handleItemSearch() {
    const input = document.getElementById('item-filter-input');
    const searchText = input.value.toLowerCase().trim();
    
    // Update hidden select for filtering
    const select = document.getElementById('item-filter');
    if (select) {
        if (searchText.length === 0) {
            select.value = 'all';
        } else {
            // Find matching item
            const allItems = getAllItemNames();
            const match = allItems.find(item => item.toLowerCase() === searchText);
            select.value = match || searchText;
        }
    }
    
    // Show suggestions if there's text
    if (searchText.length > 0) {
        showItemSuggestions();
    } else {
        hideItemSuggestions();
    }
    
    // Filter activities
    filterActivities();
}

// Show item suggestions dropdown
function showItemSuggestions() {
    const input = document.getElementById('item-filter-input');
    const suggestionsDiv = document.getElementById('item-suggestions');
    const searchText = input.value.toLowerCase().trim();
    
    if (!suggestionsDiv) return;
    
    // Get all item names
    const allItems = getAllItemNames();
    
    // Filter items based on search text
    const filteredItems = searchText.length > 0
        ? allItems.filter(item => item.toLowerCase().includes(searchText))
        : allItems.slice(0, 10); // Show first 10 if no search text
    
    if (filteredItems.length === 0) {
        suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #6b7280; text-align: center;">No items found</div>';
        suggestionsDiv.style.display = 'block';
        return;
    }
    
    // Build suggestions HTML
    suggestionsDiv.innerHTML = filteredItems.map(item => {
        // Highlight matching text
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
                 onclick="selectItemSuggestion('${item.replace(/'/g, "\\'")}')"
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
function hideItemSuggestions() {
    // Delay to allow click events to fire
    setTimeout(() => {
        const suggestionsDiv = document.getElementById('item-suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }, 200);
}

// Select an item suggestion
function selectItemSuggestion(itemName) {
    const input = document.getElementById('item-filter-input');
    const select = document.getElementById('item-filter');
    if (input && select) {
        input.value = itemName;
        select.value = itemName;
        hideItemSuggestions();
        filterActivities();
    }
}

// Clear all filters
function clearFilters() {
    const activityType = document.getElementById('activity-type');
    const itemFilterInput = document.getElementById('item-filter-input');
    const itemFilterSelect = document.getElementById('item-filter');
    const customerFilter = document.getElementById('customer-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (activityType) activityType.value = 'all';
    if (itemFilterInput) itemFilterInput.value = '';
    if (itemFilterSelect) itemFilterSelect.value = 'all';
    if (customerFilter) customerFilter.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    hideCustomerSuggestions();
    hideItemSuggestions();
    filterActivities();
}

// Get all unique customer names from activity data
function getAllCustomerNames() {
    const customerSet = new Set();
    activityData.forEach(activity => {
        if (activity.details?.customer && activity.details.customer !== 'No Customer') {
            customerSet.add(activity.details.customer);
        }
    });
    return Array.from(customerSet).sort();
}

// Handle customer search with autocomplete
function handleCustomerSearch() {
    const input = document.getElementById('customer-filter');
    const searchText = input.value.toLowerCase().trim();
    
    // Show suggestions if there's text
    if (searchText.length > 0) {
        showCustomerSuggestions();
    } else {
        hideCustomerSuggestions();
    }
    
    // Filter activities
    filterActivities();
}

// Show customer suggestions dropdown
function showCustomerSuggestions() {
    const input = document.getElementById('customer-filter');
    const suggestionsDiv = document.getElementById('customer-suggestions');
    const searchText = input.value.toLowerCase().trim();
    
    if (!suggestionsDiv) return;
    
    // Get all customer names
    const allCustomers = getAllCustomerNames();
    
    // Filter customers based on search text
    const filteredCustomers = searchText.length > 0
        ? allCustomers.filter(customer => customer.toLowerCase().includes(searchText))
        : allCustomers.slice(0, 10); // Show first 10 if no search text
    
    if (filteredCustomers.length === 0) {
        suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #6b7280; text-align: center;">No customers found</div>';
        suggestionsDiv.style.display = 'block';
        return;
    }
    
    // Build suggestions HTML
    suggestionsDiv.innerHTML = filteredCustomers.map(customer => {
        // Highlight matching text
        const index = customer.toLowerCase().indexOf(searchText);
        let highlightedName = customer;
        if (index !== -1 && searchText.length > 0) {
            const before = customer.substring(0, index);
            const match = customer.substring(index, index + searchText.length);
            const after = customer.substring(index + searchText.length);
            highlightedName = `${before}<strong style="color: #4f46e5;">${match}</strong>${after}`;
        }
        
        return `
            <div class="customer-suggestion-item" 
                 onclick="selectCustomerSuggestion('${customer.replace(/'/g, "\\'")}')"
                 onmouseover="this.style.background='#f3f4f6'" 
                 onmouseout="this.style.background='white'"
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.2s;">
                <i class="fas fa-user" style="color: #4f46e5; margin-right: 8px;"></i>
                <span>${highlightedName}</span>
            </div>
        `;
    }).join('');
    
    suggestionsDiv.style.display = 'block';
}

// Hide customer suggestions dropdown
function hideCustomerSuggestions() {
    // Delay to allow click events to fire
    setTimeout(() => {
        const suggestionsDiv = document.getElementById('customer-suggestions');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }, 200);
}

// Select a customer suggestion
function selectCustomerSuggestion(customerName) {
    const input = document.getElementById('customer-filter');
    if (input) {
        input.value = customerName;
        hideCustomerSuggestions();
        filterActivities();
    }
}

// Expose functions globally
window.handleCustomerSearch = handleCustomerSearch;
window.showCustomerSuggestions = showCustomerSuggestions;
window.hideCustomerSuggestions = hideCustomerSuggestions;
window.selectCustomerSuggestion = selectCustomerSuggestion;
window.handleItemSearch = handleItemSearch;
window.showItemSuggestions = showItemSuggestions;
window.hideItemSuggestions = hideItemSuggestions;
window.selectItemSuggestion = selectItemSuggestion;

// Add new activity from form
function addNewActivity(event) {
    event.preventDefault();
    
    const type = document.getElementById('new-activity-type')?.value;
    const itemName = document.getElementById('new-item-name')?.value;
    const quantity = parseFloat(document.getElementById('new-quantity')?.value || 0);
    const price = parseFloat(document.getElementById('new-price')?.value || 0);
    const details = document.getElementById('new-details')?.value;
    
    if (!type || !itemName || quantity <= 0 || price <= 0) {
        showNotification('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    const total = quantity * price;
    
    addActivityRecord(type, itemName, quantity, price, total, {
        notes: details,
        addedBy: 'Manual Entry'
    });
    
    clearActivityForm();
}

// Clear activity form
function clearActivityForm() {
    const form = document.getElementById('activity-form');
    if (form) form.reset();
}

// Export activity log
function exportActivityLog() {
    try {
        const exportData = filteredData.map(activity => ({
            Date: new Date(activity.timestamp).toLocaleString(),
            Type: activity.type.toUpperCase(),
            'Item Name': activity.itemName,
            Quantity: activity.quantity,
            Price: `$${activity.price.toFixed(2)}`,
            Total: `$${activity.total.toFixed(2)}`,
            Details: formatActivityDetails(activity.details)
        }));
        
        const csvContent = convertToCSV(exportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Activity log exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting activity log:', error);
        showNotification('Error exporting activity log', 'error');
    }
}

// Convert data to CSV format
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// Logout function
function logout() {
    sessionStorage.removeItem('sonic_logged_in');
    sessionStorage.removeItem('sonic_username');
    sessionStorage.removeItem('sonic_user_role');
    sessionStorage.removeItem('sonic_login_time');
    window.location.href = 'login.html';
}

// Initialize with empty data (no sample data)
function initializeSampleData() {
    if (activityData.length === 0) {
        console.log('Initializing empty activity data - no sample data');
        // Keep activity data empty - only real transactions will appear
    }
}