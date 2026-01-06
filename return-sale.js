


let rowCount = 1;
const maxRows = 100;
let selectedRowId = null;
let rowIds = [1];
let returnCounter = 1;
let savedReturns = [];
let currentReturnIndex = -1;
let isNavigating = false; // Prevent multiple navigation clicks

// Initialize the system
document.addEventListener('DOMContentLoaded', function() {
    // System initialized
    
    // Load from localStorage
        loadReturnsFromStorage();
        loadReturnCounterFromStorage();
        
    // Load customer list for autocomplete
    // Loading customer list...
    loadCustomerList();
    
    // Check for service invoice data from service management
    
    // Test customer search functionality
    if (typeof getAllCustomers === 'function') {
        const testCustomers = getAllCustomers();
        // Found customers in system
        if (testCustomers.length === 0) {
            // No customers found - search will not work until customers are added
            // Add a test customer for demonstration (remove this in production)
            if (typeof addCustomer === 'function') {
                // Adding test customer for search demonstration
                addCustomer({
                    name: 'Test Customer',
                    phone: '123-456-7890',
                    location: 'Test Location'
                });
            }
        }
    }
    
    
    initializeReturn();
    addEventListenersToRow(1);
    document.getElementById('discount').addEventListener('input', updateInvoiceSum);
    document.getElementById('discount-type').addEventListener('change', updateDiscountType);
    document.getElementById('currency').addEventListener('change', updateCurrencySymbol);
    document.getElementById('description').addEventListener('input', updateCustomerInfoDisplay);
    // Customer account field now uses input-based search like item names
    const customerAccountInput = document.getElementById('customer-account');
    customerAccountInput.addEventListener('input', function(event) {
        const query = event.target.value.trim();
        updateCustomerInfoDisplay(); // Update display first
        if (query.length > 0) {
            showCustomerSuggestions(query);
        } else {
            hideCustomerSuggestions();
        }
    });
    
    // Add keydown events for customer account
    customerAccountInput.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideCustomerSuggestions();
        }
    });
    
    // Hide suggestions when clicking outside
    customerAccountInput.addEventListener('blur', function() {
        setTimeout(() => hideCustomerSuggestions(), 200);
    });
    document.getElementById('payment-method').addEventListener('change', updateCustomerInfoDisplay);
    document.getElementById('currency').addEventListener('change', handleCurrencyChange);
    document.getElementById('paid-amount').addEventListener('input', calculateRemainingBalance);
    
    
    updateNavigationButtons();
    
    // Force update totals on page load
    setTimeout(() => {
        updateReturnSum();
        // Forced updateInvoiceSum on page load
    }, 500);
});

function initializeReturn() {
    // Set current date in DD/MM/YYYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;
    document.getElementById('return-date').textContent = dateString;
    
    // Set current time
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('return-time').textContent = timeString;
    
    // Generate return number (don't increment on page load, only when creating new)
    const returnNumber = 'RET-' + String(returnCounter).padStart(4, '0');
    document.getElementById('return-number').textContent = returnNumber;
    
    // Initialize currency tracking and symbols
    document.getElementById('currency').setAttribute('data-previous', 'USD');
    updateCurrencySymbols();
    // Initialize currency rate controls and conversion note
    initCurrencyRateControls();
}

function addEventListenersToRow(rowNumber) {
    const barcodeInput = document.getElementById(`barcode-${rowNumber}`);
    const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
    const quantityInput = document.getElementById(`quantity-${rowNumber}`);
    const priceInput = document.getElementById(`retail-price-${rowNumber}`);
    const noteInput = document.getElementById(`note-${rowNumber}`);
    
    if (quantityInput && priceInput) {
        quantityInput.addEventListener('input', () => updateRowTotal(rowNumber));
        priceInput.addEventListener('input', () => updateRowTotal(rowNumber));
        quantityInput.addEventListener('focus', () => addLoadingEffect(quantityInput));
        priceInput.addEventListener('focus', () => addLoadingEffect(priceInput));
    }
    
    // Add Enter key navigation for all inputs
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                itemNameInput.focus();
            }
        });
    }
    
    if (itemNameInput) {
        // Add autocomplete functionality for item names
        itemNameInput.addEventListener('input', function(event) {
            const query = event.target.value.trim();
            if (query.length > 0) {
                showItemSuggestions(query, rowNumber);
            } else {
                hideItemSuggestions(rowNumber);
            }
        });
        
        // Add keydown events for normal navigation
        itemNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                // If suggestions are visible, select first one, otherwise move to quantity
                const suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
                if (suggestionsContainer && suggestionsContainer.style.display !== 'none') {
                    const firstSuggestion = suggestionsContainer.querySelector('.item-suggestion');
                    if (firstSuggestion) {
                        firstSuggestion.click();
                        return;
                    }
                }
                quantityInput.focus();
            } else if (event.key === 'Escape') {
                hideItemSuggestions(rowNumber);
            }
        });
        
        // Hide suggestions when clicking outside
        itemNameInput.addEventListener('blur', function() {
            setTimeout(() => hideItemSuggestions(rowNumber), 200);
        });
        
        // Validate item exists when user finishes typing
        itemNameInput.addEventListener('blur', function() {
            const itemName = this.value.trim();
            if (itemName && !getItemByName(itemName)) {
                // Item doesn't exist - show warning but allow manual entry
                this.style.borderColor = '#f59e0b';
                showNotification(`⚠️ Item "${itemName}" not found in system. Please select from suggestions or add item first.`, 'warning', 4000);
            } else if (itemName && getItemByName(itemName)) {
                this.style.borderColor = '';
            }
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                priceInput.focus();
            }
        });
    }
    
    if (priceInput) {
        priceInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                noteInput.focus();
            }
        });
    }
    
    if (noteInput) {
        noteInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addRow();
            }
        });
    }
}

function addLoadingEffect(element) {
    element.classList.add('loading');
    setTimeout(() => {
        element.classList.remove('loading');
    }, 1000);
}

function updateRowTotal(rowNumber) {
    const quantity = parseFloat(document.getElementById(`quantity-${rowNumber}`).value) || 0;
    const retailPrice = parseFloat(document.getElementById(`retail-price-${rowNumber}`).value) || 0;
    const total = quantity * retailPrice;
    
    console.log(`updateRowTotal for row ${rowNumber}: quantity=${quantity}, price=${retailPrice}, total=${total}`);
    
    const totalElement = document.getElementById(`total-${rowNumber}`);
    if (totalElement) {
        totalElement.value = total.toFixed(2);
        console.log(`Set total-${rowNumber} to ${total.toFixed(2)}`);
    } else {
        console.error(`Total element not found for row ${rowNumber}`);
    }
    
    updateReturnSum();
}

function updateReturnSum() {
    let subtotal = 0;
    let totalQuantity = 0;
    
    console.log('updateInvoiceSum called, rowIds:', rowIds);
    
    rowIds.forEach(rowId => {
        const totalElement = document.getElementById(`total-${rowId}`);
        const quantityElement = document.getElementById(`quantity-${rowId}`);
        if (totalElement && quantityElement) {
            const rowTotal = parseFloat(totalElement.value) || 0;
            const quantity = parseFloat(quantityElement.value) || 0;
            console.log(`Row ${rowId}: total=${rowTotal}, quantity=${quantity}`);
            subtotal += rowTotal;
            totalQuantity += quantity;
        } else {
            console.log(`Row ${rowId}: elements not found`, { totalElement, quantityElement });
        }
    });
    
    const discountType = document.getElementById('discount-type').value;
    const discountInput = parseFloat(document.getElementById('discount').value) || 0;
    const paymentMethod = document.getElementById('payment-method').value;
    const paidAmount = paymentMethod === 'partial' ? parseFloat(document.getElementById('paid-amount').value) || 0 : 0;
    
    let discount = 0;
    if (discountType === 'percentage') {
        discount = (subtotal * discountInput) / 100;
    } else {
        discount = discountInput;
    }
    
    // Calculate final total: Subtotal - Discount - Amount Paid (for partial payments)
    let finalTotal = subtotal - discount;
    if (paymentMethod === 'partial') {
        finalTotal = finalTotal - paidAmount;
    }
    
    console.log('Calculated totals:', { subtotal, totalQuantity, discount, finalTotal });
    
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('total-sum').textContent = Math.max(0, finalTotal).toFixed(2);
    document.getElementById('total-quantity').textContent = totalQuantity;
}

function updateDiscountType() {
    const discountType = document.getElementById('discount-type').value;
    const discountInput = document.getElementById('discount');
    
    if (discountType === 'percentage') {
        discountInput.max = 100;
        discountInput.step = 0.01;
        discountInput.placeholder = '0.00';
    } else {
        discountInput.max = '';
        discountInput.step = 0.01;
        discountInput.placeholder = '0.00';
    }
    
    // Recalculate totals when discount type changes
    updateReturnSum();
}

function updateCurrencySymbol() {
    const currency = document.getElementById('currency').value;
    const symbol = currency === 'IQD' ? 'د.ع' : '$';
    document.getElementById('currency-symbol').textContent = symbol;
    document.getElementById('final-currency-symbol').textContent = symbol;
}

function updateCustomerInfoDisplay() {
    const customerAccount = document.getElementById('customer-account').value || '-';
    console.log('Customer Account:', document.getElementById('customer-account').value);
    const paymentMethod = document.getElementById('payment-method').value;
    const currency = document.getElementById('currency').value;
    
    // Get customer data for balance display
    const customer = getCustomerByName(customerAccount);
    console.log('Customer for display:', customer);
    
    // Format payment method for display
    const paymentMethodText = {
        'on-account': 'On Account',
        'cash': 'Cash',
        'partial': 'Partial Payment',
        'card': 'Card',
        'bank-transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod;
    
    // Format currency for display
    const currencyText = currency === 'IQD' ? 'IQD (د.ع)' : 'USD ($)';
    
    // Calculate totals for display
    const subtotalText = document.getElementById('subtotal').textContent;
    const totalSumText = document.getElementById('total-sum').textContent;
    const subtotal = parseFloat(subtotalText) || 0;
    const total = parseFloat(totalSumText) || 0;
    
    console.log('Display values:', { subtotalText, totalSumText, subtotal, total });
    
    document.getElementById('display-customer-account').textContent = customerAccount;
    
    // Update location and phone if customer exists
    if (customer) {
        document.getElementById('display-customer-location').textContent = customer.location || '-';
        document.getElementById('display-customer-phone').textContent = customer.phone || '-';
    } else {
        document.getElementById('display-customer-location').textContent = '-';
        document.getElementById('display-customer-phone').textContent = '-';
    }
    
    // Update description from input field
    const description = document.getElementById('description').value || '-';
    document.getElementById('display-description').textContent = description;
    
    document.getElementById('display-payment-method').textContent = paymentMethodText;
    document.getElementById('display-currency').textContent = currencyText;
    
    // Update balance display if customer exists
    if (customer) {
        const balance = customer.currentBalance || 0;
        const paid = customer.totalPaid || 0;
        console.log('Customer balance info:', { balance, paid });
        
        // Update balance display elements if they exist
        const balanceElement = document.getElementById('display-balance');
        const paidElement = document.getElementById('display-paid');
        
        if (balanceElement) {
            balanceElement.textContent = typeof formatCurrency === 'function' ? formatCurrency(balance) : `$${balance.toFixed(2)}`;
        }
        if (paidElement) {
            paidElement.textContent = typeof formatCurrency === 'function' ? formatCurrency(paid) : `$${paid.toFixed(2)}`;
        }
    }
}

function togglePartialPayment() {
    const paymentMethod = document.getElementById('payment-method').value;
    const partialPaymentGroup = document.getElementById('partial-payment-group');
    
    if (paymentMethod === 'partial') {
        partialPaymentGroup.style.display = 'block';
        calculateRemainingBalance();
    } else {
        partialPaymentGroup.style.display = 'none';
        document.getElementById('paid-amount').value = '';
    }
    
    updateCustomerInfoDisplay();
}

function calculateRemainingBalance() {
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (paymentMethod !== 'partial') {
        return;
    }
    
    // Update the totals first to get the correct final total
    updateReturnSum();
    
    const totalSumText = document.getElementById('total-sum').textContent;
    const finalTotal = parseFloat(totalSumText.replace(/[^0-9.-]/g, '')) || 0;
    const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
    
    // The remaining amount is now the final total (which already has paid amount subtracted)
    const remaining = finalTotal;
    
    // Update the display to show partial payment info
    const customerAccount = document.getElementById('customer-account').value;
    if (customerAccount) {
        const currency = document.getElementById('currency').value;
        const currencySymbol = currency === 'IQD' ? 'د.ع' : '$';
        
        let paymentText = `Partial: ${currencySymbol}${paidAmount.toFixed(2)} paid`;
        if (remaining > 0) {
            paymentText += `, ${currencySymbol}${remaining.toFixed(2)} on account`;
        } else {
            paymentText += ` (Fully Paid)`;
        }
        
        document.getElementById('display-payment-method').textContent = paymentText;
    }
}

function handleCurrencyChange() {
    const currency = document.getElementById('currency').value;
    const previousCurrency = document.getElementById('currency').getAttribute('data-previous') || 'USD';
    
    // Store current currency for next change
    document.getElementById('currency').setAttribute('data-previous', currency);
    
    // Only convert if we have items with prices
    if (rowIds.length > 0) {
        const rate = getConversionRate();
        if (currency === 'IQD' && previousCurrency === 'USD') {
            // Convert USD to IQD (multiply by rate)
            convertPrices(rate);
        } else if (currency === 'USD' && previousCurrency === 'IQD') {
            // Convert IQD to USD (divide by rate)
            convertPrices(1 / rate);
        }
    }
    
    // Update currency symbols
    updateCurrencySymbols();
    // Update conversion note
    updateCurrencyConversionNote(previousCurrency, currency);
    
    // Update totals and display
    updateReturnSum();
    updateCustomerInfoDisplay();
}

function convertPrices(conversionRate) {
    rowIds.forEach(rowId => {
        const priceElement = document.getElementById(`retail-price-${rowId}`);
        const totalElement = document.getElementById(`total-${rowId}`);
        
        if (priceElement && priceElement.value) {
            const currentPrice = parseFloat(priceElement.value) || 0;
            const newPrice = currentPrice * conversionRate;
            priceElement.value = newPrice.toFixed(2);
            
            // Update the total for this row
            const quantity = parseFloat(document.getElementById(`quantity-${rowId}`).value) || 0;
            const newTotal = newPrice * quantity;
            if (totalElement) {
                totalElement.value = newTotal.toFixed(2);
            }
        }
    });
    
    // Convert discount if it exists
    const discountElement = document.getElementById('discount');
    if (discountElement && discountElement.value) {
        const currentDiscount = parseFloat(discountElement.value) || 0;
        const newDiscount = currentDiscount * conversionRate;
        discountElement.value = newDiscount.toFixed(2);
    }
    
    // Convert paid amount if it exists
    const paidAmountElement = document.getElementById('paid-amount');
    if (paidAmountElement && paidAmountElement.value) {
        const currentPaidAmount = parseFloat(paidAmountElement.value) || 0;
        const newPaidAmount = currentPaidAmount * conversionRate;
        paidAmountElement.value = newPaidAmount.toFixed(2);
    }
}

function updateCurrencySymbols() {
    const currency = document.getElementById('currency').value;
    const currencySymbol = currency === 'IQD' ? 'د.ع' : '$';
    
    // Update currency symbols in the totals section
    document.getElementById('currency-symbol').textContent = currencySymbol;
    document.getElementById('final-currency-symbol').textContent = currencySymbol;
    
    // Update placeholder text for paid amount
    const paidAmountElement = document.getElementById('paid-amount');
    if (paidAmountElement) {
        paidAmountElement.placeholder = `0.00 ${currencySymbol}`;
    }
}

// Update the small helper label under the currency dropdown to show conversion direction and rate
function updateCurrencyConversionNote(previousCurrency, currentCurrency) {
    const prefixEl = document.getElementById('currency-conversion-prefix');
    if (!prefixEl) return;
    const rate = getConversionRate();
    const rateText = `1 USD = ${formatInteger(rate)} IQD`;
    if (previousCurrency === currentCurrency) {
        // Initial or unchanged selection
        prefixEl.textContent = currentCurrency === 'IQD' ? `Current: IQD (د.ع). ` : `Current: USD ($). `;
        return;
    }
    if (previousCurrency === 'USD' && currentCurrency === 'IQD') {
        prefixEl.textContent = `Converting USD → IQD at ${rateText} · `;
        return;
    }
    if (previousCurrency === 'IQD' && currentCurrency === 'USD') {
        prefixEl.textContent = `Converting IQD → USD at ${rateText} · `;
        return;
    }
    // Fallback
    prefixEl.textContent = `Current: ${currentCurrency}. `;
}

// Initialize the rate input and persist value
function initCurrencyRateControls() {
    const input = document.getElementById('iqd-rate-input');
    if (!input) {
        // Note might not be present on some pages
        updateCurrencyConversionNote('USD', 'USD');
        return;
    }
    const saved = getConversionRate();
    input.value = Math.round(saved);
    input.addEventListener('input', function() {
        const val = parseFloat(input.value);
        if (!isFinite(val) || val <= 0) {
            return;
        }
        setConversionRate(val);
        // Refresh note text to reflect new rate
        const current = document.getElementById('currency').value;
        const previous = document.getElementById('currency').getAttribute('data-previous') || current;
        updateCurrencyConversionNote(previous, current);
    });
    // Initial note
    updateCurrencyConversionNote('USD', 'USD');
}

// Persistent storage for rate (IQD per 1 USD)
function getConversionRate() {
    const raw = localStorage.getItem('sonic_iqd_per_usd');
    const num = parseFloat(raw);
    return isFinite(num) && num > 0 ? num : 1400;
}

function setConversionRate(value) {
    try {
        localStorage.setItem('sonic_iqd_per_usd', String(value));
    } catch (e) {
        console.warn('Failed to store conversion rate', e);
    }
}

function formatInteger(n) {
    try {
        return Math.round(n).toLocaleString('en-US');
    } catch (e) {
        return String(Math.round(n));
    }
}

function selectRow(rowId) {
    const allRows = document.querySelectorAll('#invoice-tbody tr');
    allRows.forEach(row => row.classList.remove('selected'));
    
    const selectedRow = document.getElementById(`row-${rowId}`);
    if (selectedRow) {
        if (selectedRowId === rowId) {
            selectedRowId = null;
            document.getElementById('delete-selected-btn').disabled = true;
        } else {
            selectedRow.classList.add('selected');
            selectedRowId = rowId;
            document.getElementById('delete-selected-btn').disabled = false;
        }
    }
}

function deleteSelectedRow() {
    if (!selectedRowId) {
        showNotification("Please select a row to delete.", "warning");
        return;
    }

    if (rowIds.length <= 1) {
        showNotification("Cannot delete the last remaining row.", "error");
        return;
    }

    if (confirm(`Are you sure you want to delete row ${selectedRowId}?`)) {
        const rowToDelete = document.getElementById(`row-${selectedRowId}`);
        if (rowToDelete) {
            rowToDelete.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                rowToDelete.remove();
                const index = rowIds.indexOf(selectedRowId);
                if (index > -1) {
                    rowIds.splice(index, 1);
                }
                renumberRows();
                selectedRowId = null;
                document.getElementById('delete-selected-btn').disabled = true;
                updateReturnSum();
                showNotification("Row deleted successfully.", "success");
            }, 300);
        }
    }
}

function renumberRows() {
    const tbody = document.getElementById('invoice-tbody');
    const rows = tbody.querySelectorAll('tr');
    const newRowIds = [];
    
    rows.forEach((row, index) => {
        const newRowNumber = index + 1;
        row.id = `row-${newRowNumber}`;
        row.querySelector('.row-number').textContent = newRowNumber;
        
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            const inputType = input.id.split('-')[0];
            input.id = `${inputType}-${newRowNumber}`;
        });
        
        row.setAttribute('onclick', `selectRow(${newRowNumber})`);
        addEventListenersToRow(newRowNumber);
        newRowIds.push(newRowNumber);
    });
    
    rowIds = newRowIds;
    rowCount = rowIds.length;
}

function createReturnRow(rowId) {
    const tbody = document.getElementById('invoice-tbody');
    const newRow = document.createElement('tr');
    newRow.id = `row-${rowId}`;
    newRow.setAttribute('onclick', `selectRow(${rowId})`);
    
    newRow.innerHTML = `
        <td class="row-number">${rowId}</td>
        <td><input type="text" id="barcode-${rowId}" placeholder="Scan barcode" onclick="event.stopPropagation()"></td>
        <td>
            <div style="display: flex; gap: 4px; align-items: center; position: relative;">
                <input type="text" id="item-name-${rowId}" placeholder="Enter item name" onclick="event.stopPropagation()" autocomplete="off" style="flex: 1;">
                <button type="button" onclick="openItemQuickSearch(${rowId})" class="quick-search-btn" title="Quick Search">
                    🔍
                </button>
            </div>
        </td>
        <td><input type="number" id="quantity-${rowId}" value="" min="0" step="1" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="retail-price-${rowId}" value="" min="0" step="0.01" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="total-${rowId}" value="" disabled onclick="event.stopPropagation()"></td>
        <td><input type="text" id="note-${rowId}" placeholder="Add note or service details (e.g., serial number, issue description)" onclick="event.stopPropagation()"></td>
    `;
    
    tbody.appendChild(newRow);
    addEventListenersToRow(rowId);
}

function addRow() {
    if (rowIds.length >= maxRows) {
        showNotification(`Maximum ${maxRows} rows allowed.`, "warning");
        return false;
    }

    const newRowId = Math.max(...rowIds) + 1;
    rowIds.push(newRowId);
    rowCount = rowIds.length;
    
    createReturnRow(newRowId);
    updateReturnSum();
    
    setTimeout(() => {
        document.getElementById(`barcode-${newRowId}`).focus();
    }, 300);
    
    return true;
}

function removeLastRow() {
    if (rowIds.length <= 1) {
        showNotification("Cannot remove the last remaining row.", "error");
        return false;
    }

    const lastRowId = Math.max(...rowIds);
    const rowToRemove = document.getElementById(`row-${lastRowId}`);
    if (rowToRemove) {
        rowToRemove.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            rowToRemove.remove();
            const index = rowIds.indexOf(lastRowId);
            if (index > -1) {
                rowIds.splice(index, 1);
            }
            rowCount = rowIds.length;
            
            if (selectedRowId === lastRowId) {
                selectedRowId = null;
                document.getElementById('delete-selected-btn').disabled = true;
            }
            
            updateReturnSum();
            showNotification("Last row removed successfully.", "success");
        }, 300);
    }
    
    return true;
}

async function saveReturn() {
    console.log('Save invoice function called');
    
    // Check if we have any data to save
    const hasData = hasReturnData();
    console.log('Has invoice data:', hasData);
    
    if (!hasData) {
        showNotification('No invoice data to save', 'error');
        return;
    }
    
    // Get save button if exists
    const saveButton = document.querySelector('.btn-save, button[onclick*="saveInvoice"]');
    let buttonLoaderId = null;
    
    try {
        // Show button loading if button exists
        try {
            if (saveButton && typeof window !== 'undefined' && window.LoadingManager) {
                buttonLoaderId = window.LoadingManager.showButtonLoading(saveButton, 'Saving...');
            }
        } catch (error) {
            console.warn('Could not show button loading:', error);
        }
        
        // Use the enhanced save function with customer integration
        await saveReturnWithCustomerIntegration();
        console.log('Invoice saved successfully');
        
        // Hide button loading
        try {
            if (saveButton && typeof window !== 'undefined' && window.LoadingManager) {
                window.LoadingManager.hideButtonLoading(saveButton);
            }
        } catch (error) {
            console.warn('Could not hide button loading:', error);
        }
    } catch (error) {
        console.error('Error saving invoice:', error);
        showNotification('Error saving invoice: ' + error.message, 'error');
        
        // Hide button loading on error
        try {
            if (saveButton && typeof window !== 'undefined' && window.LoadingManager) {
                window.LoadingManager.hideButtonLoading(saveButton);
            }
        } catch (error) {
            console.warn('Could not hide button loading:', error);
        }
    }
}

function newReturn() {
    // Save current return if it has data
    if (hasReturnData()) {
        saveReturn();
    }
    
    // Slide animation to new return
    const container = document.querySelector('.invoice-container');
    container.style.animation = 'slideOutLeft 0.3s ease-in';
    
    setTimeout(() => {
        // Clear current return data
        clearCurrentReturn();
        
        // Increment return counter for new return
        returnCounter++;
        saveReturnCounterToStorage();
        
        // Generate new return number
        const newReturnNumber = 'RET-' + String(returnCounter).padStart(4, '0');
        document.getElementById('return-number').textContent = newReturnNumber;
        
        // Reset current invoice index
        currentReturnIndex = -1;
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Slide in animation
        container.style.animation = 'slideInRight 0.3s ease-out';
        
        showNotification("New invoice created!", "success");
    }, 300);
}

function hasReturnData() {
    // Check if current return has any data
    const customerAccount = document.getElementById('customer-account').value;
    const hasItems = rowIds.some(rowId => {
        const barcode = document.getElementById(`barcode-${rowId}`).value;
        const itemName = document.getElementById(`item-name-${rowId}`).value;
        const quantity = parseFloat(document.getElementById(`quantity-${rowId}`).value) || 0;
        const price = parseFloat(document.getElementById(`retail-price-${rowId}`).value) || 0;
        return barcode || itemName || quantity > 0 || price > 0;
    });
    
    return customerAccount || hasItems;
}

function clearCurrentReturn() {
    // Reset form fields
    document.getElementById('customer-account').value = '';
    document.getElementById('currency').value = 'USD';
    document.getElementById('currency').setAttribute('data-previous', 'USD');
    document.getElementById('payment-method').value = 'on-account';
    document.getElementById('discount-type').value = 'amount';
    document.getElementById('discount').value = '0.00';
    document.getElementById('paid-amount').value = '';
    document.getElementById('partial-payment-group').style.display = 'none';
    
    // Update currency symbols
    updateCurrencySymbols();
    
    // Reset selection
    selectedRowId = null;
    document.getElementById('delete-selected-btn').disabled = true;
    
    // Remove all rows except the first one
    while (rowIds.length > 1) {
        removeLastRow();
    }
    
    // Clear the first row
    const firstRowId = rowIds[0];
    document.getElementById(`barcode-${firstRowId}`).value = '';
    document.getElementById(`item-name-${firstRowId}`).value = '';
    document.getElementById(`quantity-${firstRowId}`).value = '';
    document.getElementById(`retail-price-${firstRowId}`).value = '';
    document.getElementById(`total-${firstRowId}`).value = '';
    document.getElementById(`note-${firstRowId}`).value = '';
    
    updateCurrencySymbol();
    updateCustomerInfoDisplay();
    updateReturnSum();
}

function previousReturn() {
    if (isNavigating) {
        console.log('Navigation already in progress, ignoring click');
        return;
    }
    
    console.log(`Previous invoice clicked. Current index: ${currentReturnIndex}, Total invoices: ${savedReturns.length}`);
    
    if (savedReturns.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    isNavigating = true;
    
    if (currentReturnIndex > 0) {
        currentReturnIndex--;
        loadReturn(currentReturnIndex, 'previous');
    } else if (currentReturnIndex === 0) {
        // Go to the last invoice (wrap around)
        currentReturnIndex = savedReturns.length - 1;
        loadReturn(currentReturnIndex, 'previous');
    } else {
        // currentReturnIndex is -1 (new invoice), go to last saved invoice
        currentReturnIndex = savedReturns.length - 1;
        loadReturn(currentReturnIndex, 'previous');
    }
}

function nextReturn() {
    if (isNavigating) {
        console.log('Navigation already in progress, ignoring click');
        return;
    }
    
    console.log(`Next invoice clicked. Current index: ${currentReturnIndex}, Total invoices: ${savedReturns.length}`);
    
    if (savedReturns.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    isNavigating = true;
    
    if (currentReturnIndex < savedReturns.length - 1) {
        currentReturnIndex++;
        loadReturn(currentReturnIndex, 'next');
    } else if (currentReturnIndex === savedReturns.length - 1) {
        // Go to the first invoice (wrap around)
        currentReturnIndex = 0;
        loadReturn(currentReturnIndex, 'next');
    } else {
        // currentReturnIndex is -1 (new invoice), go to first saved invoice
        currentReturnIndex = 0;
        loadReturn(currentReturnIndex, 'next');
    }
}


function loadReturn(index, direction = 'next') {
    if (index < 0 || index >= savedReturns.length) {
        console.error(`Invalid invoice index: ${index}. Total invoices: ${savedReturns.length}`);
        showNotification("Error: Invalid invoice index.", "error");
        return;
    }
    
    console.log(`Loading invoice at index ${index}, direction: ${direction}`);
    const invoice = savedReturns[index];
    
    // Validate invoice data
    if (!invoice) {
        console.error(`Invoice at index ${index} is null or undefined`);
        showNotification("Error: Invoice data is corrupted.", "error");
        return;
    }
    
    // Directional slide animation
    const container = document.querySelector('.invoice-container');
    if (!container) {
        console.error('Invoice container not found');
        showNotification("Error: Invoice container not found.", "error");
        return;
    }
    
    // Determine slide direction
    if (direction === 'previous') {
        container.style.animation = 'slideOutRight 0.3s ease-in';
    } else {
        container.style.animation = 'slideOutLeft 0.3s ease-in';
    }
    
    setTimeout(() => {
        try {
            // Load invoice data with null checks
            const invoiceNumberEl = document.getElementById('return-number');
            const customerAccountEl = document.getElementById('customer-account');
            const currencyEl = document.getElementById('currency');
            const paymentMethodEl = document.getElementById('payment-method');
            const discountTypeEl = document.getElementById('discount-type');
            const discountEl = document.getElementById('discount');
            
            if (invoiceNumberEl) invoiceNumberEl.textContent = invoice.invoiceNumber || 'RET-0000';
            if (customerAccountEl) customerAccountEl.value = invoice.customerAccount || '';
            if (currencyEl) currencyEl.value = invoice.currency || 'USD';
            if (paymentMethodEl) paymentMethodEl.value = invoice.paymentMethod || 'on-account';
            if (discountTypeEl) discountTypeEl.value = invoice.discountType || 'amount';
            if (discountEl) discountEl.value = invoice.discountInput || 0;
        
            // Clear current rows synchronously
            const tbody = document.getElementById('invoice-tbody');
            if (tbody) {
                tbody.innerHTML = '';
            }
            rowIds = [];
            rowCount = 0;
            
            // Add rows for invoice items with error handling
            if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
                invoice.items.forEach((item, idx) => {
                    if (idx === 0) {
                        // Create first row
                        createReturnRow(1);
                        rowIds = [1];
                        loadRowData(1, item);
                    } else {
                        // Create additional rows
                        const newRowId = idx + 1;
                        createReturnRow(newRowId);
                        rowIds.push(newRowId);
                        loadRowData(newRowId, item);
                    }
                });
            } else {
                // If no items, ensure we have at least one empty row
                createReturnRow(1);
                rowIds = [1];
            }
            
            updateCurrencySymbol();
            updateCustomerInfoDisplay();
            updateReturnSum();
            updateNavigationButtons();
            
            // Directional slide in animation
            if (direction === 'previous') {
                container.style.animation = 'slideInLeft 0.3s ease-out';
            } else {
                container.style.animation = 'slideInRight 0.3s ease-out';
            }
            
            // Reset navigation lock after animation completes
            setTimeout(() => {
                isNavigating = false;
            }, 300);
        } catch (error) {
            console.error('Error loading invoice:', error);
            showNotification('Error loading invoice: ' + error.message, 'error');
            
            // Reset to safe state
            currentReturnIndex = -1;
            updateNavigationButtons();
            isNavigating = false;
        }
    }, 300);
}

function loadRowData(rowId, item) {
    try {
        if (!item) {
            console.warn(`Item data is null for row ${rowId}`);
            return;
        }
        
        const barcodeEl = document.getElementById(`barcode-${rowId}`);
        const itemNameEl = document.getElementById(`item-name-${rowId}`);
        const quantityEl = document.getElementById(`quantity-${rowId}`);
        const priceEl = document.getElementById(`retail-price-${rowId}`);
        const totalEl = document.getElementById(`total-${rowId}`);
        const noteEl = document.getElementById(`note-${rowId}`);
        
        if (barcodeEl) barcodeEl.value = item.barcode || '';
        if (itemNameEl) itemNameEl.value = item.itemName || '';
        if (quantityEl) quantityEl.value = item.quantity || 0;
        if (priceEl) priceEl.value = item.retailPrice || 0;
        if (totalEl) totalEl.value = item.total || 0;
        if (noteEl) noteEl.value = item.note || '';
    } catch (error) {
        console.error(`Error loading row data for row ${rowId}:`, error);
    }
}

function clearFirstRow() {
    try {
        if (rowIds.length === 0) {
            console.warn('No rows to clear');
            return;
        }
        
        const firstRowId = rowIds[0];
        const barcodeEl = document.getElementById(`barcode-${firstRowId}`);
        const itemNameEl = document.getElementById(`item-name-${firstRowId}`);
        const quantityEl = document.getElementById(`quantity-${firstRowId}`);
        const priceEl = document.getElementById(`retail-price-${firstRowId}`);
        const totalEl = document.getElementById(`total-${firstRowId}`);
        const noteEl = document.getElementById(`note-${firstRowId}`);
        
        if (barcodeEl) barcodeEl.value = '';
        if (itemNameEl) itemNameEl.value = '';
        if (quantityEl) quantityEl.value = '';
        if (priceEl) priceEl.value = '';
        if (totalEl) totalEl.value = '';
        if (noteEl) noteEl.value = '';
    } catch (error) {
        console.error('Error clearing first row:', error);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const counter = document.getElementById('return-counter');
    
    console.log(`Updating navigation buttons. Current index: ${currentReturnIndex}, Total invoices: ${savedReturns.length}`);
    
    // Always enable navigation buttons if we have saved invoices (with wrap-around)
    prevBtn.disabled = savedReturns.length === 0;
    nextBtn.disabled = savedReturns.length === 0;
    
    // Update counter display with more detailed information
    if (savedReturns.length === 0) {
        counter.textContent = "New Invoice";
        counter.title = "No saved invoices available";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    } else if (currentReturnIndex === -1) {
        const newReturnNumber = `RET-${String(returnCounter).padStart(4, '0')}`;
        counter.textContent = `New (${newReturnNumber}) / ${savedReturns.length}`;
        counter.title = `Creating new return ${newReturnNumber}. ${savedReturns.length} saved returns available.`;
        // Enable both buttons when on new invoice
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    } else {
        const current = currentReturnIndex + 1;
        const total = savedReturns.length;
        const currentInvoiceNumber = savedReturns[currentReturnIndex].invoiceNumber;
        counter.textContent = `${currentInvoiceNumber} (${current}/${total})`;
        counter.title = `Currently viewing ${currentInvoiceNumber}. ${current} of ${total} saved invoices.`;
        // Enable both buttons for navigation with wrap-around
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }
    
    // Add visual indicators for current position
    if (savedReturns.length > 0) {
        prevBtn.title = currentReturnIndex === -1 ? 
            `Go to last invoice (${savedReturns[savedReturns.length - 1].invoiceNumber})` : 
            `Go to previous invoice (${currentReturnIndex > 0 ? savedReturns[currentReturnIndex - 1].invoiceNumber : savedReturns[savedReturns.length - 1].invoiceNumber})`;
        nextBtn.title = currentReturnIndex === -1 ? 
            `Go to first invoice (${savedReturns[0].invoiceNumber})` : 
            `Go to next invoice (${currentReturnIndex < savedReturns.length - 1 ? savedReturns[currentReturnIndex + 1].invoiceNumber : savedReturns[0].invoiceNumber})`;
    }
}

// Function to jump to a specific invoice by number
function jumpToInvoice(invoiceNumber) {
    if (savedReturns.length === 0) {
        showNotification("No saved invoices to navigate to.", "warning");
        return;
    }
    
    // Find the invoice by number
    const index = savedReturns.findIndex(invoice => 
        invoice.invoiceNumber === invoiceNumber || 
        invoice.invoiceNumber === `RET-${String(invoiceNumber).padStart(4, '0')}`
    );
    
    if (index !== -1) {
        currentReturnIndex = index;
        loadReturn(currentReturnIndex, 'next');
        showNotification(`Jumped to invoice ${invoiceNumber}`, "success");
    } else {
        showNotification(`Invoice ${invoiceNumber} not found.`, "error");
    }
}

// Function to search for invoice by number
function searchReturn() {
    const searchInput = document.getElementById('return-search-input');
    if (!searchInput) {
        console.error('Invoice search input not found');
        return;
    }
    
    const searchValue = searchInput.value.trim();
    if (!searchValue) {
        showNotification("Please enter an invoice number to search.", "warning");
        return;
    }
    
    // Normalize the search value
    let searchNumber = searchValue;
    if (!searchNumber.startsWith('RET-')) {
        // If user enters just the number, add RET- prefix
        const number = parseInt(searchNumber);
        if (!isNaN(number)) {
            searchNumber = `RET-${String(number).padStart(4, '0')}`;
        } else {
            searchNumber = `RET-${searchNumber}`;
        }
    }
    
    // Find the invoice
    const index = savedReturns.findIndex(invoice => 
        invoice.invoiceNumber === searchNumber ||
        invoice.invoiceNumber === searchValue
    );
    
    if (index !== -1) {
        currentReturnIndex = index;
        loadReturn(currentReturnIndex, 'next');
        showNotification(`Found invoice ${searchNumber}`, "success");
        searchInput.value = ''; // Clear the search input
    } else {
        showNotification(`Invoice ${searchNumber} not found.`, "error");
    }
}

// Function to handle Enter key press in search input
function handleReturnSearch(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchReturn();
    }
}

// Function to show invoice list for quick navigation
function showReturnList() {
    console.log('Invoice list requested. Current state:', {
        savedReturnsLength: savedReturns.length,
        currentReturnIndex: currentReturnIndex,
        savedReturns: savedReturns
    });
    
    if (savedReturns.length === 0) {
        showNotification("No saved invoices to display.", "warning");
        return;
    }
    
    let message = "Saved Invoices:\n";
    savedReturns.forEach((invoice, index) => {
        const isCurrent = index === currentReturnIndex ? " ← Current" : "";
        message += `${index + 1}. ${invoice.invoiceNumber} - ${invoice.customerAccount || 'No customer'}${isCurrent}\n`;
    });
    
    alert(message);
}




function printReturn() {
    // Update customer info display before printing
    updateCustomerInfoDisplay();
    
    setTimeout(() => {
        window.print();
    }, 1000);
}

function cancelReturn() {
    if (confirm("Are you sure you want to cancel this invoice? All data will be lost.")) {
        // Reset form fields
        document.getElementById('customer-account').value = '';
        document.getElementById('currency').value = 'USD';
        document.getElementById('currency').setAttribute('data-previous', 'USD');
        document.getElementById('payment-method').value = 'on-account';
        document.getElementById('discount-type').value = 'amount';
        document.getElementById('discount').value = '0.00';
        document.getElementById('paid-amount').value = '';
        document.getElementById('partial-payment-group').style.display = 'none';
        
        // Update currency symbols
        updateCurrencySymbols();
        
        // Reset selection
        selectedRowId = null;
        document.getElementById('delete-selected-btn').disabled = true;
        
        // Remove all rows except the first one
        while (rowIds.length > 1) {
            removeLastRow();
        }
        
        // Clear the first row
        const firstRowId = rowIds[0];
        document.getElementById(`barcode-${firstRowId}`).value = '';
        document.getElementById(`item-name-${firstRowId}`).value = '';
        document.getElementById(`quantity-${firstRowId}`).value = '';
        document.getElementById(`retail-price-${firstRowId}`).value = '';
        document.getElementById(`total-${firstRowId}`).value = '';
        document.getElementById(`note-${firstRowId}`).value = '';
        
        updateCurrencySymbol();
        updateCustomerInfoDisplay();
        updateReturnSum();
        showNotification("Invoice cancelled successfully.", "info");
    }
}

function showNotification(message, type) {
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        saveInvoice();
    }
    
    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        addRow();
    }
    
    
    if (event.key === 'Delete' && selectedRowId) {
        event.preventDefault();
        deleteSelectedRow();
    }
});

// localStorage functions for permanent data storage
function saveReturnsToStorage() {
    try {
        localStorage.setItem('sonic_returns', JSON.stringify(savedReturns));
        console.log('Returns saved to localStorage');
    } catch (error) {
        console.error('Error saving invoices to localStorage:', error);
        showNotification('Error saving returns to storage', 'error');
    }
}

function loadReturnsFromStorage() {
    try {
        const stored = localStorage.getItem('sonic_returns');
        if (stored) {
            savedReturns = JSON.parse(stored);
            console.log('Returns loaded from localStorage:', savedReturns.length);
        }
    } catch (error) {
        console.error('Error loading returns from localStorage:', error);
        savedReturns = [];
    }
}

function saveReturnCounterToStorage() {
    try {
        localStorage.setItem('sonic_return_counter', returnCounter.toString());
    } catch (error) {
        console.error('Error saving return counter:', error);
    }
}

function loadReturnCounterFromStorage() {
    try {
        const stored = localStorage.getItem('sonic_return_counter');
        if (stored) {
            returnCounter = parseInt(stored);
        }
    } catch (error) {
        console.error('Error loading return counter:', error);
    }
}

// Function to clear all saved data (for testing/reset)
function clearAllData() {
    if (confirm('Are you sure you want to clear all saved returns? This cannot be undone.')) {
        localStorage.removeItem('sonic_returns');
        localStorage.removeItem('sonic_return_counter');
        savedReturns = [];
        returnCounter = 1;
        currentReturnIndex = -1;
        clearCurrentReturn();
        updateNavigationButtons();
        showNotification('All data cleared', 'info');
    }
}

// Function to clear ALL system data (invoices, customers, items)
function clearAllSystemData() {
    if (confirm('⚠️ WARNING: This will clear ALL system data including:\n\n• All saved invoices\n• All customer data\n• All item data\n• All transaction history\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?')) {
        try {
            // Clear all localStorage data
            localStorage.removeItem('sonic_returns');
            localStorage.removeItem('sonic_return_counter');
            localStorage.removeItem('sonic_shop_data');
            localStorage.removeItem('sonic_security_state');
            
            // Clear session storage
            sessionStorage.removeItem('sonic_logged_in');
            sessionStorage.removeItem('sonic_username');
            sessionStorage.removeItem('sonic_login_time');
            
            // Reset all variables
            savedReturns = [];
            returnCounter = 1;
            currentReturnIndex = -1;
            
            // Clear current invoice
            clearCurrentReturn();
            updateNavigationButtons();
            
            // Reload the page to reinitialize with default data
            showNotification('All system data cleared! Reloading page...', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing system data:', error);
            showNotification('Error clearing data: ' + error.message, 'error');
        }
    }
}

// Function to force reload all data from localStorage
function forceReloadData() {
    try {
        // Reload invoices
        loadReturnsFromStorage();
        loadReturnCounterFromStorage();
        
        // Reload shared data if available
        if (typeof loadData === 'function') {
            loadData();
        }
        
        // Update UI
        updateNavigationButtons();
        updateReturnSum();
        
        showNotification('Data reloaded successfully!', 'success');
    } catch (error) {
        console.error('Error reloading data:', error);
        showNotification('Error reloading data: ' + error.message, 'error');
    }
}

// Global clear data function - can be called from anywhere
function clearAllDataGlobal() {
    if (confirm('⚠️ WARNING: This will clear ALL system data including:\n\n• All saved invoices\n• All customer data\n• All item data\n• All transaction history\n• All debt records\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?')) {
        try {
            // Clear all localStorage data
            localStorage.removeItem('sonic_returns');
            localStorage.removeItem('sonic_return_counter');
            localStorage.removeItem('sonic_shop_data');
            localStorage.removeItem('sonic_security_state');
            
            // Clear session storage
            sessionStorage.removeItem('sonic_logged_in');
            sessionStorage.removeItem('sonic_username');
            sessionStorage.removeItem('sonic_login_time');
            
            // Show success message
            showNotification('All system data cleared! Redirecting to login...', 'success');
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing data:', error);
            showNotification('Error clearing data: ' + error.message, 'error');
        }
    }
}

// Navigation functions for the integrated system
function goToHome() {
    window.location.href = 'index.html';
}





function openItemManagement() {
    window.open('items.html', '_blank');
}

function openCustomerManagement() {
    window.open('customers.html', '_blank');
}

function openDashboard() {
    window.open('dashboard.html', '_blank');
}

// Customer management integration
function loadCustomerList() {
    console.log('loadCustomerList called');
    const customers = getAllCustomers();
    console.log('Customers loaded:', customers);
    const datalist = document.getElementById('customer-list');
    
    if (datalist) {
        datalist.innerHTML = customers.map(customer => 
            `<option value="${customer.name}" data-customer-id="${customer.id}">${customer.name} - ${customer.phone}</option>`
        ).join('');
        console.log('Customer datalist updated with', customers.length, 'customers');
    } else {
        console.error('Customer datalist element not found');
    }
}

function getCustomerByName(name) {
    console.log('getCustomerByName called with:', name);
    const customers = getAllCustomers();
    console.log('All customers:', customers);
    const customer = customers.find(customer => customer.name.toLowerCase() === name.toLowerCase());
    console.log('Customer found by name:', customer);
    return customer;
}

// Enhanced save function to integrate with customer system
async function saveReturnWithCustomerIntegration() {
    console.log('Starting saveInvoiceWithCustomerIntegration');
    
    // Show loading overlay (only if LoadingManager is available and not already showing)
    try {
        if (typeof window !== 'undefined' && window.LoadingManager) {
            window.LoadingManager.showOverlay('Saving return...', false);
        }
    } catch (error) {
        console.warn('LoadingManager not available:', error);
    }
    console.log('formatCurrency function available:', typeof formatCurrency);
    console.log('addCustomerDebt function available:', typeof addCustomerDebt);
    try {
        // Update customer info display before saving
        updateCustomerInfoDisplay();
    
    const customerName = document.getElementById('customer-account').value.trim();
    const customer = getCustomerByName(customerName);
    
    // Get total values with debugging
    const totalQuantityText = document.getElementById('total-quantity').textContent;
    const subtotalText = document.getElementById('subtotal').textContent;
    const totalSumText = document.getElementById('total-sum').textContent;
    const discountValue = document.getElementById('discount').value;
    
    console.log('Total calculation values:', {
        totalQuantityText,
        subtotalText,
        totalSumText,
        discountValue,
        customerName,
        customer
    });
    
    // Handle partial payment
    const paymentMethod = document.getElementById('payment-method').value;
    const paidAmount = paymentMethod === 'partial' ? parseFloat(document.getElementById('paid-amount').value) || 0 : 0;
    // For partial payments, the remaining amount is the final total (which already has paid amount subtracted)
    const remainingAmount = paymentMethod === 'partial' ? (parseFloat(totalSumText) || 0) : 0;

    const returnData = {
        returnNumber: document.getElementById('return-number').textContent,
        date: document.getElementById('return-date').textContent,
        customerAccount: customerName,
        customerId: customer ? customer.id : null,
        currency: document.getElementById('currency').value,
        paymentMethod: paymentMethod,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        items: [],
        totalQuantity: parseInt(totalQuantityText) || 0,
        discountType: document.getElementById('discount-type').value,
        discountInput: parseFloat(discountValue) || 0,
        discount: parseFloat(discountValue) || 0,
        subtotal: parseFloat(subtotalText) || 0,
        total: parseFloat(totalSumText) || 0
    };
    
    console.log('Invoice data calculated:', invoiceData);

    rowIds.forEach(rowId => {
        const barcodeElement = document.getElementById(`barcode-${rowId}`);
        const itemNameElement = document.getElementById(`item-name-${rowId}`);
        const quantityElement = document.getElementById(`quantity-${rowId}`);
        const priceElement = document.getElementById(`retail-price-${rowId}`);
        const totalElement = document.getElementById(`total-${rowId}`);
        const noteElement = document.getElementById(`note-${rowId}`);

        if (barcodeElement && itemNameElement && quantityElement && priceElement && totalElement && noteElement) {
            const quantity = parseFloat(quantityElement.value) || 0;
            const price = parseFloat(priceElement.value) || 0;
            
            if (quantity > 0 || price > 0 || barcodeElement.value || itemNameElement.value) {
                returnData.items.push({
                    rowNumber: rowId,
                    barcode: barcodeElement.value,
                    itemName: itemNameElement.value,
                    quantity: quantity,
                    retailPrice: price,
                    total: parseFloat(totalElement.value) || 0,
                    note: noteElement.value
                });
            }
        }
    });

    // Save to savedReturns array
    if (currentReturnIndex >= 0) {
        savedReturns[currentReturnIndex] = returnData;
    } else {
        savedReturns.push(returnData);
        currentReturnIndex = savedReturns.length - 1;
    }

    // Save to localStorage
    saveReturnsToStorage();
    saveReturnCounterToStorage();
    
    // Record inventory activities for each item returned (reverse sale)
    recordInventoryActivities(returnData);
    
    // Update inventory stock levels for returned items (ADD stock back)
    if (typeof window.updateInventoryStockOnReturn === 'function') {
        returnData.items.forEach(item => {
            if (item.quantity > 0 && item.itemName) {
                window.updateInventoryStockOnReturn(item.itemName, item.quantity);
            }
        });
    }
    
    // Handle payment/refund based on payment method - SUBTRACT from customer balance
    try {
        console.log('Customer found:', customer);
        console.log('Payment method:', document.getElementById('payment-method').value);
        console.log('addCustomerPayment function available:', typeof addCustomerPayment);
        
        if (customer && returnData.total > 0) {
            // For returns, we SUBTRACT from customer balance using addCustomerPayment
            if (typeof addCustomerPayment === 'function') {
                console.log('Processing return payment for customer:', customer.id, 'Amount:', returnData.total);
                try {
                    const paymentResult = addCustomerPayment(customer.id, returnData.total, `Return ${returnData.returnNumber} - ${paymentMethod}`);
                    console.log('Payment result:', paymentResult);
                    if (paymentResult) {
                        const refundAmount = typeof formatCurrency === 'function' ? formatCurrency(returnData.total) : `$${returnData.total.toFixed(2)}`;
                        const saveLocation = 'Local Storage';
                        showNotification(`Return ${returnData.returnNumber} saved to ${saveLocation}! Refund of ${refundAmount} applied to ${customer.name}'s account (balance reduced).`, 'success');
                    } else {
                        console.error('Failed to process payment - addCustomerPayment returned false');
                        const saveLocation = 'Local Storage';
                        showNotification(`Return ${returnData.returnNumber} saved to ${saveLocation}! (Balance update failed)`, 'warning');
                    }
                } catch (paymentError) {
                    console.error('Error calling addCustomerPayment:', paymentError);
                    showNotification(`Return ${returnData.returnNumber} saved! (Balance update error: ${paymentError.message})`, 'warning');
                }
            } else {
                console.warn('addCustomerPayment function not available, saving without balance update');
                const saveLocation = 'Local Storage';
                showNotification(`Return ${returnData.returnNumber} saved to ${saveLocation}!`, 'success');
            }
                    } else {
                        const saveLocation = 'Local Storage';
            showNotification(`Return saved to ${saveLocation}! Items: ${returnData.items.length}, Total: ${returnData.total.toFixed(2)}`, "success");
        }
        
        // Hide loading overlay
        try {
            if (typeof window !== 'undefined' && window.LoadingManager) {
                window.LoadingManager.removeOverlay();
            }
        } catch (error) {
            console.warn('Error hiding loading overlay:', error);
        }
    } catch (debtError) {
        console.error('Error handling debt management:', debtError);
        console.error('Error details:', debtError.stack);
        
        // Hide loading overlay on error
        try {
            if (typeof window !== 'undefined' && window.LoadingManager) {
                window.LoadingManager.removeOverlay();
            }
        } catch (error) {
            console.warn('Error hiding loading overlay:', error);
        }
        
        const saveLocation = 'Local Storage';
        showNotification(`Return ${returnData.returnNumber} saved to ${saveLocation}! (Balance update error)`, 'success');
    }

    console.log('Return Data:', returnData);
    
    // Update navigation buttons after saving
    updateNavigationButtons();
    
    } catch (error) {
        console.error('Error in saveInvoiceWithCustomerIntegration:', error);
        showNotification('Error saving invoice: ' + error.message, 'error');
    }
}


// Removed old function - replaced with new dropdown search
function showItemSearchResults_OLD(items, targetInput) {
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'item-search-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937;">Items Starting with "${items[0].name.charAt(0).toUpperCase()}"</h3>
            <button onclick="closeSearchOverlay()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${items.map(item => `
                <div class="search-result-item" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="selectItem('${item.name}', '${item.barcode}', '${item.retailPrice}', '${targetInput.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${item.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">Barcode: ${item.barcode} | Stock: ${item.stockQuantity}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #10b981;">${formatCurrency(item.retailPrice)}</div>
                            <div style="font-size: 12px; color: #6b7280;">${item.category}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add hover effects
    const resultItems = modal.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f8fafc';
            this.style.borderColor = '#4f46e5';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.borderColor = '#e5e7eb';
        });
    });
    
    // Close on escape key
    overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchOverlay();
        }
    });
    
    // Close on click outside
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeSearchOverlay();
        }
    });
}

function showCustomerSearchResults(customers, targetInput) {
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'customer-search-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937;">Customers Starting with "${customers[0].name.charAt(0).toUpperCase()}"</h3>
            <button onclick="closeSearchOverlay()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${customers.map(customer => `
                <div class="search-result-item" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="selectCustomer('${customer.name}', '${targetInput.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${customer.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">${customer.phone} | ${customer.email || 'No email'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: ${customer.currentBalance > 0 ? '#ef4444' : '#10b981'};">
                                ${customer.currentBalance > 0 ? 'Remaining:' : (customer.currentBalance < 0 ? 'Credit:' : 'Paid in Full')} ${formatCurrency(customer.currentBalance)}
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">Credit Limit: ${formatCurrency(customer.creditLimit)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add hover effects
    const resultItems = modal.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f8fafc';
            this.style.borderColor = '#4f46e5';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.borderColor = '#e5e7eb';
        });
    });
    
    // Close on escape key
    overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchOverlay();
        }
    });
    
    // Close on click outside
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeSearchOverlay();
        }
    });
}

function selectItem(itemName, barcode, price, targetInputId) {
    // Find the row number from the target input ID
    const rowNumber = targetInputId.split('-')[1];
    
    // Fill in the item details
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    document.getElementById(`barcode-${rowNumber}`).value = barcode;
    document.getElementById(`retail-price-${rowNumber}`).value = price;
    
    // Update the row total
    updateRowTotal(rowNumber);
    
    // Close the overlay
    closeSearchOverlay();
    
    // Move focus to quantity field
    document.getElementById(`quantity-${rowNumber}`).focus();
    
    showNotification(`Item "${itemName}" selected`, 'success');
}

function selectCustomer(customerName, targetInputId) {
    // Fill in the customer name
    document.getElementById(targetInputId).value = customerName;
    
    // Update customer info display
    updateCustomerInfoDisplay();
    
    // Close the overlay
    closeSearchOverlay();
    
    showNotification(`Customer "${customerName}" selected`, 'success');
}

function closeSearchOverlay() {
    const overlay = document.getElementById('item-search-overlay') || document.getElementById('customer-search-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Quick Search functionality
function openItemQuickSearch(rowNumber) {
    const allItems = getAllItems();
    
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.id = 'item-quick-search-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 700px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    `;
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1f2937;">Quick Search Items</h3>
            <button onclick="closeItemQuickSearch()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="margin-bottom: 15px;">
            <input type="text" id="item-quick-filter" placeholder="Filter by name, barcode, or category..." 
                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" autocomplete="off">
        </div>
        <div id="item-quick-results" style="flex: 1; overflow-y: auto; max-height: 400px;">
            ${allItems.map(item => {
                const isService = item.itemType === 'service';
                const serviceStyle = isService ? 'border-left: 4px solid #3b82f6; background: #f8fafc;' : '';
                const serviceIcon = isService ? '🔧 ' : '';
                const stockInfo = isService ? 'Service Item' : `Stock: ${item.stockQuantity}`;
                
                return `
                    <div class="item-quick-result" onclick="selectItemFromQuickSearch('${item.name}', '${item.barcode}', '${item.retailPrice}', ${rowNumber})" style="
                        padding: 15px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        ${serviceStyle}
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${serviceIcon}${item.name}</div>
                                <div style="font-size: 12px; color: #6b7280;">Barcode: ${item.barcode} | ${stockInfo} | Category: ${item.category}</div>
                                ${isService ? '<div style="font-size: 11px; color: #3b82f6; font-weight: 500; margin-top: 2px;">Service Item - No Stock Tracking</div>' : ''}
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: #10b981; font-size: 16px;">${formatCurrency(item.retailPrice)}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add filter functionality
    const filterInput = document.getElementById('item-quick-filter');
    const resultsContainer = document.getElementById('item-quick-results');
    
    filterInput.addEventListener('input', function(event) {
        const filterQuery = event.target.value.toLowerCase();
        const filteredItems = allItems.filter(item => 
            item.name.toLowerCase().includes(filterQuery) ||
            item.barcode.toLowerCase().includes(filterQuery) ||
            item.category.toLowerCase().includes(filterQuery)
        );
        
        resultsContainer.innerHTML = filteredItems.map(item => {
            const isService = item.itemType === 'service';
            const serviceStyle = isService ? 'border-left: 4px solid #3b82f6; background: #f8fafc;' : '';
            const serviceIcon = isService ? '🔧 ' : '';
            const stockInfo = isService ? 'Service Item' : `Stock: ${item.stockQuantity}`;
            
            return `
                <div class="item-quick-result" onclick="selectItemFromQuickSearch('${item.name}', '${item.barcode}', '${item.retailPrice}', ${rowNumber})" style="
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    ${serviceStyle}
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${serviceIcon}${item.name}</div>
                            <div style="font-size: 12px; color: #6b7280;">Barcode: ${item.barcode} | ${stockInfo} | Category: ${item.category}</div>
                            ${isService ? '<div style="font-size: 11px; color: #3b82f6; font-weight: 500; margin-top: 2px;">Service Item - No Stock Tracking</div>' : ''}
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #10b981; font-size: 16px;">${formatCurrency(item.retailPrice)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (filteredItems.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280; font-style: italic;">No items match your search</div>';
        }
    });
    
    // Add hover effects
    const addHoverEffects = () => {
        const resultItems = resultsContainer.querySelectorAll('.item-quick-result');
        resultItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = '#f8fafc';
                this.style.borderColor = '#4f46e5';
            });
            item.addEventListener('mouseleave', function() {
                this.style.background = 'white';
                this.style.borderColor = '#e5e7eb';
            });
        });
    };
    
    addHoverEffects();
    
    // Re-add hover effects after filtering
    filterInput.addEventListener('input', () => {
        setTimeout(addHoverEffects, 10);
    });
    
    // Close on escape key
    overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeItemQuickSearch();
        }
    });
    
    // Close on click outside
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeItemQuickSearch();
        }
    });
    
    // Focus the filter input
    setTimeout(() => filterInput.focus(), 100);
}

function closeItemQuickSearch() {
    const overlay = document.getElementById('item-quick-search-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function selectItemFromQuickSearch(itemName, barcode, price, rowNumber) {
    // Fill in the item details
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    document.getElementById(`barcode-${rowNumber}`).value = barcode;
    document.getElementById(`retail-price-${rowNumber}`).value = price;
    
    // Check if this is a service item and highlight the row
    const itemData = getItemByName(itemName);
    if (itemData && itemData.itemType === 'service') {
        const row = document.getElementById(`row-${rowNumber}`);
        if (row) {
            row.style.borderLeft = '4px solid #3b82f6';
            row.style.background = '#f8fafc';
        }
        
        // Set default quantity to 1 for services
        document.getElementById(`quantity-${rowNumber}`).value = 1;
        
        // Update the row total
        updateRowTotal(rowNumber);
        
        showNotification(`🔧 Service item "${itemName}" selected. Use notes field to track item details.`, 'success');
    } else {
        // Update the row total
        updateRowTotal(rowNumber);
        
        showNotification(`Item "${itemName}" selected`, 'success');
    }
    
    // Close the overlay
    closeItemQuickSearch();
    
    // Move focus to quantity field
    document.getElementById(`quantity-${rowNumber}`).focus();
}

// Customer suggestions functionality
function showCustomerSuggestions(query) {
    console.log('showCustomerSuggestions called with query:', query);
    const allCustomers = getAllCustomers();
    console.log('All customers:', allCustomers);
    const matchingCustomers = allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.toLowerCase().includes(query.toLowerCase()) ||
        (customer.location && customer.location.toLowerCase().includes(query.toLowerCase()))
    );
    console.log('Matching customers:', matchingCustomers);
    
    const suggestionsContainer = document.getElementById('customer-suggestions');
    
    if (matchingCustomers.length === 0) {
        // Show a message if no customers exist at all
        if (allCustomers.length === 0) {
            suggestionsContainer.innerHTML = `
                <div class="customer-suggestion" style="color: #6b7280; font-style: italic;">
                    No customers found. Add customers in the Customers page first.
                </div>
            `;
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
        return;
    }
    
    suggestionsContainer.innerHTML = matchingCustomers.slice(0, 5).map(customer => {
        const balance = customer.currentBalance || 0;
        const balanceText = typeof formatCurrency === 'function' ? formatCurrency(balance) : `$${balance.toFixed(2)}`;
        const balanceLabel = balance > 0 ? 'Remaining:' : (balance < 0 ? 'Credit:' : 'Paid in Full');
        return `
            <div class="customer-suggestion" onclick="selectCustomerFromSuggestion('${customer.name}')">
                <div class="customer-suggestion-name">${customer.name}</div>
                <div class="customer-suggestion-details">Phone: ${customer.phone} | Location: ${customer.location || 'No location'}</div>
                <div class="customer-suggestion-balance">${balanceLabel} ${balanceText}</div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideCustomerSuggestions() {
    const suggestionsContainer = document.getElementById('customer-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// Smart item search with intelligent ranking
function calculateItemRelevance(item, query) {
    const lowerQuery = query.toLowerCase().trim();
    const lowerName = (item.name || '').toLowerCase();
    const lowerBarcode = (item.barcode || '').toLowerCase();
    const lowerCategory = (item.category || '').toLowerCase();
    const lowerDescription = (item.description || '').toLowerCase();
    
    let score = 0;
    
    // Exact name match - highest priority
    if (lowerName === lowerQuery) {
        score += 1000;
    }
    // Name starts with query - very high priority
    else if (lowerName.startsWith(lowerQuery)) {
        score += 500;
    }
    // Name contains query at word boundary - high priority
    else if (lowerName.includes(' ' + lowerQuery) || lowerName.includes(lowerQuery + ' ')) {
        score += 300;
    }
    // Name contains query anywhere - medium priority
    else if (lowerName.includes(lowerQuery)) {
        score += 200;
    }
    // Fuzzy match - check if query words appear in name
    else {
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
        const nameWords = lowerName.split(/\s+/);
        let matchedWords = 0;
        queryWords.forEach(qWord => {
            nameWords.forEach(nWord => {
                if (nWord.startsWith(qWord) || nWord.includes(qWord)) {
                    matchedWords++;
                }
            });
        });
        if (matchedWords > 0) {
            score += 100 * (matchedWords / queryWords.length);
        }
    }
    
    // Barcode exact match - high priority
    if (lowerBarcode === lowerQuery) {
        score += 400;
    }
    // Barcode contains query
    else if (lowerBarcode.includes(lowerQuery)) {
        score += 150;
    }
    
    // Category match - lower priority
    if (lowerCategory.includes(lowerQuery)) {
        score += 50;
    }
    
    // Description match - lowest priority
    if (lowerDescription.includes(lowerQuery)) {
        score += 25;
    }
    
    // Boost score for items with stock (if not service)
    if (item.itemType !== 'service' && item.stockQuantity > 0) {
        score += 10;
    }
    
    return score;
}

// Highlight matching text in search results
function highlightMatch(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fef3c7; padding: 2px 0; font-weight: 600;">$1</mark>');
}

// Item suggestions functionality with smart search
function showItemSuggestions(query, rowNumber) {
    const allItems = getAllItems();
    
    if (!query || query.trim().length === 0) {
        hideItemSuggestions(rowNumber);
        return;
    }
    
    // Calculate relevance score for each item
    const itemsWithScores = allItems.map(item => ({
        item: item,
        score: calculateItemRelevance(item, query)
    })).filter(result => result.score > 0); // Only include items with matches
    
    // Sort by relevance score (highest first)
    itemsWithScores.sort((a, b) => b.score - a.score);
    
    // Get or create suggestions container
    let suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
    if (!suggestionsContainer) {
        const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
        if (!itemNameInput) return;
        
        const inputContainer = itemNameInput.parentElement;
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = `item-suggestions-${rowNumber}`;
        suggestionsContainer.className = 'item-suggestions';
        suggestionsContainer.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 250px;
            overflow-y: auto;
        `;
        inputContainer.style.position = 'relative';
        inputContainer.appendChild(suggestionsContainer);
    }
    
    if (itemsWithScores.length === 0) {
        if (allItems.length === 0) {
            suggestionsContainer.innerHTML = `
                <div class="item-suggestion" style="color: #6b7280; font-style: italic; padding: 12px;">
                    No items found. Add items in the Items page first.
                </div>
            `;
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.innerHTML = `
                <div class="item-suggestion" style="color: #6b7280; font-style: italic; padding: 12px;">
                    No matching items found. Try a different search term.
                </div>
            `;
            suggestionsContainer.style.display = 'block';
        }
        return;
    }
    
    // Show top 8 most relevant results
    const topItems = itemsWithScores.slice(0, 8).map(result => result.item);
    
    suggestionsContainer.innerHTML = topItems.map(item => {
        const isService = item.itemType === 'service';
        const serviceIcon = isService ? '🔧 ' : '';
        const stockInfo = isService ? 'Service Item' : `Stock: ${item.stockQuantity || 0}`;
        const priceText = typeof formatCurrency === 'function' ? formatCurrency(item.retailPrice) : `$${item.retailPrice.toFixed(2)}`;
        
        // Escape HTML in item name for highlighting
        const escapedName = item.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlightedName = highlightMatch(escapedName, query);
        
        // Escape and highlight barcode
        const escapedBarcode = item.barcode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlightedBarcode = highlightMatch(escapedBarcode, query);
        
        return `
            <div class="item-suggestion" onclick="selectItemFromSuggestion('${item.name.replace(/'/g, "\\'")}', '${item.barcode.replace(/'/g, "\\'")}', '${item.retailPrice}', ${rowNumber})" style="
                padding: 12px;
                cursor: pointer;
                border-bottom: 1px solid #f3f4f6;
                transition: background-color 0.2s ease;
            " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='white'">
                <div class="item-suggestion-name" style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                    ${serviceIcon}${highlightedName}
                </div>
                <div class="item-suggestion-details" style="font-size: 12px; color: #6b7280;">
                    Barcode: ${highlightedBarcode} | ${stockInfo} | ${item.category || 'No category'}
                </div>
                <div style="font-weight: 600; color: #10b981; font-size: 12px; margin-top: 4px;">
                    ${priceText}
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideItemSuggestions(rowNumber) {
    const suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectItemFromSuggestion(itemName, barcode, price, rowNumber) {
    // Fill in the item details
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    document.getElementById(`barcode-${rowNumber}`).value = barcode;
    document.getElementById(`retail-price-${rowNumber}`).value = price;
    
    // Remove warning border if it was set
    const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
    if (itemNameInput) {
        itemNameInput.style.borderColor = '';
    }
    
    // Check if this is a service item and highlight the row
    const itemData = getItemByName(itemName);
    if (itemData && itemData.itemType === 'service') {
        const row = document.getElementById(`row-${rowNumber}`);
        if (row) {
            row.style.borderLeft = '4px solid #3b82f6';
            row.style.background = '#f8fafc';
        }
        
        // Set default quantity to 1 for services
        document.getElementById(`quantity-${rowNumber}`).value = 1;
        
        // Update the row total
        updateRowTotal(rowNumber);
        
        showNotification(`🔧 Service item "${itemName}" selected. Use notes field to track item details.`, 'success');
    } else {
        // Update the row total
        updateRowTotal(rowNumber);
        
        showNotification(`Item "${itemName}" selected`, 'success');
    }
    
    // Hide suggestions
    hideItemSuggestions(rowNumber);
    
    // Move focus to quantity field
    document.getElementById(`quantity-${rowNumber}`).focus();
}

function selectCustomerFromSuggestion(customerName) {
    // Fill in the customer name
    document.getElementById('customer-account').value = customerName;
    
    // Hide suggestions
    hideCustomerSuggestions();
    
    // Update customer info display
    updateCustomerInfoDisplay();
    
    showNotification(`Customer "${customerName}" selected`, 'success');
}

// Function to refresh customer balance display in real-time
function refreshCustomerBalance() {
    const customerName = document.getElementById('customer-account').value.trim();
    if (customerName) {
        updateCustomerInfoDisplay();
    }
}

// Add periodic refresh for customer balance (every 5 seconds)
setInterval(refreshCustomerBalance, 5000);

// Debug function to manually test total calculation
function debugTotals() {
    console.log('=== DEBUG TOTALS ===');
    console.log('rowIds:', rowIds);
    
    rowIds.forEach(rowId => {
        const quantityEl = document.getElementById(`quantity-${rowId}`);
        const priceEl = document.getElementById(`retail-price-${rowId}`);
        const totalEl = document.getElementById(`total-${rowId}`);
        
        console.log(`Row ${rowId}:`, {
            quantity: quantityEl ? quantityEl.value : 'NOT FOUND',
            price: priceEl ? priceEl.value : 'NOT FOUND',
            total: totalEl ? totalEl.value : 'NOT FOUND'
        });
    });
    
    updateReturnSum();
    console.log('=== END DEBUG ===');
}

// Record inventory activities for invoice items
function recordInventoryActivities(invoiceData) {
    try {
        // Load existing activity data
        const activityData = JSON.parse(localStorage.getItem('sonic_activity_data') || '[]');
        
        // Record each item sold as an activity
        invoiceData.items.forEach(item => {
            if (item.quantity > 0 && item.itemName) {
                // Check if this is a service item
                const itemData = getItemByName(item.itemName);
                const isService = itemData && itemData.itemType === 'service';
                
                const activity = {
                    id: Date.now() + Math.random(),
                    timestamp: new Date().toISOString(),
                    type: isService ? 'service' : 'sale',
                    itemName: item.itemName,
                    quantity: item.quantity,
                    price: item.retailPrice,
                    total: item.total,
                    itemType: isService ? 'service' : 'product',
                    details: {
                        invoiceNumber: invoiceData.invoiceNumber,
                        customer: invoiceData.customerAccount,
                        paymentMethod: invoiceData.paymentMethod,
                        currency: invoiceData.currency,
                        barcode: item.barcode,
                        note: item.note,
                        isService: isService
                    }
                };
                
                activityData.push(activity);
                
                // If this is a service item, update service status
                if (isService && item.barcode && item.barcode.startsWith('SVC-')) {
                }
            }
        });
        
        // Save updated activity data
        localStorage.setItem('sonic_activity_data', JSON.stringify(activityData));
        
        // Update inventory stock levels (services won't affect inventory)
        updateInventoryStock(invoiceData.items);
        
        console.log('Inventory activities recorded for invoice:', invoiceData.invoiceNumber);
    } catch (error) {
        console.error('Error recording inventory activities:', error);
    }
}


// Update inventory stock levels based on sales
function updateInventoryStock(items) {
    try {
        // Load existing inventory data
        const inventoryData = JSON.parse(localStorage.getItem('sonic_inventory_data') || '[]');
        
        items.forEach(item => {
            if (item.quantity > 0 && item.itemName) {
                // Check if this is a service item - services don't affect inventory
                const itemData = getItemByName(item.itemName);
                if (itemData && itemData.itemType === 'service') {
                    console.log(`Skipping inventory update for service item: ${item.itemName}`);
                    return; // Skip inventory update for services
                }
                
                // Find existing inventory item by name or create new one
                let inventoryItem = inventoryData.find(inv => 
                    inv.name === item.itemName || inv.sku === item.barcode
                );
                
                if (inventoryItem) {
                    // Update existing item stock
                    inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - item.quantity);
                    inventoryItem.lastUpdated = new Date().toISOString();
                } else {
                    // Create new inventory item (assume starting stock of 0)
                    inventoryItem = {
                        id: Date.now() + Math.random(),
                        sku: item.barcode || `SKU-${Date.now()}`,
                        name: item.itemName,
                        category: 'General',
                        currentStock: 0, // Will be negative, indicating oversold
                        minStock: 5,
                        maxStock: 100,
                        costPrice: 0, // Unknown cost
                        retailPrice: item.retailPrice,
                        lastUpdated: new Date().toISOString(),
                        status: 'active'
                    };
                    
                    inventoryData.push(inventoryItem);
                }
            }
        });
        
        // Save updated inventory data
        localStorage.setItem('sonic_inventory_data', JSON.stringify(inventoryData));
        
        console.log('Inventory stock levels updated');
    } catch (error) {
        console.error('Error updating inventory stock:', error);
    }
}

// Helper function to get item by name
function getItemByName(itemName) {
    const items = getAllItems();
    return items.find(item => item.name === itemName);
}



