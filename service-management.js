// Service Management System for SONIC COMPANY

let currentEditingServiceId = null;
let servicesToDelete = null;

// Initialize the service management page
document.addEventListener('DOMContentLoaded', function() {
    loadServices();
    updateStatistics();
    setupEventListeners();
    populateServiceItemNamesList();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-services').addEventListener('input', function(e) {
        filterServices(e.target.value);
    });
    
    // Form submission
    document.getElementById('service-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveService();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('service-modal');
        const detailsModal = document.getElementById('service-details-modal');
        if (e.target === modal) {
            closeServiceModal();
        }
        if (e.target === detailsModal) {
            closeServiceDetailsModal();
        }
    });
}

function loadServices() {
    const services = getAllServices();
    const tbody = document.getElementById('service-tbody');
    
    if (services.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-tools" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No services found. Click "Add New Service" to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = services.map(service => `
        <tr onclick="showServiceDetails(${service.id})" style="cursor: pointer;">
            <td><strong>SRV-${String(service.id).padStart(4, '0')}</strong></td>
            <td>
                <div style="font-weight: 600;">${service.customer}</div>
                <div style="font-size: 12px; color: #6b7280;">${service.phone || 'No phone'}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${service.itemName}</div>
                <div style="font-size: 12px; color: #6b7280;">${service.serialNumber || 'No serial'}</div>
            </td>
            <td>
                <span class="status-${service.status}">${getStatusText(service.status)}</span>
            </td>
            <td>${formatDate(service.dateReceived)}</td>
            <td>${service.estimatedCompletion ? formatDate(service.estimatedCompletion) : 'Not set'}</td>
            <td>
                <button class="btn btn-primary" onclick="event.stopPropagation(); editService(${service.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterServices(query) {
    const services = query ? searchServices(query) : getAllServices();
    const tbody = document.getElementById('service-tbody');
    
    if (services.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No services found matching "${query}"
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = services.map(service => `
        <tr onclick="showServiceDetails(${service.id})" style="cursor: pointer;">
            <td><strong>SRV-${String(service.id).padStart(4, '0')}</strong></td>
            <td>
                <div style="font-weight: 600;">${service.customer}</div>
                <div style="font-size: 12px; color: #6b7280;">${service.phone || 'No phone'}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${service.itemName}</div>
                <div style="font-size: 12px; color: #6b7280;">${service.serialNumber || 'No serial'}</div>
            </td>
            <td>
                <span class="status-${service.status}">${getStatusText(service.status)}</span>
            </td>
            <td>${formatDate(service.dateReceived)}</td>
            <td>${service.estimatedCompletion ? formatDate(service.estimatedCompletion) : 'Not set'}</td>
            <td>
                <button class="btn btn-primary" onclick="event.stopPropagation(); editService(${service.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStatistics() {
    const services = getAllServices();
    const pendingServices = services.filter(s => s.status === 'pending');
    const inProgressServices = services.filter(s => s.status === 'in-progress');
    const completedServices = services.filter(s => s.status === 'completed');
    
    document.getElementById('total-services').textContent = services.length;
    document.getElementById('pending-services').textContent = pendingServices.length;
    document.getElementById('in-progress-services').textContent = inProgressServices.length;
    document.getElementById('completed-services').textContent = completedServices.length;
}

function openAddServiceModal() {
    currentEditingServiceId = null;
    document.getElementById('service-modal-title').textContent = 'Add New Service';
    document.getElementById('service-form').reset();
    
    // Set default values
    document.getElementById('service-status').value = 'pending';
    document.getElementById('service-priority').value = 'normal';
    
    // Set estimated completion to 7 days from now
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 7);
    document.getElementById('service-estimated-completion').value = estimatedDate.toISOString().split('T')[0];
    
    document.getElementById('service-modal').style.display = 'block';
}

function editService(serviceId) {
    const service = getService(serviceId);
    if (!service) {
        showNotification('Service not found', 'error');
        return;
    }
    
    currentEditingServiceId = serviceId;
    document.getElementById('service-modal-title').textContent = 'Edit Service';
    
    // Populate form with service data
    document.getElementById('service-customer').value = service.customer;
    document.getElementById('service-phone').value = service.phone || '';
    document.getElementById('service-item-name').value = service.itemName;
    document.getElementById('service-serial').value = service.serialNumber || '';
    document.getElementById('service-status').value = service.status;
    document.getElementById('service-issue').value = service.issueDescription;
    document.getElementById('service-notes').value = service.notes || '';
    document.getElementById('service-priority').value = service.priority || 'normal';
    
    if (service.estimatedCompletion) {
        document.getElementById('service-estimated-completion').value = service.estimatedCompletion;
    }
    
    document.getElementById('service-modal').style.display = 'block';
}

function closeServiceModal() {
    document.getElementById('service-modal').style.display = 'none';
    currentEditingServiceId = null;
}

function saveService() {
    const formData = {
        customer: document.getElementById('service-customer').value.trim(),
        phone: document.getElementById('service-phone').value.trim(),
        itemName: document.getElementById('service-item-name').value.trim(),
        serialNumber: document.getElementById('service-serial').value.trim(),
        status: document.getElementById('service-status').value,
        issueDescription: document.getElementById('service-issue').value.trim(),
        notes: document.getElementById('service-notes').value.trim(),
        priority: document.getElementById('service-priority').value,
        estimatedCompletion: document.getElementById('service-estimated-completion').value
    };
    
    // Validation - Only essential fields required
    if (!formData.customer || !formData.itemName || !formData.issueDescription) {
        showNotification('Please fill in required fields: Customer, Item Name, and Issue Description', 'error');
        return;
    }
    
    try {
        if (currentEditingServiceId) {
            // Update existing service
            updateService(currentEditingServiceId, formData);
            showNotification('Service updated successfully', 'success');
        } else {
            // Add new service
            addService(formData);
            showNotification('Service added successfully', 'success');
        }
        
        loadServices();
        updateStatistics();
        closeServiceModal();
        
    } catch (error) {
        console.error('Error saving service:', error);
        showNotification('Error saving service', 'error');
    }
}

function showServiceDetails(serviceId) {
    const service = getService(serviceId);
    if (!service) {
        showNotification('Service not found', 'error');
        return;
    }
    
    document.getElementById('service-details-title').textContent = `Service SRV-${String(service.id).padStart(4, '0')}`;
    
    const content = `
        <div class="service-item-details">
            <h4><i class="fas fa-user"></i> Customer Information</h4>
            <p><strong>Name:</strong> ${service.customer}</p>
            <p><strong>Phone:</strong> ${service.phone || 'Not provided'}</p>
        </div>
        
        <div class="service-item-details">
            <h4><i class="fas fa-box"></i> Item Information</h4>
            <p><strong>Item Name:</strong> ${service.itemName}</p>
            <p><strong>Serial Number/IMEI:</strong> ${service.serialNumber || 'Not provided'}</p>
        </div>
        
        <div class="service-item-details">
            <h4><i class="fas fa-exclamation-triangle"></i> Issue Description</h4>
            <p>${service.issueDescription}</p>
        </div>
        
        ${service.notes ? `
        <div class="service-item-details">
            <h4><i class="fas fa-sticky-note"></i> Additional Notes</h4>
            <p>${service.notes}</p>
        </div>
        ` : ''}
        
        <div class="service-item-details">
            <h4><i class="fas fa-info-circle"></i> Service Details</h4>
            <p><strong>Status:</strong> <span class="status-${service.status}">${getStatusText(service.status)}</span></p>
            <p><strong>Priority:</strong> ${service.priority || 'Normal'}</p>
            <p><strong>Date Received:</strong> ${formatDate(service.dateReceived)}</p>
            <p><strong>Estimated Completion:</strong> ${service.estimatedCompletion ? formatDate(service.estimatedCompletion) : 'Not set'}</p>
            <p><strong>Last Updated:</strong> ${formatDate(service.lastUpdated)}</p>
        </div>
    `;
    
    document.getElementById('service-details-content').innerHTML = content;
    document.getElementById('service-details-modal').style.display = 'block';
    
    // Store current service ID for other functions
    window.currentServiceId = serviceId;
}

function closeServiceDetailsModal() {
    document.getElementById('service-details-modal').style.display = 'none';
    window.currentServiceId = null;
}

function editServiceFromDetails() {
    if (window.currentServiceId) {
        closeServiceDetailsModal();
        editService(window.currentServiceId);
    }
}


function getStatusText(status) {
    const statusTexts = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'ready': 'Ready for Pickup'
    };
    return statusTexts[status] || status;
}

// Service Data Management Functions
function getAllServices() {
    try {
        const stored = localStorage.getItem('sonic_services');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading services:', error);
        return [];
    }
}

function addService(serviceData) {
    const services = getAllServices();
    const serviceId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    
    const service = {
        id: serviceId,
        ...serviceData,
        dateReceived: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    services.push(service);
    localStorage.setItem('sonic_services', JSON.stringify(services));
    return serviceId;
}

function updateService(serviceId, serviceData) {
    const services = getAllServices();
    const serviceIndex = services.findIndex(s => s.id === serviceId);
    
    if (serviceIndex !== -1) {
        services[serviceIndex] = {
            ...services[serviceIndex],
            ...serviceData,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('sonic_services', JSON.stringify(services));
        return true;
    }
    return false;
}

function getService(serviceId) {
    const services = getAllServices();
    return services.find(s => s.id === serviceId) || null;
}

function searchServices(query) {
    const services = getAllServices();
    const lowerQuery = query.toLowerCase();
    return services.filter(service => 
        service.customer.toLowerCase().includes(lowerQuery) ||
        service.itemName.toLowerCase().includes(lowerQuery) ||
        service.status.toLowerCase().includes(lowerQuery) ||
        (service.serialNumber && service.serialNumber.toLowerCase().includes(lowerQuery)) ||
        (service.phone && service.phone.includes(query)) ||
        (service.issueDescription && service.issueDescription.toLowerCase().includes(lowerQuery))
    );
}

// Populate the service item names datalist with items from the items system
function populateServiceItemNamesList() {
    try {
        // Get items from the items system
        const items = getAllItems();
        const datalist = document.getElementById('service-item-names-list');
        
        if (datalist && items) {
            // Clear existing options
            datalist.innerHTML = '';
            
            // Add all item names to datalist (both products and services)
            const uniqueNames = [...new Set(items.map(item => item.name))];
            uniqueNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
            
            console.log(`Populated service item names list with ${uniqueNames.length} items from items system`);
        }
    } catch (error) {
        console.error('Error populating service item names list:', error);
    }
}

// Export functions for use in other modules
window.loadServices = loadServices;
window.updateStatistics = updateStatistics;
window.openAddServiceModal = openAddServiceModal;
window.editService = editService;
window.closeServiceModal = closeServiceModal;
window.saveService = saveService;
window.showServiceDetails = showServiceDetails;
window.closeServiceDetailsModal = closeServiceDetailsModal;
window.getAllServices = getAllServices;
window.addService = addService;
window.updateService = updateService;
window.getService = getService;
window.searchServices = searchServices;
window.populateServiceItemNamesList = populateServiceItemNamesList;
