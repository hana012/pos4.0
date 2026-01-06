// Shared Data Management System for SONIC COMPANY Shop Management

// Global Data Storage
let shopData = {
    items: {},
    customers: {},
    transactions: [],
    settings: {
        currency: 'USD',
        taxRate: 0,
        companyName: 'SONIC',
        lastItemId: 0,
        lastCustomerId: 0,
        lastTransactionId: 0
    }
};

// Data Management Functions
function saveData() {
    try {
        localStorage.setItem('sonic_shop_data', JSON.stringify(shopData));
        // Shop data saved successfully
        return true;
    } catch (error) {
        console.error('❌ Error saving shop data:', error);
        return false;
    }
}

function loadData() {
    try {
        const stored = localStorage.getItem('sonic_shop_data');
        if (stored) {
            shopData = JSON.parse(stored);
            // Shop data loaded successfully
            // Data summary loaded
        } else {
            // No existing data found, starting fresh
            initializeDefaultData();
        }
        return true;
    } catch (error) {
        console.error('❌ Error loading shop data:', error);
        initializeDefaultData();
        return false;
    }
}

function initializeDefaultData() {
    // No sample data - system starts empty
    // Only user-added items and customers will appear
    // System initialized with no sample data
    saveData();
}

// Item Management Functions
function addItem(itemData) {
    const itemId = ++shopData.settings.lastItemId;
    const item = {
        id: itemId,
        ...itemData,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    shopData.items[itemId] = item;
    saveData();
    return itemId;
}

function updateItem(itemId, itemData) {
    if (shopData.items[itemId]) {
        shopData.items[itemId] = {
            ...shopData.items[itemId],
            ...itemData,
            lastUpdated: new Date().toISOString()
        };
        saveData();
        return true;
    }
    return false;
}

function deleteItem(itemId) {
    if (shopData.items[itemId]) {
        delete shopData.items[itemId];
        saveData();
        return true;
    }
    return false;
}

function getItem(itemId) {
    return shopData.items[itemId] || null;
}

function getAllItems() {
    return Object.values(shopData.items);
}

function searchItems(query) {
    const items = getAllItems();
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.barcode.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
}

function getLowStockItems() {
    return getAllItems().filter(item => item.stockQuantity <= item.minStockLevel);
}

// Customer Management Functions
function addCustomer(customerData) {
    const customerId = ++shopData.settings.lastCustomerId;
    const customer = {
        id: customerId,
        ...customerData,
        currentBalance: customerData.currentBalance || 0.00,
        totalDebt: customerData.totalDebt || 0.00,
        totalPaid: customerData.totalPaid || 0.00,
        totalSpent: 0,
        registrationDate: new Date().toISOString(),
        purchaseHistory: []
    };
    
    shopData.customers[customerId] = customer;
    saveData();
    return customerId;
}

function updateCustomer(customerId, customerData) {
    if (shopData.customers[customerId]) {
        shopData.customers[customerId] = {
            ...shopData.customers[customerId],
            ...customerData,
            lastUpdated: new Date().toISOString()
        };
        saveData();
        return true;
    }
    return false;
}

function deleteCustomer(customerId) {
    if (shopData.customers[customerId]) {
        delete shopData.customers[customerId];
        saveData();
        return true;
    }
    return false;
}

function getCustomer(customerId) {
    // Getting customer data
    const customer = shopData.customers[customerId] || null;
    console.log('Customer found:', customer);
    return customer;
}

function getAllCustomers() {
    return Object.values(shopData.customers);
}

function searchCustomers(query) {
    const customers = getAllCustomers();
    const lowerQuery = query.toLowerCase();
    return customers.filter(customer => 
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(query) ||
        (customer.location && customer.location.toLowerCase().includes(lowerQuery))
    );
}

function updateCustomerBalance(customerId, amount, transactionType = 'purchase') {
    if (shopData.customers[customerId]) {
        const customer = shopData.customers[customerId];
        
        if (transactionType === 'purchase') {
            customer.currentBalance += amount;
            customer.totalSpent += amount;
        } else if (transactionType === 'payment') {
            customer.currentBalance -= amount;
        }
        
        saveData();
        return true;
    }
    return false;
}

// Transaction Management Functions
function addTransaction(transactionData) {
    const transactionId = ++shopData.settings.lastTransactionId;
    const transaction = {
        id: transactionId,
        ...transactionData,
        date: new Date().toISOString(),
        status: (transactionData.balance || transactionData.amount) > 0 ? 'partial' : 'paid'
    };
    
    shopData.transactions.push(transaction);
    
    // Update customer balance if customer is involved
    if (transactionData.customerId) {
        const amount = transactionData.balance || transactionData.amount || 0;
        updateCustomerBalance(transactionData.customerId, amount, 'purchase');
    }
    
    saveData();
    return transactionId;
}

function getAllTransactions() {
    return shopData.transactions;
}

function getCustomerTransactions(customerId) {
    return shopData.transactions.filter(transaction => transaction.customerId == customerId);
}

function getOutstandingTransactions() {
    return shopData.transactions.filter(transaction => 
        (transaction.balance || transaction.amount || 0) > 0 && 
        transaction.status !== 'completed'
    );
}

// Utility Functions
function formatCurrency(amount, currency = 'USD') {
    const symbol = currency === 'IQD' ? 'د.ع' : '$';
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Set color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            break;
        case 'info':
            notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
            break;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize data when script loads
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// Export functions for use in other modules
window.shopData = shopData;
window.addItem = addItem;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.getItem = getItem;
window.getAllItems = getAllItems;
window.searchItems = searchItems;
window.getLowStockItems = getLowStockItems;

window.addCustomer = addCustomer;
window.updateCustomer = updateCustomer;
window.deleteCustomer = deleteCustomer;
window.getCustomer = getCustomer;
window.getAllCustomers = getAllCustomers;
window.searchCustomers = searchCustomers;
window.updateCustomerBalance = updateCustomerBalance;

window.addTransaction = addTransaction;
window.getAllTransactions = getAllTransactions;
window.getCustomerTransactions = getCustomerTransactions;
window.getOutstandingTransactions = getOutstandingTransactions;

// Debt Management Functions
function addCustomerDebt(customerId, amount, description = '') {
    console.log('addCustomerDebt called with:', { customerId, amount, description });
    
    const customer = getCustomer(customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return false;
    }
    
    console.log('Customer found:', customer);
    console.log('Total debt before:', customer.totalDebt);
    console.log('Total paid before:', customer.totalPaid);
    
    // Ensure the customer has the required fields
    if (typeof customer.totalDebt === 'undefined') {
        customer.totalDebt = 0;
    }
    if (typeof customer.totalPaid === 'undefined') {
        customer.totalPaid = 0;
    }
    
    // Add to total debt
    customer.totalDebt += amount;
    
    console.log('Total debt after:', customer.totalDebt);
    console.log('New remaining balance:', customer.totalDebt - customer.totalPaid);
    
    // Add transaction record
    try {
        addTransaction({
            type: 'debt',
            customerId: customerId,
            amount: amount,
            description: description || 'Debt added',
            date: new Date().toISOString(),
            status: 'pending'
        });
        console.log('Transaction added successfully');
    } catch (transactionError) {
        console.error('Error adding transaction:', transactionError);
    }
    
    try {
        saveData();
        console.log(`✅ Debt of ${formatCurrency(amount)} added to ${customer.name}`);
        return true;
    } catch (saveError) {
        console.error('Error saving data:', saveError);
        return false;
    }
}

function addCustomerPayment(customerId, amount, description = '') {
    console.log('addCustomerPayment called with:', { customerId, amount, description });
    
    const customer = getCustomer(customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return false;
    }
    
    console.log('Customer found:', customer);
    console.log('Total debt before payment:', customer.totalDebt);
    console.log('Total paid before payment:', customer.totalPaid);
    
    // Ensure the customer has the required fields
    if (typeof customer.totalDebt === 'undefined') {
        customer.totalDebt = 0;
    }
    if (typeof customer.totalPaid === 'undefined') {
        customer.totalPaid = 0;
    }
    
    // Calculate current balance before payment
    const oldBalance = customer.totalDebt - customer.totalPaid;
    
    // Add payment to total paid
    customer.totalPaid += amount;
    
    // Calculate new balance after payment
    const newBalance = customer.totalDebt - customer.totalPaid;
    const paymentApplied = Math.min(amount, oldBalance);
    const creditAmount = amount - paymentApplied;
    
    console.log('Payment applied to debt:', paymentApplied);
    console.log('New balance after payment:', newBalance);
    console.log('Total paid after payment:', customer.totalPaid);
    
    // Add transaction record
    addTransaction({
        type: 'payment',
        customerId: customerId,
        amount: amount,
        description: description || 'Payment received',
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    saveData();
    
    if (creditAmount > 0) {
        console.log(`✅ Payment of ${formatCurrency(amount)} received from ${customer.name}. ${formatCurrency(paymentApplied)} applied to debt, ${formatCurrency(creditAmount)} as credit.`);
    } else {
        console.log(`✅ Payment of ${formatCurrency(amount)} received from ${customer.name}. Debt reduced by ${formatCurrency(paymentApplied)}.`);
    }
    
    return {
        paymentApplied: paymentApplied,
        remainingDebt: newBalance,
        creditAmount: creditAmount
    };
}

function getCustomerBalance(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        return null;
    }
    
    const totalDebt = customer.totalDebt || 0;
    const totalPaid = customer.totalPaid || 0;
    const creditLimit = customer.creditLimit || 0;
    
    // Calculate remaining balance: Total Debt - Total Paid
    const currentBalance = totalDebt - totalPaid;
    
    return {
        currentBalance: currentBalance,
        totalDebt: totalDebt,
        totalPaid: totalPaid,
        creditLimit: creditLimit,
        availableCredit: creditLimit - currentBalance
    };
}

function getCustomerDebtTransactions(customerId) {
    return shopData.transactions.filter(transaction => 
        transaction.customerId === customerId && 
        (transaction.type === 'debt' || transaction.type === 'payment')
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
}

window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.showNotification = showNotification;
window.saveData = saveData;
window.loadData = loadData;

// Export debt management functions
window.addCustomerDebt = addCustomerDebt;
window.addCustomerPayment = addCustomerPayment;
window.getCustomerBalance = getCustomerBalance;
window.getCustomerDebtTransactions = getCustomerDebtTransactions;

// File Export Functions
function exportToCSV(data, filename, headers = null) {
    try {
        let csvContent = '';
        
        // Add headers if provided
        if (headers && headers.length > 0) {
            csvContent += headers.join(',') + '\n';
        } else if (data.length > 0) {
            // Auto-generate headers from first object keys
            const autoHeaders = Object.keys(data[0]);
            csvContent += autoHeaders.join(',') + '\n';
        }
        
        // Add data rows
        data.forEach(row => {
            const values = Object.values(row).map(value => {
                // Handle values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += values.join(',') + '\n';
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`CSV file "${filename}" exported successfully!`, 'success');
        return true;
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showNotification('Error exporting CSV file: ' + error.message, 'error');
        return false;
    }
}

function exportInvoicesToCSV() {
    try {
        // Get invoices from localStorage
        const stored = localStorage.getItem('sonic_invoices');
        if (!stored) {
            showNotification('No invoices found to export', 'warning');
            return;
        }
        
        const invoices = JSON.parse(stored);
        if (invoices.length === 0) {
            showNotification('No invoices found to export', 'warning');
            return;
        }
        
        // Flatten invoice data for CSV
        const csvData = [];
        invoices.forEach(invoice => {
            const baseData = {
                'Invoice Number': invoice.invoiceNumber,
                'Date': invoice.date,
                'Customer': invoice.customerAccount || 'No Customer',
                'Currency': invoice.currency,
                'Payment Method': invoice.paymentMethod,
                'Subtotal': invoice.subtotal,
                'Discount': invoice.discount,
                'Total': invoice.total,
                'Total Quantity': invoice.totalQuantity
            };
            
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach((item, index) => {
                    const itemData = {
                        ...baseData,
                        'Item Row': index + 1,
                        'Barcode': item.barcode || '',
                        'Item Name': item.itemName || '',
                        'Quantity': item.quantity || 0,
                        'Unit Price': item.retailPrice || 0,
                        'Item Total': item.total || 0,
                        'Note': item.note || ''
                    };
                    csvData.push(itemData);
                });
            } else {
                csvData.push(baseData);
            }
        });
        
        const filename = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(csvData, filename);
    } catch (error) {
        console.error('Error exporting invoices:', error);
        showNotification('Error exporting invoices: ' + error.message, 'error');
    }
}

function exportCustomersToCSV() {
    try {
        const customers = getAllCustomers();
        if (customers.length === 0) {
            showNotification('No customers found to export', 'warning');
            return;
        }
        
        const csvData = customers.map(customer => ({
            'ID': customer.id,
            'Name': customer.name,
            'Phone': customer.phone,
            'Email': customer.email || '',
            'Address': customer.address || '',
            'Credit Limit': customer.creditLimit,
            'Payment Terms': customer.paymentTerms || '',
            'Discount Rate': customer.discountRate,
            'Current Balance': customer.currentBalance || 0,
            'Total Debt': customer.totalDebt || 0,
            'Total Paid': customer.totalPaid || 0,
            'Total Spent': customer.totalSpent || 0,
            'Registration Date': customer.registrationDate
        }));
        
        const filename = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(csvData, filename);
    } catch (error) {
        console.error('Error exporting customers:', error);
        showNotification('Error exporting customers: ' + error.message, 'error');
    }
}

function exportItemsToCSV() {
    try {
        const items = getAllItems();
        if (items.length === 0) {
            showNotification('No items found to export', 'warning');
            return;
        }
        
        const csvData = items.map(item => ({
            'ID': item.id,
            'Barcode': item.barcode,
            'Name': item.name,
            'Description': item.description || '',
            'Category': item.category || '',
            'Supplier': item.supplier || '',
            'Purchase Price': item.purchasePrice,
            'Retail Price': item.retailPrice,
            'Stock Quantity': item.stockQuantity,
            'Min Stock Level': item.minStockLevel,
            'Date Added': item.dateAdded,
            'Last Updated': item.lastUpdated
        }));
        
        const filename = `items_export_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(csvData, filename);
    } catch (error) {
        console.error('Error exporting items:', error);
        showNotification('Error exporting items: ' + error.message, 'error');
    }
}

function exportAllDataToCSV() {
    try {
        const allData = {
            invoices: [],
            customers: getAllCustomers(),
            items: getAllItems(),
            transactions: getAllTransactions()
        };
        
        // Get invoices from localStorage
        const stored = localStorage.getItem('sonic_invoices');
        if (stored) {
            allData.invoices = JSON.parse(stored);
        }
        
        // Create comprehensive CSV
        const csvData = [];
        
        // Add summary row
        csvData.push({
            'Data Type': 'SUMMARY',
            'Count': '',
            'Details': `Invoices: ${allData.invoices.length}, Customers: ${allData.customers.length}, Items: ${allData.items.length}, Transactions: ${allData.transactions.length}`
        });
        
        // Add invoices
        allData.invoices.forEach(invoice => {
            csvData.push({
                'Data Type': 'INVOICE',
                'ID/Number': invoice.invoiceNumber,
                'Date': invoice.date,
                'Customer': invoice.customerAccount || 'No Customer',
                'Total': invoice.total,
                'Currency': invoice.currency,
                'Payment Method': invoice.paymentMethod
            });
        });
        
        // Add customers
        allData.customers.forEach(customer => {
            csvData.push({
                'Data Type': 'CUSTOMER',
                'ID/Number': customer.id,
                'Name': customer.name,
                'Phone': customer.phone,
                'Email': customer.email || '',
                'Current Balance': customer.currentBalance || 0,
                'Credit Limit': customer.creditLimit
            });
        });
        
        // Add items
        allData.items.forEach(item => {
            csvData.push({
                'Data Type': 'ITEM',
                'ID/Number': item.id,
                'Name': item.name,
                'Barcode': item.barcode,
                'Category': item.category || '',
                'Retail Price': item.retailPrice,
                'Stock Quantity': item.stockQuantity
            });
        });
        
        const filename = `complete_data_export_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(csvData, filename);
    } catch (error) {
        console.error('Error exporting all data:', error);
        showNotification('Error exporting all data: ' + error.message, 'error');
    }
}

// Excel Export Functions (using HTML table approach)
function exportToExcel(data, filename, sheetName = 'Sheet1') {
    try {
        // Create HTML table
        let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <meta name="ExcelCreated" content="true">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>${sheetName}</x:Name>
                            <x:WorksheetOptions>
                                <x:DefaultRowHeight>285</x:DefaultRowHeight>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
        </head>
        <body>
            <table border="1">
        `;
        
        // Add headers
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            htmlContent += '<tr>';
            headers.forEach(header => {
                htmlContent += `<th style="background-color: #4f46e5; color: white; font-weight: bold; padding: 8px;">${header}</th>`;
            });
            htmlContent += '</tr>';
            
            // Add data rows
            data.forEach(row => {
                htmlContent += '<tr>';
                Object.values(row).forEach(value => {
                    htmlContent += `<td style="padding: 5px;">${value}</td>`;
                });
                htmlContent += '</tr>';
            });
        }
        
        htmlContent += `
            </table>
        </body>
        </html>
        `;
        
        // Create and download file
        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Excel file "${filename}" exported successfully!`, 'success');
        return true;
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showNotification('Error exporting Excel file: ' + error.message, 'error');
        return false;
    }
}

function exportInvoicesToExcel() {
    try {
        // Get invoices from localStorage
        const stored = localStorage.getItem('sonic_invoices');
        if (!stored) {
            showNotification('No invoices found to export', 'warning');
            return;
        }
        
        const invoices = JSON.parse(stored);
        if (invoices.length === 0) {
            showNotification('No invoices found to export', 'warning');
            return;
        }
        
        // Flatten invoice data for Excel
        const excelData = [];
        invoices.forEach(invoice => {
            const baseData = {
                'Invoice Number': invoice.invoiceNumber,
                'Date': invoice.date,
                'Customer': invoice.customerAccount || 'No Customer',
                'Currency': invoice.currency,
                'Payment Method': invoice.paymentMethod,
                'Subtotal': invoice.subtotal,
                'Discount': invoice.discount,
                'Total': invoice.total,
                'Total Quantity': invoice.totalQuantity
            };
            
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach((item, index) => {
                    const itemData = {
                        ...baseData,
                        'Item Row': index + 1,
                        'Barcode': item.barcode || '',
                        'Item Name': item.itemName || '',
                        'Quantity': item.quantity || 0,
                        'Unit Price': item.retailPrice || 0,
                        'Item Total': item.total || 0,
                        'Note': item.note || ''
                    };
                    excelData.push(itemData);
                });
            } else {
                excelData.push(baseData);
            }
        });
        
        const filename = `invoices_export_${new Date().toISOString().split('T')[0]}.xls`;
        exportToExcel(excelData, filename, 'Invoices');
    } catch (error) {
        console.error('Error exporting invoices to Excel:', error);
        showNotification('Error exporting invoices to Excel: ' + error.message, 'error');
    }
}

function exportCustomersToExcel() {
    try {
        const customers = getAllCustomers();
        if (customers.length === 0) {
            showNotification('No customers found to export', 'warning');
            return;
        }
        
        const excelData = customers.map(customer => ({
            'ID': customer.id,
            'Name': customer.name,
            'Phone': customer.phone,
            'Email': customer.email || '',
            'Address': customer.address || '',
            'Credit Limit': customer.creditLimit,
            'Payment Terms': customer.paymentTerms || '',
            'Discount Rate': customer.discountRate,
            'Current Balance': customer.currentBalance || 0,
            'Total Debt': customer.totalDebt || 0,
            'Total Paid': customer.totalPaid || 0,
            'Total Spent': customer.totalSpent || 0,
            'Registration Date': customer.registrationDate
        }));
        
        const filename = `customers_export_${new Date().toISOString().split('T')[0]}.xls`;
        exportToExcel(excelData, filename, 'Customers');
    } catch (error) {
        console.error('Error exporting customers to Excel:', error);
        showNotification('Error exporting customers to Excel: ' + error.message, 'error');
    }
}

function exportItemsToExcel() {
    try {
        const items = getAllItems();
        if (items.length === 0) {
            showNotification('No items found to export', 'warning');
            return;
        }
        
        const excelData = items.map(item => ({
            'ID': item.id,
            'Barcode': item.barcode,
            'Name': item.name,
            'Description': item.description || '',
            'Category': item.category || '',
            'Supplier': item.supplier || '',
            'Purchase Price': item.purchasePrice,
            'Retail Price': item.retailPrice,
            'Stock Quantity': item.stockQuantity,
            'Min Stock Level': item.minStockLevel,
            'Date Added': item.dateAdded,
            'Last Updated': item.lastUpdated
        }));
        
        const filename = `items_export_${new Date().toISOString().split('T')[0]}.xls`;
        exportToExcel(excelData, filename, 'Items');
    } catch (error) {
        console.error('Error exporting items to Excel:', error);
        showNotification('Error exporting items to Excel: ' + error.message, 'error');
    }
}

// Plain Text Export Functions
function exportToText(data, filename, headers = null) {
    try {
        let textContent = '';
        
        // Add headers if provided
        if (headers && headers.length > 0) {
            textContent += headers.join('\t') + '\n';
        } else if (data.length > 0) {
            // Auto-generate headers from first object keys
            const autoHeaders = Object.keys(data[0]);
            textContent += autoHeaders.join('\t') + '\n';
        }
        
        // Add data rows
        data.forEach(row => {
            const values = Object.values(row).map(value => {
                return String(value).replace(/\n/g, ' ').replace(/\t/g, ' ');
            });
            textContent += values.join('\t') + '\n';
        });
        
        // Create and download file
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Text file "${filename}" exported successfully!`, 'success');
        return true;
    } catch (error) {
        console.error('Error exporting text:', error);
        showNotification('Error exporting text file: ' + error.message, 'error');
        return false;
    }
}

// Export functions to window
window.exportToCSV = exportToCSV;
window.exportInvoicesToCSV = exportInvoicesToCSV;
window.exportCustomersToCSV = exportCustomersToCSV;
window.exportItemsToCSV = exportItemsToCSV;
window.exportAllDataToCSV = exportAllDataToCSV;

window.exportToExcel = exportToExcel;
window.exportInvoicesToExcel = exportInvoicesToExcel;
window.exportCustomersToExcel = exportCustomersToExcel;
window.exportItemsToExcel = exportItemsToExcel;

window.exportToText = exportToText;

// Combined Excel export for all data
function exportAllDataToExcel() {
    try {
        const allData = {
            invoices: [],
            customers: getAllCustomers(),
            items: getAllItems(),
            transactions: getAllTransactions()
        };
        
        // Get invoices from localStorage
        const stored = localStorage.getItem('sonic_invoices');
        if (stored) {
            allData.invoices = JSON.parse(stored);
        }
        
        // Create comprehensive Excel data
        const excelData = [];
        
        // Add summary row
        excelData.push({
            'Data Type': 'SUMMARY',
            'Count': '',
            'Details': `Invoices: ${allData.invoices.length}, Customers: ${allData.customers.length}, Items: ${allData.items.length}, Transactions: ${allData.transactions.length}`
        });
        
        // Add invoices
        allData.invoices.forEach(invoice => {
            excelData.push({
                'Data Type': 'INVOICE',
                'ID/Number': invoice.invoiceNumber,
                'Date': invoice.date,
                'Customer': invoice.customerAccount || 'No Customer',
                'Total': invoice.total,
                'Currency': invoice.currency,
                'Payment Method': invoice.paymentMethod
            });
        });
        
        // Add customers
        allData.customers.forEach(customer => {
            excelData.push({
                'Data Type': 'CUSTOMER',
                'ID/Number': customer.id,
                'Name': customer.name,
                'Phone': customer.phone,
                'Email': customer.email || '',
                'Current Balance': customer.currentBalance || 0,
                'Credit Limit': customer.creditLimit
            });
        });
        
        // Add items
        allData.items.forEach(item => {
            excelData.push({
                'Data Type': 'ITEM',
                'ID/Number': item.id,
                'Name': item.name,
                'Barcode': item.barcode,
                'Category': item.category || '',
                'Retail Price': item.retailPrice,
                'Stock Quantity': item.stockQuantity
            });
        });
        
        const filename = `complete_data_export_${new Date().toISOString().split('T')[0]}.xls`;
        exportToExcel(excelData, filename, 'Complete Data');
    } catch (error) {
        console.error('Error exporting all data to Excel:', error);
        showNotification('Error exporting all data to Excel: ' + error.message, 'error');
    }
}

window.exportAllDataToExcel = exportAllDataToExcel;

// Complete Data Export/Import Functions for VPS Migration
function exportAllDataToJSON() {
    try {
        const allData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                // ===== CORE SHOP DATA =====
                sonic_shop_data: localStorage.getItem('sonic_shop_data'), // Items, customers, transactions
                
                // ===== INVOICES SECTION =====
                sonic_invoices: localStorage.getItem('sonic_invoices'), // All invoices
                sonic_invoice_counter: localStorage.getItem('sonic_invoice_counter'), // Invoice counter
                
                // ===== RETURN SALES SECTION =====
                sonic_returns: localStorage.getItem('sonic_returns'), // Return sales
                sonic_return_counter: localStorage.getItem('sonic_return_counter'), // Return counter
                
                // ===== TRANSFER SECTION =====
                sonic_transfers: localStorage.getItem('sonic_transfers'), // Transfer records
                sonic_iqd_rate: localStorage.getItem('sonic_iqd_rate'), // Transfer exchange rate
                
                // ===== EXCHANGE RATES =====
                sonic_iqd_per_usd: localStorage.getItem('sonic_iqd_per_usd'), // IQD per USD rate
                
                // ===== ACTIVITY & TRACKING =====
                sonic_activity_data: localStorage.getItem('sonic_activity_data'), // Activity logs
                sonic_items_data: localStorage.getItem('sonic_items_data'), // Items activity data
                
                // ===== INVENTORY SECTION =====
                sonic_inventory_data: localStorage.getItem('sonic_inventory_data'), // Inventory records
                
                // ===== SERVICE MANAGEMENT =====
                sonic_services: localStorage.getItem('sonic_services'), // Service records
                
                // ===== DEBT MANAGEMENT =====
                sonic_debts: localStorage.getItem('sonic_debts'), // Debt records
                
                // ===== STORES SECTION =====
                sonic_stores: localStorage.getItem('sonic_stores'), // Store locations
                sonic_store_counter: localStorage.getItem('sonic_store_counter'), // Store counter
                
                // ===== SECURITY & SETTINGS =====
                sonic_security_state: localStorage.getItem('sonic_security_state') // Security settings
            }
        };
        
        // Create download
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sonic_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (window.showNotification) {
            window.showNotification('Complete data backup exported successfully!', 'success');
        } else {
            alert('✅ Complete data backup exported successfully!');
        }
        
        return allData;
    } catch (error) {
        console.error('Error exporting all data to JSON:', error);
        if (window.showNotification) {
            window.showNotification('Error exporting data: ' + error.message, 'error');
        } else {
            alert('❌ Error exporting data: ' + error.message);
        }
        return null;
    }
}

function importAllDataFromJSON(jsonData) {
    try {
        // Validate backup file structure
        if (!jsonData || !jsonData.data) {
            throw new Error('Invalid backup file format. Missing data section.');
        }
        
        const data = jsonData.data;
        let restoredCount = 0;
        
        // Restore shop data (items, customers, transactions)
        if (data.sonic_shop_data) {
            localStorage.setItem('sonic_shop_data', data.sonic_shop_data);
            restoredCount++;
            console.log('✅ Restored shop data (items, customers, transactions)');
        }
        
        // Restore invoices
        if (data.sonic_invoices) {
            localStorage.setItem('sonic_invoices', data.sonic_invoices);
            restoredCount++;
            console.log('✅ Restored invoices');
        }
        
        if (data.sonic_invoice_counter) {
            localStorage.setItem('sonic_invoice_counter', data.sonic_invoice_counter);
            console.log('✅ Restored invoice counter');
        }
        
        // Restore return sales
        if (data.sonic_returns) {
            localStorage.setItem('sonic_returns', data.sonic_returns);
            restoredCount++;
            console.log('✅ Restored return sales');
        }
        
        if (data.sonic_return_counter) {
            localStorage.setItem('sonic_return_counter', data.sonic_return_counter);
            console.log('✅ Restored return counter');
        }
        
        // Restore transfer data
        if (data.sonic_transfers) {
            localStorage.setItem('sonic_transfers', data.sonic_transfers);
            restoredCount++;
            console.log('✅ Restored transfer records');
        }
        
        if (data.sonic_iqd_rate) {
            localStorage.setItem('sonic_iqd_rate', data.sonic_iqd_rate);
            console.log('✅ Restored transfer exchange rate');
        }
        
        // Restore exchange rates
        if (data.sonic_iqd_per_usd) {
            localStorage.setItem('sonic_iqd_per_usd', data.sonic_iqd_per_usd);
            console.log('✅ Restored IQD per USD rate');
        }
        
        // Restore activity data
        if (data.sonic_activity_data) {
            localStorage.setItem('sonic_activity_data', data.sonic_activity_data);
            restoredCount++;
            console.log('✅ Restored activity data');
        }
        
        if (data.sonic_items_data) {
            localStorage.setItem('sonic_items_data', data.sonic_items_data);
            restoredCount++;
            console.log('✅ Restored items data');
        }
        
        // Restore inventory data
        if (data.sonic_inventory_data) {
            localStorage.setItem('sonic_inventory_data', data.sonic_inventory_data);
            restoredCount++;
            console.log('✅ Restored inventory data');
        }
        
        // Restore service data
        if (data.sonic_services) {
            localStorage.setItem('sonic_services', data.sonic_services);
            restoredCount++;
            console.log('✅ Restored service data');
        }
        
        // Restore security state
        if (data.sonic_security_state) {
            localStorage.setItem('sonic_security_state', data.sonic_security_state);
            restoredCount++;
            console.log('✅ Restored security state');
        }
        
        // Restore debt management
        if (data.sonic_debts) {
            localStorage.setItem('sonic_debts', data.sonic_debts);
            restoredCount++;
            console.log('✅ Restored debt data');
        }
        
        // Restore stores
        if (data.sonic_stores) {
            localStorage.setItem('sonic_stores', data.sonic_stores);
            restoredCount++;
            console.log('✅ Restored stores data');
        }
        
        if (data.sonic_store_counter) {
            localStorage.setItem('sonic_store_counter', data.sonic_store_counter);
            console.log('✅ Restored store counter');
        }
        
        // Reload data in memory
        if (typeof loadData === 'function') {
            loadData();
        }
        
        return {
            success: true,
            restoredCount: restoredCount,
            timestamp: jsonData.timestamp
        };
    } catch (error) {
        console.error('Error importing data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function restoreFromBackupFile() {
    try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // Validate backup file structure
                    if (!backupData.data) {
                        throw new Error('Invalid backup file format. Missing data section.');
                    }
                    
                    // Show backup info
                    const backupDate = backupData.timestamp ? new Date(backupData.timestamp).toLocaleString() : 'Unknown date';
                    const confirmMessage = `⚠️ RESTORE BACKUP WARNING ⚠️\n\nThis will REPLACE all current data with backup data from:\n${backupDate}\n\nCurrent data will be LOST!\n\nAre you sure you want to continue?`;
                    
                    if (confirm(confirmMessage)) {
                        const result = importAllDataFromJSON(backupData);
                        
                        if (result.success) {
                            const message = `✅ Restore successful!\n\nRestored ${result.restoredCount} data sections from backup created on:\n${backupDate}\n\nPlease refresh the page to see your restored data.`;
                            
                            if (window.showNotification) {
                                window.showNotification(message, 'success');
                            } else {
                                alert(message);
                            }
                            
                            // Optionally refresh the page
                            if (confirm('Refresh the page now to see restored data?')) {
                                window.location.reload();
                            }
                        } else {
                            throw new Error(result.error || 'Unknown error during restore');
                        }
                    }
                    
                } catch (error) {
                    console.error('Restore failed:', error);
                    const errorMsg = '❌ Restore failed!\n\nError: ' + error.message + '\n\nPlease check that you selected a valid backup file.';
                    if (window.showNotification) {
                        window.showNotification(errorMsg, 'error');
                    } else {
                        alert(errorMsg);
                    }
                }
            };
            
            reader.readAsText(file);
        };
        
        // Trigger file selection
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
        
    } catch (error) {
        console.error('Restore setup failed:', error);
        const errorMsg = '❌ Restore setup failed!\n\nError: ' + error.message;
        if (window.showNotification) {
            window.showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
    }
}

// Export functions to window
window.exportAllDataToJSON = exportAllDataToJSON;
window.importAllDataFromJSON = importAllDataFromJSON;
window.restoreFromBackupFile = restoreFromBackupFile;

// Store Management Functions
function initializeStores() {
    if (!localStorage.getItem('sonic_stores')) {
        const defaultStores = [
            { id: 1, name: 'Main Store', description: 'Main Store' },
            { id: 2, name: 'Big Store', description: 'Big Store' },
            { id: 3, name: 'Branch 1st', description: 'Branch 1st (Erbil, Koya Road)' },
            { id: 4, name: 'Branch 2nd', description: 'Branch 2nd (Erbil, Nishtiman Bazzar)' },
            { id: 5, name: 'Branch 3rd', description: 'Branch 3rd (Swrchi Bazzar)' }
        ];
        localStorage.setItem('sonic_stores', JSON.stringify(defaultStores));
        localStorage.setItem('sonic_store_counter', '6');
    }
}

function getAllStores() {
    initializeStores();
    try {
        const stored = localStorage.getItem('sonic_stores');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading stores:', error);
        return [];
    }
}

function addStore(storeData) {
    initializeStores();
    try {
        const stores = getAllStores();
        let storeCounter = parseInt(localStorage.getItem('sonic_store_counter')) || 1;
        
        const newStore = {
            id: storeCounter++,
            name: storeData.name || '',
            description: storeData.description || storeData.name || ''
        };
        
        stores.push(newStore);
        localStorage.setItem('sonic_stores', JSON.stringify(stores));
        localStorage.setItem('sonic_store_counter', storeCounter.toString());
        
        return newStore.id;
    } catch (error) {
        console.error('Error adding store:', error);
        showNotification('Error adding store: ' + error.message, 'error');
        return null;
    }
}

function updateStore(storeId, storeData) {
    try {
        const stores = getAllStores();
        const index = stores.findIndex(s => s.id === storeId);
        
        if (index >= 0) {
            stores[index] = {
                ...stores[index],
                name: storeData.name || stores[index].name,
                description: storeData.description || storeData.name || stores[index].description
            };
            localStorage.setItem('sonic_stores', JSON.stringify(stores));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating store:', error);
        showNotification('Error updating store: ' + error.message, 'error');
        return false;
    }
}

function deleteStore(storeId) {
    try {
        const stores = getAllStores();
        const filtered = stores.filter(s => s.id !== storeId);
        localStorage.setItem('sonic_stores', JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting store:', error);
        showNotification('Error deleting store: ' + error.message, 'error');
        return false;
    }
}

function getStore(storeId) {
    const stores = getAllStores();
    return stores.find(s => s.id === storeId);
}

// Make functions globally available
window.getAllStores = getAllStores;
window.addStore = addStore;
window.updateStore = updateStore;
window.deleteStore = deleteStore;
window.getStore = getStore;