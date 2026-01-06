
let rowCount = 1;
const maxRows = 100;
let selectedRowId = null;
let rowIds = [1];
let transferCounter = 1;
let savedTransfers = [];
let currentTransferIndex = -1;
let isNavigating = false;

// Initialize the system
document.addEventListener('DOMContentLoaded', function() {
    loadTransfersFromStorage();
    loadTransferCounterFromStorage();
    
    // Initialize stores and load them
    if (typeof initializeStores === 'function') {
        initializeStores();
    }
    loadStores();
    
    initializeTransfer();
    addEventListenersToRow(1);
    document.getElementById('description').addEventListener('input', updateStoreInfoDisplay);
    document.getElementById('from-store').addEventListener('change', updateStoreInfoDisplay);
    document.getElementById('to-store').addEventListener('change', updateStoreInfoDisplay);
    document.getElementById('discount').addEventListener('input', updateTransferSum);
    document.getElementById('discount-type').addEventListener('change', updateDiscountType);
    document.getElementById('currency').addEventListener('change', updateCurrencySymbol);
    document.getElementById('currency').addEventListener('change', handleCurrencyChange);
    document.getElementById('payment-method').addEventListener('change', togglePartialPayment);
    document.getElementById('payment-method').addEventListener('change', updateStoreInfoDisplay);
    document.getElementById('paid-amount').addEventListener('input', calculateRemainingBalance);
    
    // Initialize currency tracking
    document.getElementById('currency').setAttribute('data-previous', 'USD');
    updateCurrencySymbols();
    initCurrencyRateControls();
    
    updateNavigationButtons();
    
    setTimeout(() => {
        updateTransferSum();
    }, 500);
});

function initializeTransfer() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;
    document.getElementById('transfer-date').textContent = dateString;
    
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    document.getElementById('transfer-time').textContent = timeString;
    
    const transferNumber = 'TRF-' + String(transferCounter).padStart(4, '0');
    document.getElementById('transfer-number').textContent = transferNumber;
}

function addEventListenersToRow(rowNumber) {
    const barcodeInput = document.getElementById(`barcode-${rowNumber}`);
    const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
    const quantityInput = document.getElementById(`quantity-${rowNumber}`);
    const priceInput = document.getElementById(`retail-price-${rowNumber}`);
    const noteInput = document.getElementById(`note-${rowNumber}`);
    
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                itemNameInput.focus();
            }
        });
    }
    
    if (itemNameInput) {
        itemNameInput.addEventListener('input', function(event) {
            const query = event.target.value.trim();
            if (query.length > 0) {
                showItemSuggestions(query, rowNumber);
            } else {
                hideItemSuggestions(rowNumber);
            }
        });
        
        itemNameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
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
        
        itemNameInput.addEventListener('blur', function() {
            setTimeout(() => hideItemSuggestions(rowNumber), 200);
        });
        
        itemNameInput.addEventListener('blur', function() {
            const itemName = this.value.trim();
            if (itemName && !getItemByName(itemName)) {
                this.style.borderColor = '#f59e0b';
                showNotification(`⚠️ Item "${itemName}" not found in system. Please select from suggestions or add item first.`, 'warning', 4000);
            } else if (itemName && getItemByName(itemName)) {
                this.style.borderColor = '';
                // Auto-fill price from item
                const item = getItemByName(itemName);
                if (item && priceInput) {
                    priceInput.value = item.retailPrice || '';
                    updateRowTotal(rowNumber);
                }
            }
        });
    }
    
    if (quantityInput && priceInput) {
        quantityInput.addEventListener('input', () => updateRowTotal(rowNumber));
        priceInput.addEventListener('input', () => updateRowTotal(rowNumber));
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

function updateRowTotal(rowNumber) {
    const quantity = parseFloat(document.getElementById(`quantity-${rowNumber}`).value) || 0;
    const retailPrice = parseFloat(document.getElementById(`retail-price-${rowNumber}`).value) || 0;
    const total = quantity * retailPrice;
    
    const totalElement = document.getElementById(`total-${rowNumber}`);
    if (totalElement) {
        totalElement.value = total.toFixed(2);
    }
    
    updateTransferSum();
}

function updateTransferSum() {
    let subtotal = 0;
    let totalQuantity = 0;
    
    rowIds.forEach(rowId => {
        const totalElement = document.getElementById(`total-${rowId}`);
        const quantityElement = document.getElementById(`quantity-${rowId}`);
        if (totalElement && quantityElement) {
            const rowTotal = parseFloat(totalElement.value) || 0;
            const quantity = parseFloat(quantityElement.value) || 0;
            subtotal += rowTotal;
            totalQuantity += quantity;
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
    
    updateTransferSum();
}

function updateCurrencySymbol() {
    const currency = document.getElementById('currency').value;
    const symbol = currency === 'IQD' ? 'د.ع' : '$';
    document.getElementById('currency-symbol').textContent = symbol;
    document.getElementById('final-currency-symbol').textContent = symbol;
}

function updateCurrencySymbols() {
    updateCurrencySymbol();
}

function initCurrencyRateControls() {
    const iqdRateInput = document.getElementById('iqd-rate-input');
    if (iqdRateInput) {
        const storedRate = localStorage.getItem('sonic_iqd_rate');
        if (storedRate) {
            iqdRateInput.value = storedRate;
        }
        iqdRateInput.addEventListener('change', function() {
            localStorage.setItem('sonic_iqd_rate', this.value);
        });
    }
}

function getConversionRate() {
    const iqdRateInput = document.getElementById('iqd-rate-input');
    return iqdRateInput ? parseFloat(iqdRateInput.value) || 1400 : 1400;
}

function handleCurrencyChange() {
    const currency = document.getElementById('currency').value;
    const previousCurrency = document.getElementById('currency').getAttribute('data-previous') || 'USD';
    
    document.getElementById('currency').setAttribute('data-previous', currency);
    
    if (rowIds.length > 0) {
        const rate = getConversionRate();
        if (currency === 'IQD' && previousCurrency === 'USD') {
            convertPrices(rate);
        } else if (currency === 'USD' && previousCurrency === 'IQD') {
            convertPrices(1 / rate);
        }
    }
    
    updateCurrencySymbols();
    updateStoreInfoDisplay();
}

function convertPrices(rate) {
    rowIds.forEach(rowId => {
        const priceInput = document.getElementById(`retail-price-${rowId}`);
        if (priceInput && priceInput.value) {
            const currentPrice = parseFloat(priceInput.value) || 0;
            const newPrice = currentPrice * rate;
            priceInput.value = newPrice.toFixed(2);
            updateRowTotal(rowId);
        }
    });
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
    
    updateStoreInfoDisplay();
    updateTransferSum();
}

function calculateRemainingBalance() {
    const paymentMethod = document.getElementById('payment-method').value;
    
    if (paymentMethod !== 'partial') {
        return;
    }
    
    updateTransferSum();
    
    const totalSumText = document.getElementById('total-sum').textContent;
    const finalTotal = parseFloat(totalSumText.replace(/[^0-9.-]/g, '')) || 0;
    const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
    
    const remaining = finalTotal;
    
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

function updateStoreInfoDisplay() {
    const fromStore = document.getElementById('from-store').value || '-';
    const toStore = document.getElementById('to-store').value || '-';
    const description = document.getElementById('description').value || '-';
    const paymentMethod = document.getElementById('payment-method').value;
    const currency = document.getElementById('currency').value;
    
    const paymentMethodText = {
        'on-account': 'On Account',
        'cash': 'Cash',
        'partial': 'Partial Payment',
        'card': 'Card',
        'bank-transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod;
    
    const currencyText = currency === 'IQD' ? 'IQD (د.ع)' : 'USD ($)';
    
    document.getElementById('display-from-store').textContent = fromStore;
    document.getElementById('display-to-store').textContent = toStore;
    document.getElementById('display-description').textContent = description;
    
    if (paymentMethod !== 'partial') {
        document.getElementById('display-payment-method').textContent = paymentMethodText;
    }
    document.getElementById('display-currency').textContent = currencyText;
}

function addRow() {
    if (rowCount >= maxRows) {
        showNotification('Maximum number of rows reached', 'error');
        return;
    }
    
    rowCount++;
    rowIds.push(rowCount);
    
    const tbody = document.getElementById('transfer-tbody');
    const newRow = document.createElement('tr');
    newRow.id = `row-${rowCount}`;
    newRow.onclick = () => selectRow(rowCount);
    
    newRow.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="text" id="barcode-${rowCount}" placeholder="Scan barcode" onclick="event.stopPropagation()"></td>
        <td>
            <div style="display: flex; gap: 4px; align-items: center; position: relative;">
                <input type="text" id="item-name-${rowCount}" placeholder="Enter item name" onclick="event.stopPropagation()" autocomplete="off" style="flex: 1;">
                <button type="button" onclick="openItemQuickSearch(${rowCount})" class="quick-search-btn" title="Quick Search">
                    🔍
                </button>
            </div>
        </td>
        <td><input type="number" id="quantity-${rowCount}" value="" min="0" step="1" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="retail-price-${rowCount}" value="" min="0" step="0.01" onclick="event.stopPropagation()"></td>
        <td><input type="number" id="total-${rowCount}" value="" disabled onclick="event.stopPropagation()"></td>
        <td><input type="text" id="note-${rowCount}" placeholder="Add note" onclick="event.stopPropagation()"></td>
    `;
    
    tbody.appendChild(newRow);
    addEventListenersToRow(rowCount);
    updateTransferSum();
}

function removeLastRow() {
    if (rowIds.length <= 1) {
        showNotification('At least one row is required', 'error');
        return;
    }
    
    const lastRowId = rowIds[rowIds.length - 1];
    const row = document.getElementById(`row-${lastRowId}`);
    if (row) {
        row.remove();
        rowIds.pop();
        rowCount--;
        updateTransferSum();
    }
}

function selectRow(rowId) {
    if (selectedRowId) {
        const prevRow = document.getElementById(`row-${selectedRowId}`);
        if (prevRow) {
            prevRow.classList.remove('selected');
        }
    }
    
    selectedRowId = rowId;
    const currentRow = document.getElementById(`row-${rowId}`);
    if (currentRow) {
        currentRow.classList.add('selected');
    }
    
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (deleteBtn) {
        deleteBtn.disabled = false;
    }
}

function deleteSelectedRow() {
    if (!selectedRowId || rowIds.length <= 1) {
        showNotification('At least one row is required', 'error');
        return;
    }
    
    const row = document.getElementById(`row-${selectedRowId}`);
    if (row) {
        row.remove();
        rowIds = rowIds.filter(id => id !== selectedRowId);
        selectedRowId = null;
        
        const deleteBtn = document.getElementById('delete-selected-btn');
        if (deleteBtn) {
            deleteBtn.disabled = true;
        }
        
        updateTransferSum();
    }
}

function saveTransfer() {
    const fromStore = document.getElementById('from-store').value;
    const toStore = document.getElementById('to-store').value;
    
    if (!fromStore || !toStore) {
        showNotification('Please select both From Store and To Store', 'error');
        return;
    }
    
    if (fromStore === toStore) {
        showNotification('From Store and To Store cannot be the same', 'error');
        return;
    }
    
    const items = [];
    let hasItems = false;
    
    rowIds.forEach(rowId => {
        const itemName = document.getElementById(`item-name-${rowId}`).value.trim();
        const barcode = document.getElementById(`barcode-${rowId}`).value.trim();
        const quantity = parseFloat(document.getElementById(`quantity-${rowId}`).value) || 0;
        const retailPrice = parseFloat(document.getElementById(`retail-price-${rowId}`).value) || 0;
        const total = parseFloat(document.getElementById(`total-${rowId}`).value) || 0;
        const note = document.getElementById(`note-${rowId}`).value.trim();
        
        if (itemName || barcode || quantity > 0) {
            hasItems = true;
            items.push({
                itemName: itemName || '',
                barcode: barcode || '',
                quantity: quantity,
                retailPrice: retailPrice,
                total: total,
                note: note || ''
            });
        }
    });
    
    if (!hasItems) {
        showNotification('Please add at least one item to transfer', 'error');
        return;
    }
    
    const currency = document.getElementById('currency').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const discountType = document.getElementById('discount-type').value;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const subtotal = parseFloat(document.getElementById('subtotal').textContent) || 0;
    const totalSum = parseFloat(document.getElementById('total-sum').textContent) || 0;
    const paidAmount = paymentMethod === 'partial' ? parseFloat(document.getElementById('paid-amount').value) || 0 : 0;
    
    const transfer = {
        transferNumber: document.getElementById('transfer-number').textContent,
        date: document.getElementById('transfer-date').textContent,
        time: document.getElementById('transfer-time').textContent,
        fromStore: fromStore,
        toStore: toStore,
        description: document.getElementById('description').value || '',
        currency: currency,
        paymentMethod: paymentMethod,
        discountType: discountType,
        discount: discount,
        subtotal: subtotal,
        total: totalSum,
        paidAmount: paidAmount,
        items: items,
        totalQuantity: parseInt(document.getElementById('total-quantity').textContent) || 0
    };
    
    if (currentTransferIndex >= 0) {
        savedTransfers[currentTransferIndex] = transfer;
        showNotification('Transfer updated successfully', 'success');
    } else {
        savedTransfers.push(transfer);
        transferCounter++;
        saveTransferCounterToStorage();
        showNotification('Transfer saved successfully', 'success');
    }
    
    saveTransfersToStorage();
    updateNavigationButtons();
    currentTransferIndex = savedTransfers.length - 1;
}

function printTransfer() {
    updateStoreInfoDisplay();
    
    setTimeout(() => {
        window.print();
    }, 100);
}

function newTransfer() {
    if (confirm('Create a new transfer? Any unsaved changes will be lost.')) {
        currentTransferIndex = -1;
        clearTransferForm();
        transferCounter++;
        saveTransferCounterToStorage();
        initializeTransfer();
        updateNavigationButtons();
    }
}

function cancelTransfer() {
    if (currentTransferIndex >= 0) {
        loadTransfer(currentTransferIndex);
    } else {
        clearTransferForm();
    }
}

function clearTransferForm() {
    document.getElementById('from-store').value = '';
    document.getElementById('to-store').value = '';
    document.getElementById('description').value = '';
    
    while (rowIds.length > 1) {
        const lastRowId = rowIds[rowIds.length - 1];
        const row = document.getElementById(`row-${lastRowId}`);
        if (row) {
            row.remove();
            rowIds.pop();
            rowCount--;
        }
    }
    
    const firstRow = document.getElementById('row-1');
    if (firstRow) {
        document.getElementById('barcode-1').value = '';
        document.getElementById('item-name-1').value = '';
        document.getElementById('quantity-1').value = '';
        document.getElementById('retail-price-1').value = '';
        document.getElementById('total-1').value = '';
        document.getElementById('note-1').value = '';
    }
    
    selectedRowId = null;
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
    }
    
    updateTransferSum();
    updateStoreInfoDisplay();
}

function loadTransfer(index) {
    if (index < 0 || index >= savedTransfers.length) {
        return;
    }
    
    const transfer = savedTransfers[index];
    currentTransferIndex = index;
    
    document.getElementById('transfer-number').textContent = transfer.transferNumber;
    document.getElementById('transfer-date').textContent = transfer.date;
    document.getElementById('transfer-time').textContent = transfer.time;
    document.getElementById('from-store').value = transfer.fromStore;
    document.getElementById('to-store').value = transfer.toStore;
    document.getElementById('description').value = transfer.description || '';
    document.getElementById('currency').value = transfer.currency || 'USD';
    document.getElementById('payment-method').value = transfer.paymentMethod || 'on-account';
    document.getElementById('discount-type').value = transfer.discountType || 'amount';
    document.getElementById('discount').value = transfer.discount || 0;
    if (transfer.paidAmount) {
        document.getElementById('paid-amount').value = transfer.paidAmount;
    }
    
    updateCurrencySymbols();
    togglePartialPayment();
    
    clearTransferForm();
    
    transfer.items.forEach((item, idx) => {
        if (idx > 0) {
            addRow();
        }
        const rowId = rowIds[idx];
        document.getElementById(`item-name-${rowId}`).value = item.itemName || '';
        document.getElementById(`barcode-${rowId}`).value = item.barcode || '';
        document.getElementById(`quantity-${rowId}`).value = item.quantity || '';
        document.getElementById(`retail-price-${rowId}`).value = item.retailPrice || '';
        document.getElementById(`total-${rowId}`).value = item.total || '';
        document.getElementById(`note-${rowId}`).value = item.note || '';
    });
    
    updateTransferSum();
    
    updateTransferSum();
    updateStoreInfoDisplay();
    updateNavigationButtons();
}

function previousTransfer() {
    if (isNavigating) return;
    if (currentTransferIndex > 0) {
        isNavigating = true;
        currentTransferIndex--;
        loadTransfer(currentTransferIndex);
        setTimeout(() => { isNavigating = false; }, 300);
    }
}

function nextTransfer() {
    if (isNavigating) return;
    if (currentTransferIndex < savedTransfers.length - 1) {
        isNavigating = true;
        currentTransferIndex++;
        loadTransfer(currentTransferIndex);
        setTimeout(() => { isNavigating = false; }, 300);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const counter = document.getElementById('transfer-counter');
    
    if (prevBtn) {
        prevBtn.disabled = currentTransferIndex <= 0;
    }
    if (nextBtn) {
        nextBtn.disabled = currentTransferIndex >= savedTransfers.length - 1 || savedTransfers.length === 0;
    }
    if (counter) {
        const current = currentTransferIndex >= 0 ? currentTransferIndex + 1 : savedTransfers.length;
        counter.textContent = `${current} / ${savedTransfers.length}`;
    }
}

function searchTransfer() {
    const searchInput = document.getElementById('transfer-search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        showNotification('Please enter a transfer number', 'warning');
        return;
    }
    
    const searchNumber = query.replace(/^TRF-?/i, '');
    const num = parseInt(searchNumber);
    
    if (isNaN(num)) {
        showNotification('Invalid transfer number format', 'error');
        return;
    }
    
    const transferNumber = 'TRF-' + String(num).padStart(4, '0');
    const index = savedTransfers.findIndex(t => t.transferNumber === transferNumber);
    
    if (index >= 0) {
        currentTransferIndex = index;
        loadTransfer(index);
        showNotification(`Transfer ${transferNumber} loaded`, 'success');
    } else {
        showNotification(`Transfer ${transferNumber} not found`, 'error');
    }
}

function handleTransferSearch(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchTransfer();
    }
}

function showTransferList() {
    if (savedTransfers.length === 0) {
        showNotification('No transfers found', 'warning');
        return;
    }
    
    let list = 'Saved Transfers:\n\n';
    savedTransfers.forEach((transfer, index) => {
        list += `${index + 1}. ${transfer.transferNumber} - ${transfer.fromStore} → ${transfer.toStore} (${transfer.date})\n`;
    });
    alert(list);
}

function saveTransfersToStorage() {
    try {
        localStorage.setItem('sonic_transfers', JSON.stringify(savedTransfers));
    } catch (error) {
        console.error('Error saving transfers:', error);
        showNotification('Error saving transfers to storage', 'error');
    }
}

function loadTransfersFromStorage() {
    try {
        const stored = localStorage.getItem('sonic_transfers');
        if (stored) {
            savedTransfers = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading transfers:', error);
        savedTransfers = [];
    }
}

function saveTransferCounterToStorage() {
    try {
        localStorage.setItem('sonic_transfer_counter', transferCounter.toString());
    } catch (error) {
        console.error('Error saving transfer counter:', error);
    }
}

function loadTransferCounterFromStorage() {
    try {
        const stored = localStorage.getItem('sonic_transfer_counter');
        if (stored) {
            transferCounter = parseInt(stored) || 1;
        }
    } catch (error) {
        console.error('Error loading transfer counter:', error);
        transferCounter = 1;
    }
}

// Item search functions (reuse from script.js if available, otherwise implement basic version)
function showItemSuggestions(query, rowNumber) {
    if (typeof showItemSuggestions === 'function' && window.showItemSuggestions !== showItemSuggestions) {
        return;
    }
    
    const suggestionsContainer = document.getElementById(`item-suggestions-${rowNumber}`);
    if (!suggestionsContainer) {
        const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
        if (!itemNameInput) return;
        
        const container = document.createElement('div');
        container.id = `item-suggestions-${rowNumber}`;
        container.className = 'item-suggestions';
        container.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; max-height: 200px; overflow-y: auto; display: none;';
        
        const parent = itemNameInput.parentElement;
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(container);
        }
    }
    
    const items = typeof getAllItems === 'function' ? getAllItems() : [];
    const lowerQuery = query.toLowerCase();
    const filtered = items.filter(item => 
        (item.itemName && item.itemName.toLowerCase().includes(lowerQuery)) ||
        (item.barcode && item.barcode.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
    
    const container = document.getElementById(`item-suggestions-${rowNumber}`);
    if (!container) return;
    
    if (filtered.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = filtered.map(item => `
        <div class="item-suggestion" onclick="selectItemSuggestion(${rowNumber}, '${item.itemName.replace(/'/g, "\\'")}', '${(item.barcode || '').replace(/'/g, "\\'")}')" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;">
            <strong>${item.itemName}</strong>
            ${item.barcode ? `<br><small>Barcode: ${item.barcode}</small>` : ''}
        </div>
    `).join('');
    
    container.style.display = 'block';
}

function hideItemSuggestions(rowNumber) {
    const container = document.getElementById(`item-suggestions-${rowNumber}`);
    if (container) {
        container.style.display = 'none';
    }
}

function selectItemSuggestion(rowNumber, itemName, barcode) {
    document.getElementById(`item-name-${rowNumber}`).value = itemName;
    if (barcode) {
        document.getElementById(`barcode-${rowNumber}`).value = barcode;
    }
    hideItemSuggestions(rowNumber);
    document.getElementById(`quantity-${rowNumber}`).focus();
}

function openItemQuickSearch(rowNumber) {
    const itemNameInput = document.getElementById(`item-name-${rowNumber}`);
    if (itemNameInput) {
        itemNameInput.focus();
        itemNameInput.select();
    }
}

// Store Management Functions
function loadStores() {
    const stores = typeof getAllStores === 'function' ? getAllStores() : [];
    const fromStoreSelect = document.getElementById('from-store');
    const toStoreSelect = document.getElementById('to-store');
    
    if (fromStoreSelect && toStoreSelect) {
        // Clear existing options except the first one
        fromStoreSelect.innerHTML = '<option value="">Select store...</option>';
        toStoreSelect.innerHTML = '<option value="">Select store...</option>';
        
        // Add stores to both dropdowns
        stores.forEach(store => {
            const option1 = document.createElement('option');
            option1.value = store.name;
            option1.textContent = store.description || store.name;
            fromStoreSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = store.name;
            option2.textContent = store.description || store.name;
            toStoreSelect.appendChild(option2);
        });
    }
}

function openStoreManagement() {
    const stores = typeof getAllStores === 'function' ? getAllStores() : [];
    
    let storeList = 'Current Stores:\n\n';
    stores.forEach((store, index) => {
        storeList += `${index + 1}. ${store.description || store.name}\n`;
    });
    
    const action = prompt(`${storeList}\n\nEnter:\n- "add" to add a new store\n- "delete [number]" to delete a store\n- "edit [number]" to edit a store\n\nOr press Cancel to close`);
    
    if (!action) return;
    
    const parts = action.trim().toLowerCase().split(' ');
    const command = parts[0];
    
    if (command === 'add') {
        const name = prompt('Enter store name:');
        if (name) {
            const description = prompt('Enter store description (or press OK to use name):', name);
            if (typeof addStore === 'function') {
                addStore({ name: name.trim(), description: (description || name).trim() });
                showNotification('Store added successfully', 'success');
                loadStores();
            }
        }
    } else if (command === 'delete' && parts[1]) {
        const index = parseInt(parts[1]) - 1;
        if (index >= 0 && index < stores.length) {
            if (confirm(`Delete store "${stores[index].description || stores[index].name}"?`)) {
                if (typeof deleteStore === 'function') {
                    deleteStore(stores[index].id);
                    showNotification('Store deleted successfully', 'success');
                    loadStores();
                }
            }
        } else {
            showNotification('Invalid store number', 'error');
        }
    } else if (command === 'edit' && parts[1]) {
        const index = parseInt(parts[1]) - 1;
        if (index >= 0 && index < stores.length) {
            const store = stores[index];
            const newName = prompt('Enter new store name:', store.name);
            if (newName) {
                const newDescription = prompt('Enter new store description:', store.description);
                if (typeof updateStore === 'function') {
                    updateStore(store.id, { 
                        name: newName.trim(), 
                        description: (newDescription || newName).trim() 
                    });
                    showNotification('Store updated successfully', 'success');
                    loadStores();
                }
            }
        } else {
            showNotification('Invalid store number', 'error');
        }
    } else {
        showNotification('Invalid command. Use: add, delete [number], or edit [number]', 'error');
    }
}

window.openStoreManagement = openStoreManagement;

// Helper function to get item by name
function getItemByName(itemName) {
    if (typeof getAllItems === 'function') {
        const items = getAllItems();
        return items.find(item => item.name === itemName);
    }
    return null;
}

