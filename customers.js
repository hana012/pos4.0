// Customer Management System for SONIC COMPANY

let currentEditingCustomerId = null;
let customerToDelete = null;
let currentCustomerForPayment = null;

// Initialize the customers page
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    updateStatistics();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-customers').addEventListener('input', function(e) {
        filterCustomers(e.target.value);
    });
    
    // Form submission
    document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomer();
    });
    
    // Payment form submission
    document.getElementById('payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        savePayment();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const modals = ['customer-modal', 'customer-details-modal', 'payment-modal', 'delete-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'customer-modal') {
        currentEditingCustomerId = null;
    } else if (modalId === 'payment-modal') {
        currentCustomerForPayment = null;
    } else if (modalId === 'delete-modal') {
        customerToDelete = null;
    }
}

function loadCustomers() {
    const customers = getAllCustomers();
    const tbody = document.getElementById('customers-tbody');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No customers found. Click "Add New Customer" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>
                <div style="font-weight: 600;">${customer.name}</div>
                <div style="font-size: 12px; color: #6b7280;">ID: ${customer.id}</div>
            </td>
            <td>
                <div style="font-weight: 500;">${customer.phone}</div>
                <div style="font-size: 12px; color: #6b7280;">${customer.location || 'No location'}</div>
            </td>
            <td>${formatCurrency(customer.creditLimit)}</td>
            <td>
                <span class="${getBalanceClass(customer.currentBalance)}">
                    ${formatCurrency(customer.currentBalance)}
                </span>
            </td>
            <td>${formatCurrency(customer.totalSpent)}</td>
            <td>
                ${getCustomerStatus(customer)}
            </td>
            <td>
                <button class="btn btn-primary" onclick="viewCustomerDetails(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-warning" onclick="editCustomer(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="showDeleteCustomerModal(${customer.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterCustomers(query) {
    const customers = query ? searchCustomers(query) : getAllCustomers();
    const tbody = document.getElementById('customers-tbody');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No customers found matching "${query}"
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>
                <div style="font-weight: 600;">${customer.name}</div>
                <div style="font-size: 12px; color: #6b7280;">ID: ${customer.id}</div>
            </td>
            <td>
                <div style="font-weight: 500;">${customer.phone}</div>
                <div style="font-size: 12px; color: #6b7280;">${customer.location || 'No location'}</div>
            </td>
            <td>${formatCurrency(customer.creditLimit)}</td>
            <td>
                <span class="${getBalanceClass(customer.currentBalance)}">
                    ${formatCurrency(customer.currentBalance)}
                </span>
            </td>
            <td>${formatCurrency(customer.totalSpent)}</td>
            <td>
                ${getCustomerStatus(customer)}
            </td>
            <td>
                <button class="btn btn-primary" onclick="viewCustomerDetails(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-warning" onclick="editCustomer(${customer.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="showDeleteCustomerModal(${customer.id})" style="padding: 5px 10px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getBalanceClass(balance) {
    if (balance > 0) return 'balance-negative';
    if (balance < 0) return 'balance-positive';
    return 'balance-zero';
}

function getCustomerStatus(customer) {
    if (customer.currentBalance > customer.creditLimit) {
        return '<span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Over Limit</span>';
    } else if (customer.currentBalance > 0) {
        return '<span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Has Balance</span>';
    } else {
        return '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Paid Up</span>';
    }
}

function updateStatistics() {
    const customers = getAllCustomers();
    const customersWithBalance = customers.filter(c => c.currentBalance > 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    
    document.getElementById('total-customers').textContent = customers.length;
    document.getElementById('customers-with-balance').textContent = customersWithBalance.length;
    document.getElementById('total-outstanding').textContent = formatCurrency(totalOutstanding);
    document.getElementById('total-spent').textContent = formatCurrency(totalSpent);
}

function openAddCustomerModal() {
    currentEditingCustomerId = null;
    document.getElementById('modal-title').textContent = 'Add New Customer';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-modal').style.display = 'block';
}

function editCustomer(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    currentEditingCustomerId = customerId;
    document.getElementById('modal-title').textContent = 'Edit Customer';
    
    // Populate form with customer data
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-location').value = customer.location || '';
    document.getElementById('customer-payment-terms').value = customer.paymentTerms || '30 days';
    document.getElementById('customer-discount').value = customer.discountRate || 0;
    
    document.getElementById('customer-modal').style.display = 'block';
}

function closeCustomerModal() {
    document.getElementById('customer-modal').style.display = 'none';
    currentEditingCustomerId = null;
}

function saveCustomer() {
    const formData = {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        location: document.getElementById('customer-location').value.trim(),
        paymentTerms: document.getElementById('customer-payment-terms').value,
        discountRate: parseFloat(document.getElementById('customer-discount').value) || 0
    };
    
    // Validation
    if (!formData.name || !formData.phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        if (currentEditingCustomerId) {
            // Update existing customer
            updateCustomer(currentEditingCustomerId, formData);
            showNotification('Customer updated successfully', 'success');
        } else {
            // Add new customer
            addCustomer(formData);
            showNotification('Customer added successfully', 'success');
        }
        
        loadCustomers();
        updateStatistics();
        closeCustomerModal();
    } catch (error) {
        console.error('Error saving customer:', error);
        showNotification('Error saving customer', 'error');
    }
}

function viewCustomerDetails(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    const transactions = getCustomerTransactions(customerId);
    
    // Load all invoices for this customer
    let customerInvoices = [];
    try {
        const invoicesStored = localStorage.getItem('sonic_invoices');
        if (invoicesStored) {
            const allInvoices = JSON.parse(invoicesStored);
            customerInvoices = allInvoices.filter(inv => 
                inv.customerAccount === customer.name || inv.customerId === customerId
            );
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
    
    // Load all returns for this customer
    let customerReturns = [];
    try {
        const returnsStored = localStorage.getItem('sonic_returns');
        if (returnsStored) {
            const allReturns = JSON.parse(returnsStored);
            customerReturns = allReturns.filter(ret => 
                ret.customerAccount === customer.name || ret.customerId === customerId
            );
        }
    } catch (error) {
        console.error('Error loading returns:', error);
    }
    
    // Sort invoices and returns by date (newest first)
    customerInvoices.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateB - dateA;
    });
    
    customerReturns.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateB - dateA;
    });
    
    document.getElementById('customer-details-title').textContent = `${customer.name} - Details`;
    
    document.getElementById('customer-details-content').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
                <h4>Contact Information</h4>
                <p><strong>Name:</strong> ${customer.name}</p>
                <p><strong>Phone:</strong> ${customer.phone}</p>
                <p><strong>Location:</strong> ${customer.location || 'Not provided'}</p>
                <p><strong>Address:</strong> ${customer.address || 'Not provided'}</p>
            </div>
            <div>
                <h4>Account Information</h4>
                <p><strong>Credit Limit:</strong> ${formatCurrency(customer.creditLimit)}</p>
                <p><strong>Current Balance:</strong> <span class="${getBalanceClass(customer.currentBalance)}">${formatCurrency(customer.currentBalance)}</span></p>
                <p><strong>Total Spent:</strong> ${formatCurrency(customer.totalSpent)}</p>
                <p><strong>Payment Terms:</strong> ${customer.paymentTerms}</p>
                <p><strong>Discount Rate:</strong> ${customer.discountRate}%</p>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4>All Invoices (${customerInvoices.length})</h4>
            <div class="payment-history" style="max-height: 500px; overflow-y: auto;">
                ${customerInvoices.length === 0 ? 
                    '<p style="text-align: center; color: #6b7280; padding: 20px;">No invoices found</p>' :
                    customerInvoices.map((invoice, idx) => `
                        <div class="payment-entry" style="border-left: 3px solid #4f46e5; margin-bottom: 15px; padding: 12px; background: #f9fafb; border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <strong style="font-size: 14px;">${invoice.invoiceNumber || 'N/A'}</strong><br>
                                    <small style="color: #6b7280;">${invoice.date || 'N/A'} ${invoice.time || ''}</small><br>
                                    <small style="color: #6b7280;">Payment: ${invoice.paymentMethod || 'N/A'} | Currency: ${invoice.currency || 'USD'}</small>
                                    ${invoice.description ? `<br><small style="color: #6b7280; font-style: italic;">${invoice.description}</small>` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <div><strong style="font-size: 16px; color: #4f46e5;">${formatCurrency(invoice.total || 0)}</strong></div>
                                    <div style="font-size: 11px; color: #6b7280;">
                                        Subtotal: ${formatCurrency(invoice.subtotal || 0)}
                                        ${invoice.discount > 0 ? `<br>Discount: ${formatCurrency(invoice.discount || 0)}` : ''}
                                    </div>
                                    ${invoice.paidAmount > 0 ? `<div style="font-size: 11px; color: #059669; margin-top: 4px;">Paid: ${formatCurrency(invoice.paidAmount)}</div>` : ''}
                                </div>
                            </div>
                            
                            ${invoice.items && invoice.items.length > 0 ? `
                            <div style="margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                                <strong style="font-size: 12px; color: #374151;">Items (${invoice.items.length}):</strong>
                                <table style="width: 100%; margin-top: 8px; font-size: 11px; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                                            <th style="padding: 6px; text-align: left; font-weight: 600;">Item</th>
                                            <th style="padding: 6px; text-align: center; font-weight: 600;">Qty</th>
                                            <th style="padding: 6px; text-align: right; font-weight: 600;">Price</th>
                                            <th style="padding: 6px; text-align: right; font-weight: 600;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${invoice.items.map(item => `
                                            <tr style="border-bottom: 1px solid #f3f4f6;">
                                                <td style="padding: 6px;">
                                                    ${item.itemName || item.barcode || 'N/A'}
                                                    ${item.barcode && item.itemName !== item.barcode ? `<br><small style="color: #6b7280;">Barcode: ${item.barcode}</small>` : ''}
                                                    ${item.note ? `<br><small style="color: #9ca3af; font-style: italic;">Note: ${item.note}</small>` : ''}
                                                </td>
                                                <td style="padding: 6px; text-align: center;">${item.quantity || 0}</td>
                                                <td style="padding: 6px; text-align: right;">${formatCurrency(item.retailPrice || 0)}</td>
                                                <td style="padding: 6px; text-align: right; font-weight: 500;">${formatCurrency(item.total || (item.quantity || 0) * (item.retailPrice || 0))}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr style="background: #f9fafb; border-top: 2px solid #e5e7eb;">
                                            <td style="padding: 6px; font-weight: 600;" colspan="3">Total Quantity:</td>
                                            <td style="padding: 6px; text-align: right; font-weight: 600;">${invoice.totalQuantity || 0}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            ` : '<div style="margin-top: 8px; color: #6b7280; font-size: 11px;">No items found</div>'}
                        </div>
                    `).join('')
                }
            </div>
        </div>
        
        ${customerReturns.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <h4>All Returns (${customerReturns.length})</h4>
            <div class="payment-history" style="max-height: 500px; overflow-y: auto;">
                ${customerReturns.map(returnSale => `
                    <div class="payment-entry" style="border-left: 3px solid #dc2626; margin-bottom: 15px; padding: 12px; background: #fef2f2; border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <div>
                                <strong style="font-size: 14px;">${returnSale.returnNumber || 'N/A'}</strong> <span style="color: #dc2626; font-size: 11px;">(RETURN)</span><br>
                                <small style="color: #6b7280;">${returnSale.date || 'N/A'} ${returnSale.time || ''}</small><br>
                                <small style="color: #6b7280;">Payment: ${returnSale.paymentMethod || 'N/A'} | Currency: ${returnSale.currency || 'USD'}</small>
                                ${returnSale.description ? `<br><small style="color: #6b7280; font-style: italic;">${returnSale.description}</small>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div><strong style="font-size: 16px; color: #dc2626;">-${formatCurrency(returnSale.total || 0)}</strong></div>
                                <div style="font-size: 11px; color: #6b7280;">
                                    Subtotal: ${formatCurrency(returnSale.subtotal || 0)}
                                    ${returnSale.discount > 0 ? `<br>Discount: ${formatCurrency(returnSale.discount || 0)}` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${returnSale.items && returnSale.items.length > 0 ? `
                        <div style="margin-top: 10px; border-top: 1px solid #fecaca; padding-top: 10px;">
                            <strong style="font-size: 12px; color: #374151;">Items Returned (${returnSale.items.length}):</strong>
                            <table style="width: 100%; margin-top: 8px; font-size: 11px; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #fee2e2; border-bottom: 1px solid #fecaca;">
                                        <th style="padding: 6px; text-align: left; font-weight: 600;">Item</th>
                                        <th style="padding: 6px; text-align: center; font-weight: 600;">Qty</th>
                                        <th style="padding: 6px; text-align: right; font-weight: 600;">Price</th>
                                        <th style="padding: 6px; text-align: right; font-weight: 600;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${returnSale.items.map(item => `
                                        <tr style="border-bottom: 1px solid #fee2e2;">
                                            <td style="padding: 6px;">
                                                ${item.itemName || item.barcode || 'N/A'}
                                                ${item.barcode && item.itemName !== item.barcode ? `<br><small style="color: #6b7280;">Barcode: ${item.barcode}</small>` : ''}
                                                ${item.note ? `<br><small style="color: #9ca3af; font-style: italic;">Note: ${item.note}</small>` : ''}
                                            </td>
                                            <td style="padding: 6px; text-align: center;">${item.quantity || 0}</td>
                                            <td style="padding: 6px; text-align: right;">${formatCurrency(item.retailPrice || 0)}</td>
                                            <td style="padding: 6px; text-align: right; font-weight: 500;">${formatCurrency(item.total || (item.quantity || 0) * (item.retailPrice || 0))}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr style="background: #fef2f2; border-top: 2px solid #fecaca;">
                                        <td style="padding: 6px; font-weight: 600;" colspan="3">Total Quantity:</td>
                                        <td style="padding: 6px; text-align: right; font-weight: 600;">${returnSale.totalQuantity || 0}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        ` : '<div style="margin-top: 8px; color: #6b7280; font-size: 11px;">No items found</div>'}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div>
            <h4>Payment History</h4>
            <div class="payment-history">
                ${transactions.length === 0 ? 
                    '<p style="text-align: center; color: #6b7280; padding: 20px;">No transactions found</p>' :
                    transactions.map(transaction => `
                        <div class="payment-entry">
                            <div>
                                <strong>${transaction.invoiceNumber}</strong><br>
                                <small>${formatDate(transaction.date)}</small>
                            </div>
                            <div style="text-align: right;">
                                <div><strong>${formatCurrency(transaction.totalAmount)}</strong></div>
                                <div style="font-size: 12px; color: #6b7280;">
                                    Paid: ${formatCurrency(transaction.paidAmount)} | 
                                    Balance: <span class="${getBalanceClass(transaction.balance)}">${formatCurrency(transaction.balance)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
    
    currentCustomerForPayment = customerId;
    document.getElementById('customer-details-modal').style.display = 'block';
}

function closeCustomerDetailsModal() {
    document.getElementById('customer-details-modal').style.display = 'none';
    currentCustomerForPayment = null;
}

function addPayment() {
    if (!currentCustomerForPayment) {
        showNotification('No customer selected for payment', 'error');
        return;
    }
    
    const customer = getCustomer(currentCustomerForPayment);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    document.getElementById('payment-amount').max = customer.currentBalance;
    document.getElementById('payment-amount').placeholder = `Max: ${formatCurrency(customer.currentBalance)}`;
    document.getElementById('payment-form').reset();
    document.getElementById('payment-modal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    currentCustomerForPayment = null;
}

function savePayment() {
    if (!currentCustomerForPayment) {
        showNotification('No customer selected for payment', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const method = document.getElementById('payment-method').value;
    const notes = document.getElementById('payment-notes').value.trim();
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid payment amount', 'error');
        return;
    }
    
    const customer = getCustomer(currentCustomerForPayment);
    if (amount > customer.currentBalance) {
        showNotification('Payment amount cannot exceed current balance', 'error');
        return;
    }
    
    try {
        // Update customer balance
        updateCustomerBalance(currentCustomerForPayment, amount, 'payment');
        
        // Add payment transaction
        addTransaction({
            customerId: currentCustomerForPayment,
            invoiceNumber: `PAY-${Date.now()}`,
            items: [],
            totalAmount: 0,
            paidAmount: amount,
            balance: -amount, // Negative balance for payments
            paymentMethod: method,
            notes: notes
        });
        
        showNotification('Payment recorded successfully', 'success');
        loadCustomers();
        updateStatistics();
        closePaymentModal();
        
        // Refresh customer details if modal is open
        if (document.getElementById('customer-details-modal').style.display === 'block') {
            viewCustomerDetails(currentCustomerForPayment);
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Error recording payment', 'error');
    }
}

function showDeleteCustomerModal(customerId) {
    const customer = getCustomer(customerId);
    if (!customer) {
        showNotification('Customer not found', 'error');
        return;
    }
    
    if (customer.currentBalance > 0) {
        showNotification('Cannot delete customer with outstanding balance', 'error');
        return;
    }
    
    customerToDelete = customerId;
    document.getElementById('delete-modal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    customerToDelete = null;
}

function confirmDeleteCustomer() {
    if (customerToDelete) {
        try {
            // Call the actual delete function from shared.js
            const success = window.deleteCustomer(customerToDelete);
            if (success) {
                showNotification('Customer deleted successfully', 'success');
                loadCustomers();
                updateStatistics();
                closeDeleteModal();
            } else {
                showNotification('Error deleting customer', 'error');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            showNotification('Error deleting customer', 'error');
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
window.loadCustomers = loadCustomers;
window.updateStatistics = updateStatistics;
window.openAddCustomerModal = openAddCustomerModal;
window.editCustomer = editCustomer;
window.closeCustomerModal = closeCustomerModal;
window.saveCustomer = saveCustomer;
window.viewCustomerDetails = viewCustomerDetails;
window.closeCustomerDetailsModal = closeCustomerDetailsModal;
window.addPayment = addPayment;
window.closePaymentModal = closePaymentModal;
window.savePayment = savePayment;
window.showDeleteCustomerModal = showDeleteCustomerModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteCustomer = confirmDeleteCustomer;
window.showNotification = showNotification;
