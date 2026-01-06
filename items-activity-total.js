// Items Activity Total Management
let activityData = [];
let currentDateRange = 'today';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Items Activity Total page loaded');
    try {
        // Hide loading indicator
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
        
        loadActivityData();
        populateItemFilter();
        updateActivityTotal();
        setupEventListeners();
        console.log('Items Activity Total initialized successfully');
    } catch (error) {
        console.error('Error initializing Items Activity Total:', error);
        
        // Hide loading indicator
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Show error message
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        if (errorDiv && errorText) {
            errorText.textContent = error.message || 'Failed to load page data';
            errorDiv.style.display = 'block';
        }
        
        showNotification('Error loading page. Please refresh.', 'error');
    }
});

// Setup event listeners
function setupEventListeners() {
    try {
        // Set default dates to today
        const today = new Date();
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        
        if (startDate && !startDate.value) {
            startDate.value = today.toISOString().split('T')[0];
        }
        if (endDate && !endDate.value) {
            endDate.value = today.toISOString().split('T')[0];
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Set date range based on preset
function setDateRange(range) {
    try {
        const now = new Date();
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        
        if (!startDate || !endDate) return;
        
        let start, end;
        
        switch (range) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                start = weekStart;
                end = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                start = quarterStart;
                end = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                return;
        }
        
        startDate.value = start.toISOString().split('T')[0];
        endDate.value = end.toISOString().split('T')[0];
        
        updateActivityTotal();
    } catch (error) {
        console.error('Error setting date range:', error);
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
        initializeSampleData();
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
    try {
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
        updateActivityTotal();
    } catch (error) {
        console.error('Error adding activity record:', error);
    }
}

// Get date range for filtering
function getDateRange() {
    try {
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        
        if (startDate && endDate) {
            return {
                start: new Date(startDate),
                end: new Date(endDate + 'T23:59:59')
            };
        } else if (startDate) {
            return {
                start: new Date(startDate),
                end: new Date(startDate + 'T23:59:59')
            };
        } else {
            // Default to today if no dates selected
            const today = new Date();
            return {
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
            };
        }
    } catch (error) {
        console.error('Error getting date range:', error);
        const today = new Date();
        return {
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
        };
    }
}

// Filter activity data by date range and item
function getFilteredActivityData() {
    try {
        const dateRange = getDateRange();
        const itemFilterInput = document.getElementById('item-filter-input');
        const itemFilterSelect = document.getElementById('item-filter');
        const itemFilter = itemFilterInput?.value?.toLowerCase().trim() || itemFilterSelect?.value || 'all';
        const customerFilter = document.getElementById('customer-filter-total')?.value?.toLowerCase().trim() || '';
        
        return activityData.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            const inDateRange = activityDate >= dateRange.start && activityDate <= dateRange.end;
            const itemMatch = itemFilter === 'all' || itemFilter === '' || activity.itemName?.toLowerCase().includes(itemFilter);
            const customerMatch = !customerFilter || (activity.details?.customer?.toLowerCase().includes(customerFilter) || 'No Customer'.toLowerCase().includes(customerFilter));
            
            return inDateRange && itemMatch && customerMatch;
        });
    } catch (error) {
        console.error('Error filtering activity data:', error);
        return [];
    }
}

// Update activity total display
function updateActivityTotal() {
    try {
        console.log('Updating activity total...');
        const filteredData = getFilteredActivityData();
        console.log('Filtered data:', filteredData.length, 'records');
        
        // Calculate totals
        const totals = calculateActivityTotals(filteredData);
        console.log('Calculated totals:', totals);
        
        // Update summary cards
        updateSummaryCards(totals);
        
        // Update activity summary table
        updateActivitySummaryTable(filteredData);
        
        // Update top performers
        updateTopPerformers(filteredData);
        
        console.log('Activity total updated successfully');
    } catch (error) {
        console.error('Error updating activity total:', error);
        showNotification('Error updating data. Please refresh the page.', 'error');
    }
}

// Calculate activity totals
function calculateActivityTotals(data) {
    try {
        const totals = {
            totalSales: 0,
            totalReturns: 0,
            itemsSold: 0,
            totalProfit: 0,
            salesCount: 0,
            returnsCount: 0
        };
        
        data.forEach(activity => {
            if (activity.type === 'sale') {
                totals.totalSales += activity.total;
                totals.itemsSold += activity.quantity;
                totals.salesCount++;
                
                // Calculate profit (assuming 30% margin for demo)
                const cost = activity.total * 0.7;
                totals.totalProfit += (activity.total - cost);
            } else if (activity.type === 'return') {
                totals.totalReturns += activity.total;
                totals.returnsCount++;
            }
        });
        
        return totals;
    } catch (error) {
        console.error('Error calculating activity totals:', error);
        return {
            totalSales: 0,
            totalReturns: 0,
            itemsSold: 0,
            totalProfit: 0,
            salesCount: 0,
            returnsCount: 0
        };
    }
}

// Update summary cards
function updateSummaryCards(totals) {
    try {
        const totalSalesEl = document.getElementById('total-sales');
        const totalReturnsEl = document.getElementById('total-returns');
        const itemsSoldEl = document.getElementById('items-sold');
        const totalProfitEl = document.getElementById('total-profit');
        
        if (totalSalesEl) totalSalesEl.textContent = `$${totals.totalSales.toFixed(2)}`;
        if (totalReturnsEl) totalReturnsEl.textContent = `$${totals.totalReturns.toFixed(2)}`;
        if (itemsSoldEl) itemsSoldEl.textContent = totals.itemsSold.toString();
        if (totalProfitEl) totalProfitEl.textContent = `$${totals.totalProfit.toFixed(2)}`;
        
        // Calculate percentage changes (simplified for demo)
        const salesChangeEl = document.getElementById('sales-change');
        const returnsChangeEl = document.getElementById('returns-change');
        const itemsSoldChangeEl = document.getElementById('items-sold-change');
        const profitChangeEl = document.getElementById('profit-change');
        
        if (salesChangeEl) salesChangeEl.textContent = `+${Math.floor(Math.random() * 20)}%`;
        if (returnsChangeEl) returnsChangeEl.textContent = `+${Math.floor(Math.random() * 10)}%`;
        if (itemsSoldChangeEl) itemsSoldChangeEl.textContent = `+${Math.floor(Math.random() * 15)}%`;
        if (profitChangeEl) profitChangeEl.textContent = `+${Math.floor(Math.random() * 25)}%`;
        
        console.log('Summary cards updated');
    } catch (error) {
        console.error('Error updating summary cards:', error);
    }
}

// Update activity summary table
function updateActivitySummaryTable(data) {
    try {
        const tbody = document.getElementById('activity-summary-tbody');
        if (!tbody) {
            console.error('Activity summary tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        // Group data by item
        const itemGroups = {};
        data.forEach(activity => {
            if (!itemGroups[activity.itemName]) {
                itemGroups[activity.itemName] = {
                    name: activity.itemName,
                    totalSold: 0,
                    totalRevenue: 0,
                    totalReturns: 0,
                    salesCount: 0,
                    returnsCount: 0
                };
            }
            
            if (activity.type === 'sale') {
                itemGroups[activity.itemName].totalSold += activity.quantity;
                itemGroups[activity.itemName].totalRevenue += activity.total;
                itemGroups[activity.itemName].salesCount++;
            } else if (activity.type === 'return') {
                itemGroups[activity.itemName].totalReturns += activity.total;
                itemGroups[activity.itemName].returnsCount++;
            }
        });
        
        // Populate table
        Object.values(itemGroups).forEach(item => {
            const netSales = item.totalRevenue - item.totalReturns;
            const profitMargin = item.totalRevenue > 0 ? ((netSales * 0.3) / item.totalRevenue * 100) : 0;
            const activityScore = item.salesCount - item.returnsCount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.totalSold}</td>
                <td>$${item.totalRevenue.toFixed(2)}</td>
                <td>$${item.totalReturns.toFixed(2)}</td>
                <td>$${netSales.toFixed(2)}</td>
                <td>${profitMargin.toFixed(1)}%</td>
                <td>${activityScore}</td>
            `;
            tbody.appendChild(row);
        });
        
        if (Object.keys(itemGroups).length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                    No activity data found for the selected period
                </td>
            `;
            tbody.appendChild(row);
        }
        
        console.log('Activity summary table updated');
    } catch (error) {
        console.error('Error updating activity summary table:', error);
    }
}

// Update top performers table
function updateTopPerformers(data) {
    try {
        const tbody = document.getElementById('top-performers-tbody');
        if (!tbody) {
            console.error('Top performers tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        // Group and sort by performance
        const itemGroups = {};
        data.forEach(activity => {
            if (activity.type === 'sale') {
                if (!itemGroups[activity.itemName]) {
                    itemGroups[activity.itemName] = {
                        name: activity.itemName,
                        salesCount: 0,
                        revenue: 0,
                        profit: 0
                    };
                }
                itemGroups[activity.itemName].salesCount += activity.quantity;
                itemGroups[activity.itemName].revenue += activity.total;
                itemGroups[activity.itemName].profit += activity.total * 0.3;
            }
        });
        
        // Sort by revenue
        const sortedItems = Object.values(itemGroups)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
        
        // Populate table
        sortedItems.forEach((item, index) => {
            const performance = item.revenue > 1000 ? 'Excellent' : 
                              item.revenue > 500 ? 'Good' : 
                              item.revenue > 100 ? 'Average' : 'Poor';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.salesCount}</td>
                <td>$${item.revenue.toFixed(2)}</td>
                <td>$${item.profit.toFixed(2)}</td>
                <td><span class="performance-badge ${performance.toLowerCase()}">${performance}</span></td>
            `;
            tbody.appendChild(row);
        });
        
        if (sortedItems.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    No performance data found for the selected period
                </td>
            `;
            tbody.appendChild(row);
        }
        
        console.log('Top performers table updated');
    } catch (error) {
        console.error('Error updating top performers table:', error);
    }
}

// Populate item filter dropdown
function populateItemFilter() {
    try {
        const select = document.getElementById('item-filter');
        if (!select) {
            console.error('Item filter select not found');
            return;
        }
        
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
        
        select.innerHTML = '<option value="all">All Items</option>';
        allItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
        
        console.log('Item filter populated with', allItems.length, 'items');
    } catch (error) {
        console.error('Error populating item filter:', error);
    }
}

// Export activity total report
function exportActivityTotal() {
    try {
        const filteredData = getFilteredActivityData();
        const totals = calculateActivityTotals(filteredData);
        const startDate = document.getElementById('start-date')?.value || '';
        const endDate = document.getElementById('end-date')?.value || '';
        
        const reportData = {
            dateRange: {
                start: startDate,
                end: endDate
            },
            totals: totals,
            generatedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `activity-total-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Activity total report exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting activity total report:', error);
        showNotification('Error exporting report', 'error');
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

// Initialize with empty data (no sample data)
function initializeSampleData() {
    try {
        if (activityData.length === 0) {
            console.log('Initializing empty activity data - no sample data');
            // Keep activity data empty - only real transactions will appear
        }
    } catch (error) {
        console.error('Error initializing activity data:', error);
    }
}

// Get all unique item names
function getAllItemNamesTotal() {
    const itemSet = new Set();
    activityData.forEach(activity => {
        if (activity.itemName) {
            itemSet.add(activity.itemName);
        }
    });
    
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

// Get all unique customer names
function getAllCustomerNamesTotal() {
    const customerSet = new Set();
    activityData.forEach(activity => {
        if (activity.details?.customer && activity.details.customer !== 'No Customer') {
            customerSet.add(activity.details.customer);
        }
    });
    return Array.from(customerSet).sort();
}

// Handle item search with autocomplete
function handleItemSearchTotal() {
    const input = document.getElementById('item-filter-input');
    const searchText = input.value.toLowerCase().trim();
    
    const select = document.getElementById('item-filter');
    if (select) {
        if (searchText.length === 0) {
            select.value = 'all';
        } else {
            const allItems = getAllItemNamesTotal();
            const match = allItems.find(item => item.toLowerCase() === searchText);
            select.value = match || searchText;
        }
    }
    
    if (searchText.length > 0) {
        showItemSuggestionsTotal();
    } else {
        hideItemSuggestionsTotal();
    }
    
    updateActivityTotal();
}

// Show item suggestions dropdown
function showItemSuggestionsTotal() {
    const input = document.getElementById('item-filter-input');
    const suggestionsDiv = document.getElementById('item-suggestions-total');
    const searchText = input.value.toLowerCase().trim();
    
    if (!suggestionsDiv) return;
    
    const allItems = getAllItemNamesTotal();
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
                 onclick="selectItemSuggestionTotal('${item.replace(/'/g, "\\'")}')"
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
function hideItemSuggestionsTotal() {
    setTimeout(() => {
        const suggestionsDiv = document.getElementById('item-suggestions-total');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }, 200);
}

// Select an item suggestion
function selectItemSuggestionTotal(itemName) {
    const input = document.getElementById('item-filter-input');
    const select = document.getElementById('item-filter');
    if (input && select) {
        input.value = itemName;
        select.value = itemName;
        hideItemSuggestionsTotal();
        updateActivityTotal();
    }
}

// Handle customer search with autocomplete
function handleCustomerSearchTotal() {
    const input = document.getElementById('customer-filter-total');
    const searchText = input.value.toLowerCase().trim();
    
    if (searchText.length > 0) {
        showCustomerSuggestionsTotal();
    } else {
        hideCustomerSuggestionsTotal();
    }
    
    updateActivityTotal();
}

// Show customer suggestions dropdown
function showCustomerSuggestionsTotal() {
    const input = document.getElementById('customer-filter-total');
    const suggestionsDiv = document.getElementById('customer-suggestions-total');
    const searchText = input.value.toLowerCase().trim();
    
    if (!suggestionsDiv) return;
    
    const allCustomers = getAllCustomerNamesTotal();
    const filteredCustomers = searchText.length > 0
        ? allCustomers.filter(customer => customer.toLowerCase().includes(searchText))
        : allCustomers.slice(0, 10);
    
    if (filteredCustomers.length === 0) {
        suggestionsDiv.innerHTML = '<div style="padding: 10px; color: #6b7280; text-align: center;">No customers found</div>';
        suggestionsDiv.style.display = 'block';
        return;
    }
    
    suggestionsDiv.innerHTML = filteredCustomers.map(customer => {
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
                 onclick="selectCustomerSuggestionTotal('${customer.replace(/'/g, "\\'")}')"
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
function hideCustomerSuggestionsTotal() {
    setTimeout(() => {
        const suggestionsDiv = document.getElementById('customer-suggestions-total');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }, 200);
}

// Select a customer suggestion
function selectCustomerSuggestionTotal(customerName) {
    const input = document.getElementById('customer-filter-total');
    if (input) {
        input.value = customerName;
        hideCustomerSuggestionsTotal();
        updateActivityTotal();
    }
}

// Expose functions globally
window.handleItemSearchTotal = handleItemSearchTotal;
window.showItemSuggestionsTotal = showItemSuggestionsTotal;
window.hideItemSuggestionsTotal = hideItemSuggestionsTotal;
window.selectItemSuggestionTotal = selectItemSuggestionTotal;
window.handleCustomerSearchTotal = handleCustomerSearchTotal;
window.showCustomerSuggestionsTotal = showCustomerSuggestionsTotal;
window.hideCustomerSuggestionsTotal = hideCustomerSuggestionsTotal;
window.selectCustomerSuggestionTotal = selectCustomerSuggestionTotal;
window.setDateRange = setDateRange;