// Dashboard System for SONIC COMPANY

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

function loadDashboard() {
    updateStatistics();
    loadLowStockItems();
    loadOutstandingBalances();
    loadRecentTransactions();
}

function updateStatistics() {
    const items = getAllItems();
    const customers = getAllCustomers();
    const transactions = getAllTransactions();
    const invoices = JSON.parse(localStorage.getItem('sonic_invoices') || '[]');
    
    // Calculate statistics
    const lowStockItems = getLowStockItems();
    const customersWithBalance = customers.filter(c => c.currentBalance > 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    
    // Update display
    document.getElementById('total-items').textContent = items.length;
    document.getElementById('total-customers').textContent = customers.length;
    document.getElementById('total-invoices').textContent = invoices.length;
    document.getElementById('low-stock-items').textContent = lowStockItems.length;
    document.getElementById('total-outstanding').textContent = formatCurrency(totalOutstanding);
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
}

function loadLowStockItems() {
    const lowStockItems = getLowStockItems();
    const container = document.getElementById('low-stock-list');
    
    if (lowStockItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>All items are well stocked!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lowStockItems.slice(0, 5).map(item => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-name">${item.name}</div>
                <div class="list-item-detail">Barcode: ${item.barcode} | Category: ${item.category}</div>
            </div>
            <div class="list-item-value">
                <span class="status-indicator status-low"></span>
                ${item.stockQuantity} / ${item.minStockLevel}
            </div>
        </div>
    `).join('');
    
    if (lowStockItems.length > 5) {
        container.innerHTML += `
            <div style="text-align: center; margin-top: 15px;">
                <small style="color: #6b7280;">And ${lowStockItems.length - 5} more items...</small>
            </div>
        `;
    }
}

function loadOutstandingBalances() {
    const customers = getAllCustomers();
    const customersWithBalance = customers.filter(c => c.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance);
    
    const container = document.getElementById('outstanding-balances-list');
    
    if (customersWithBalance.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-smile"></i>
                <p>No outstanding balances!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = customersWithBalance.slice(0, 5).map(customer => `
        <div class="list-item">
            <div class="list-item-info">
                <div class="list-item-name">${customer.name}</div>
                <div class="list-item-detail">${customer.phone} | Credit Limit: ${formatCurrency(customer.creditLimit)}</div>
            </div>
            <div class="list-item-value">
                <span class="status-indicator ${customer.currentBalance > customer.creditLimit ? 'status-low' : 'status-warning'}"></span>
                ${formatCurrency(customer.currentBalance)}
            </div>
        </div>
    `).join('');
    
    if (customersWithBalance.length > 5) {
        container.innerHTML += `
            <div style="text-align: center; margin-top: 15px;">
                <small style="color: #6b7280;">And ${customersWithBalance.length - 5} more customers...</small>
            </div>
        `;
    }
}

function loadRecentTransactions() {
    const transactions = getAllTransactions()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const container = document.getElementById('recent-transactions-list');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(transaction => {
        const customer = getCustomer(transaction.customerId);
        const customerName = customer ? customer.name : 'Unknown Customer';
        const statusClass = transaction.balance > 0 ? 'status-warning' : 'status-ok';
        const statusText = transaction.balance > 0 ? 'Outstanding' : 'Paid';
        
        return `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-name">${transaction.invoiceNumber}</div>
                    <div class="list-item-detail">${customerName} | ${formatDate(transaction.date)}</div>
                </div>
                <div class="list-item-value">
                    <span class="status-indicator ${statusClass}"></span>
                    ${formatCurrency(transaction.totalAmount)}
                </div>
            </div>
        `;
    }).join('');
}

function refreshDashboard() {
    showNotification('Refreshing dashboard data...', 'info');
    
    // Reload all data
    loadData();
    
    // Update dashboard
    setTimeout(() => {
        loadDashboard();
        showNotification('Dashboard refreshed successfully!', 'success');
    }, 500);
}

// Auto-refresh dashboard every 30 seconds
setInterval(() => {
    loadDashboard();
}, 30000);

// Export functions for use in other modules
window.loadDashboard = loadDashboard;
window.refreshDashboard = refreshDashboard;
