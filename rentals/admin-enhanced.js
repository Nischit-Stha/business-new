// ===== Veera Rentals - Unified Admin Panel JavaScript =====

// ===== Chart instances (so we can destroy before re-creating) =====
let dashRequestChartInstance = null;
let dashFleetChartInstance = null;
let analyticsRequestChartInstance = null;
let analyticsFleetChartInstance = null;

// ===== STATE =====
let currentEditVehicleId = null;
let currentStatusVehicleId = null;
let currentApprovalRequestId = null;

// ===== TAB NAVIGATION =====
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const section = document.getElementById(`${tabName}-section`);
    if (section) section.style.display = 'block';

    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Load data for each tab
    switch (tabName) {
        case 'dashboard': renderDashboard(); break;
        case 'bookings': renderAllBookings(); break;
        case 'approvals': renderApprovals(); break;
        case 'inventory': loadVehicles(); break;
        case 'analytics': renderAnalytics(); break;
        case 'locations': loadLocationData(); break;
        case 'invoices': renderInvoices(); break;
        case 'reports': renderReports(); break;
    }
}

// ===== FIREBASE HELPERS =====
async function fetchFirestoreRequests() {
    if (!window.firebaseServices || !window.firebaseServices.db) return [];
    try {
        const { db, collection, getDocs } = window.firebaseServices;
        const snapshot = await getDocs(collection(db, 'requests'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.log('Failed to load Firestore requests:', e);
        return [];
    }
}

async function fetchFirestoreLocations() {
    if (!window.firebaseServices || !window.firebaseServices.db) return [];
    try {
        const { db, collection, getDocs } = window.firebaseServices;
        const snapshot = await getDocs(collection(db, 'visitorLocations'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.log('Failed to load Firestore locations:', e);
        return [];
    }
}

// ===== DASHBOARD =====
function renderDashboard() {
    const fleet = vehicleSystem.getAllVehicles();
    const requests = requestSystem.getAllRequests();
    const invoices = JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]');
    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const pending = requests.filter(r => r.status === 'pending').length;
    const available = fleet.filter(v => v.status === 'available').length;
    const inUse = fleet.filter(v => v.status === 'in-use' || v.status === 'rented').length;

    // Update pending badge
    document.getElementById('pending-badge').textContent = pending;

    document.getElementById('dashboard-stats').innerHTML = `
        <div class="stat-card success">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">$${totalRevenue.toLocaleString()}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Fleet Size</div>
            <div class="stat-value">${fleet.length}</div>
        </div>
        <div class="stat-card success">
            <div class="stat-label">Available</div>
            <div class="stat-value">${available}</div>
        </div>
        <div class="stat-card danger">
            <div class="stat-label">In Use</div>
            <div class="stat-value">${inUse}</div>
        </div>
        <div class="stat-card warning">
            <div class="stat-label">Pending Approvals</div>
            <div class="stat-value">${pending}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Bookings</div>
            <div class="stat-value">${requests.length}</div>
        </div>
    `;

    // Charts
    const requestStats = analyticsSystem.getRequestStats();
    const fleetStats = analyticsSystem.getFleetStats();

    if (dashRequestChartInstance) dashRequestChartInstance.destroy();
    if (dashFleetChartInstance) dashFleetChartInstance.destroy();

    const rCtx = document.getElementById('dashRequestChart');
    if (rCtx) {
        dashRequestChartInstance = new Chart(rCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Completed', 'Denied'],
                datasets: [{ data: [requestStats.pending, requestStats.approved, requestStats.completed, requestStats.denied], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'], borderRadius: 8, borderWidth: 2, borderColor: 'white' }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    const fCtx = document.getElementById('dashFleetChart');
    if (fCtx) {
        dashFleetChartInstance = new Chart(fCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Available', 'In Use', 'Maintenance', 'Other'],
                datasets: [{ data: [fleetStats.available, fleetStats.inUse, fleetStats.maintenance, Math.max(0, fleetStats.total - fleetStats.available - fleetStats.inUse - fleetStats.maintenance)], backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'], borderRadius: 8, borderWidth: 2, borderColor: 'white' }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// ===== BOOKINGS =====
async function renderAllBookings() {
    const requests = JSON.parse(localStorage.getItem('veera-rentals-requests') || '[]');
    const firestoreRequests = await fetchFirestoreRequests();
    const fleet = JSON.parse(localStorage.getItem('fleet-data') || '[]');
    const fleetMap = new Map(fleet.map(v => [v.id, v]));
    const grid = document.getElementById('bookings-grid');

    function mapRequest(req, source) {
        const vehicle = fleetMap.get(req.vehicleId) || { make: 'Vehicle', model: req.vehicleId || 'N/A', rego: 'N/A' };
        const typeLabel = req.type ? (req.type.charAt(0).toUpperCase() + req.type.slice(1)) : 'Request';
        const createdAt = (source === 'firestore' && req.createdAt && typeof req.createdAt.toDate === 'function')
            ? req.createdAt.toDate().toISOString()
            : (req.createdAtIso || req.createdAt || new Date().toISOString());
        return {
            type: typeLabel, serviceRef: req.id,
            customerName: req.contactEmail || 'Guest Customer',
            customerPhone: req.contactPhone || 'N/A',
            contactEmail: req.contactEmail || '',
            vehicle, mileage: req.currentMileage || 'N/A', fuel: 'N/A',
            timestamp: createdAt, location: null, notes: req.notes || '',
            licenseNumber: req.licenseNumber || '',
            licenseFrontData: req.licenseFrontData || '', licenseBackData: req.licenseBackData || '',
            licenseFrontUrl: req.licenseFrontUrl || '', licenseBackUrl: req.licenseBackUrl || '',
            regoNumber: req.regoNumber || '', status: req.status || 'pending'
        };
    }

    const allBookings = [
        ...requests.map(r => mapRequest(r, 'local')),
        ...firestoreRequests.map(r => mapRequest(r, 'firestore'))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Deduplicate by serviceRef
    const seen = new Set();
    const unique = allBookings.filter(b => {
        if (seen.has(b.serviceRef)) return false;
        seen.add(b.serviceRef);
        return true;
    });

    if (unique.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No bookings yet.</p></div>';
        return;
    }

    grid.innerHTML = unique.map((booking, index) => `
        <div class="booking-card" onclick="showCustomerProfile(${index})" style="cursor: pointer;">
            <div class="booking-header">
                <span class="booking-type-badge">${booking.type}</span>
                <span class="booking-ref">${booking.serviceRef}</span>
            </div>
            <div class="booking-details">
                <p><strong>Customer:</strong> ${booking.customerName}</p>
                <p><strong>Phone:</strong> ${booking.customerPhone}</p>
                ${booking.contactEmail ? `<p><strong>Email:</strong> ${booking.contactEmail}</p>` : ''}
                <p><strong>Vehicle:</strong> ${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.rego})</p>
                ${booking.licenseNumber ? `<p><strong>License #:</strong> ${booking.licenseNumber}</p>` : ''}
                <p><strong>Status:</strong> <span class="status-badge ${booking.status}">${booking.status}</span></p>
                <p style="color: #666; font-size: 0.85rem; margin-top: 0.5rem;">👤 Click to view full profile</p>
            </div>
        </div>
    `).join('');

    window.currentBookings = unique;
}

// ===== CUSTOMER PROFILE MODAL =====
function showCustomerProfile(index) {
    const booking = window.currentBookings[index];
    if (!booking) return;

    document.getElementById('customer-profile-content').innerHTML = `
        <div class="profile-header">
            <h2>👤 Customer Profile</h2>
            <span class="booking-type-badge">${booking.type}</span>
        </div>
        <div class="profile-section">
            <h3>📋 Booking Information</h3>
            <p><strong>Reference:</strong> ${booking.serviceRef}</p>
            <p><strong>Date:</strong> ${new Date(booking.timestamp).toLocaleString()}</p>
            <p><strong>Status:</strong> ${booking.status}</p>
            ${booking.location ? `<p><strong>📍 Location:</strong> <a href="https://www.google.com/maps?q=${booking.location.lat},${booking.location.lng}" target="_blank">${booking.location.lat.toFixed(6)}, ${booking.location.lng.toFixed(6)}</a></p>` : ''}
        </div>
        <div class="profile-section">
            <h3>👤 Customer Details</h3>
            <p><strong>Name:</strong> ${booking.customerName}</p>
            <p><strong>Phone:</strong> ${booking.customerPhone}</p>
            ${booking.contactEmail ? `<p><strong>Email:</strong> ${booking.contactEmail}</p>` : ''}
            ${booking.licenseNumber ? `<p><strong>License Number:</strong> ${booking.licenseNumber}</p>` : ''}
        </div>
        ${(booking.licenseFrontUrl || booking.licenseFrontData || booking.licenseBackUrl || booking.licenseBackData) ? `
        <div class="profile-section">
            <h3>🪪 License Photos</h3>
            <div class="license-photos">
                ${(booking.licenseFrontUrl || booking.licenseFrontData) ? `
                    <div class="license-photo">
                        <h4>Front</h4>
                        <img src="${booking.licenseFrontUrl || booking.licenseFrontData}" alt="License Front" class="license-image" />
                        <a href="${booking.licenseFrontUrl || booking.licenseFrontData}" target="_blank" class="btn btn-small">Open Full</a>
                    </div>` : ''}
                ${(booking.licenseBackUrl || booking.licenseBackData) ? `
                    <div class="license-photo">
                        <h4>Back</h4>
                        <img src="${booking.licenseBackUrl || booking.licenseBackData}" alt="License Back" class="license-image" />
                        <a href="${booking.licenseBackUrl || booking.licenseBackData}" target="_blank" class="btn btn-small">Open Full</a>
                    </div>` : ''}
            </div>
        </div>` : ''}
        <div class="profile-section">
            <h3>🚗 Vehicle Information</h3>
            <p><strong>Vehicle:</strong> ${booking.vehicle.make} ${booking.vehicle.model}</p>
            <p><strong>Rego:</strong> ${booking.vehicle.rego}</p>
            <p><strong>Mileage:</strong> ${booking.mileage} km</p>
        </div>
        ${booking.notes ? `<div class="profile-section"><h3>📝 Notes</h3><p>${booking.notes}</p></div>` : ''}
    `;
    document.getElementById('customer-profile-modal').classList.add('active');
}

function closeCustomerProfile() {
    document.getElementById('customer-profile-modal').classList.remove('active');
}

// ===== APPROVALS =====
async function renderApprovals() {
    const localRequests = requestSystem.getPendingRequests();
    const firestoreRequests = await fetchFirestoreRequests();
    const firestorePending = firestoreRequests.filter(r => r.status === 'pending');
    const fleet = JSON.parse(localStorage.getItem('fleet-data') || '[]');
    const fleetMap = new Map(fleet.map(v => [v.id, v]));

    // Merge and deduplicate
    const allPending = [...localRequests];
    const localIds = new Set(localRequests.map(r => r.id));
    firestorePending.forEach(r => {
        if (!localIds.has(r.id)) allPending.push(r);
    });

    const pending = allPending.length;
    const allRequests = requestSystem.getAllRequests();
    const today = new Date().toDateString();
    const approvedToday = allRequests.filter(r => r.status === 'approved' && r.approvedAt && new Date(r.approvedAt).toDateString() === today).length;
    const deniedToday = allRequests.filter(r => r.status === 'denied' && r.deniedAt && new Date(r.deniedAt).toDateString() === today).length;

    document.getElementById('pending-badge').textContent = pending;

    document.getElementById('approval-stats').innerHTML = `
        <div class="stat-card warning">
            <div class="stat-label">Pending</div>
            <div class="stat-value">${pending}</div>
        </div>
        <div class="stat-card success">
            <div class="stat-label">Approved Today</div>
            <div class="stat-value">${approvedToday}</div>
        </div>
        <div class="stat-card danger">
            <div class="stat-label">Denied Today</div>
            <div class="stat-value">${deniedToday}</div>
        </div>
    `;

    const queue = document.getElementById('requests-queue');

    if (allPending.length === 0) {
        queue.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>No pending requests. All caught up!</p></div>';
        return;
    }

    queue.innerHTML = allPending.map(request => {
        const vehicle = fleetMap.get(request.vehicleId) || { make: 'N/A', model: '', year: '', dailyRate: 0, transmission: '', fuel: '', rego: '' };
        const customerName = request.contactEmail || request.customerName || 'Guest';
        const customerPhone = request.contactPhone || 'N/A';
        const customerEmail = request.contactEmail || '';
        const licenseNumber = request.licenseNumber || '';
        const type = request.type || 'request';

        return `
            <div class="request-item">
                <div class="request-header">
                    <div class="request-id">${request.id}</div>
                    <span class="request-type-badge ${type}">${type.toUpperCase()}</span>
                </div>
                <div class="customer-info">
                    <div class="info-block">
                        <div class="info-label">Customer</div>
                        <div class="info-value">${customerName}</div>
                    </div>
                    <div class="info-block">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${customerPhone}</div>
                    </div>
                    ${customerEmail ? `<div class="info-block"><div class="info-label">Email</div><div class="info-value">${customerEmail}</div></div>` : ''}
                    ${licenseNumber ? `<div class="info-block"><div class="info-label">License</div><div class="info-value">${licenseNumber}</div></div>` : ''}
                </div>
                <div style="background: var(--gray-100); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <div style="font-weight: 700; margin-bottom: 0.5rem;">🚗 ${vehicle.make} ${vehicle.model} ${vehicle.year ? '(' + vehicle.year + ')' : ''}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9rem; color: var(--gray-600);">
                        <span>Rate: $${vehicle.dailyRate}/day</span>
                        <span>Rego: ${vehicle.rego || request.regoNumber || 'N/A'}</span>
                    </div>
                </div>
                <div style="background: var(--gray-100); padding: 1rem; border-radius: 8px; margin: 0.5rem 0;">
                    <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.5rem;">Requested Date & Time</div>
                    <div style="color: var(--gray-600);">📅 ${request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'N/A'} &nbsp; 🕐 ${request.preferredTime || 'N/A'}</div>
                </div>
                ${request.notes ? `<div style="background: var(--gray-100); padding: 1rem; border-radius: 8px; margin: 0.5rem 0;"><strong>Notes:</strong> ${request.notes}</div>` : ''}
                <div class="action-buttons">
                    <button class="btn-approve" onclick="openApprovalModal('${request.id}', '${customerName.replace(/'/g, "\\'")}')">✓ Approve</button>
                    <button class="btn-deny" onclick="denyRequest('${request.id}')">✕ Deny</button>
                </div>
            </div>
        `;
    }).join('');
}

function openApprovalModal(requestId, customerName) {
    currentApprovalRequestId = requestId;
    document.getElementById('approvalCustomerName').value = customerName;
    document.getElementById('approvalLocation').value = '';
    document.getElementById('approvalDate').value = '';
    document.getElementById('approvalTime').value = '';
    document.getElementById('approvalNotes').value = '';
    document.getElementById('approvalModal').classList.add('active');
}

function closeApprovalModal() {
    document.getElementById('approvalModal').classList.remove('active');
    currentApprovalRequestId = null;
}

async function submitApproval(e) {
    e.preventDefault();
    const location = document.getElementById('approvalLocation').value;
    const date = document.getElementById('approvalDate').value;
    const time = document.getElementById('approvalTime').value;
    const confirmedTime = new Date(`${date}T${time}`);

    requestSystem.approveRequest(currentApprovalRequestId, location, confirmedTime);

    // Also update in Firestore
    if (window.firebaseServices && window.firebaseServices.db) {
        try {
            const { db, doc, updateDoc, serverTimestamp } = window.firebaseServices;
            await updateDoc(doc(db, 'requests', currentApprovalRequestId), {
                status: 'approved',
                approvalLocation: location,
                approvalTime: confirmedTime.toISOString(),
                approvedAt: serverTimestamp()
            });
        } catch (err) {
            console.log('Firestore approval update failed:', err);
        }
    }

    closeApprovalModal();
    renderApprovals();
    alert(`✅ Request approved! Customer will be notified.`);
}

async function denyRequest(requestId) {
    if (!confirm('Are you sure you want to deny this request?')) return;

    requestSystem.denyRequest(requestId);

    // Also update in Firestore
    if (window.firebaseServices && window.firebaseServices.db) {
        try {
            const { db, doc, updateDoc, serverTimestamp } = window.firebaseServices;
            await updateDoc(doc(db, 'requests', requestId), {
                status: 'denied',
                deniedAt: serverTimestamp()
            });
        } catch (err) {
            console.log('Firestore denial update failed:', err);
        }
    }

    renderApprovals();
    alert(`❌ Request denied. Customer has been notified.`);
}

// ===== INVENTORY =====
function loadVehicles(filter) {
    filter = filter || getInventoryFilters();
    const vehicles = vehicleSystem.getAllVehicles();
    const grid = document.getElementById('vehicleGrid');
    let filtered = vehicles;

    if (filter.status) filtered = filtered.filter(v => v.status === filter.status);
    if (filter.category) filtered = filtered.filter(v => v.category === filter.category);
    if (filter.search) {
        const s = filter.search.toLowerCase();
        filtered = filtered.filter(v =>
            v.make.toLowerCase().includes(s) ||
            v.model.toLowerCase().includes(s) ||
            (v.rego || '').toLowerCase().includes(s)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🚗</div><p>No vehicles found.</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(vehicle => `
        <div class="vehicle-card">
            <div class="vehicle-header-card">
                <div>
                    <div class="vehicle-name">${vehicle.make} ${vehicle.model}</div>
                    <div class="vehicle-id-label">${vehicle.rego || vehicle.id}</div>
                </div>
                <span class="status-badge">${vehicle.status}</span>
            </div>
            <div class="vehicle-body">
                <div class="vehicle-specs">
                    <div class="spec"><div class="spec-label">Year</div><div class="spec-value">${vehicle.year}</div></div>
                    <div class="spec"><div class="spec-label">Fuel</div><div class="spec-value">${vehicle.fuel}</div></div>
                    <div class="spec"><div class="spec-label">Trans.</div><div class="spec-value">${vehicle.transmission}</div></div>
                    <div class="spec"><div class="spec-label">Seats</div><div class="spec-value">${vehicle.seats}</div></div>
                    <div class="spec"><div class="spec-label">Mileage</div><div class="spec-value">${(vehicle.mileage || 0).toLocaleString()} km</div></div>
                    <div class="spec"><div class="spec-label">Range</div><div class="spec-value">${vehicle.range}</div></div>
                </div>
                <div class="vehicle-price">
                    <div class="price-label">Daily Rate</div>
                    <div class="price">$${vehicle.dailyRate}</div>
                </div>
                <div class="vehicle-actions">
                    <button class="btn-edit" onclick="openEditVehicleModal('${vehicle.id}')">Edit</button>
                    <button class="btn-status-btn" onclick="openStatusModal('${vehicle.id}')">Status</button>
                    <button class="btn-delete" onclick="deleteVehicle('${vehicle.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getInventoryFilters() {
    return {
        search: document.getElementById('searchInput')?.value || '',
        status: document.getElementById('filterStatus')?.value || '',
        category: document.getElementById('filterCategory')?.value || ''
    };
}

function openAddVehicleModal() {
    currentEditVehicleId = null;
    document.getElementById('vehicleModalTitle').textContent = 'Add New Vehicle';
    ['formMake','formModel','formRego','formFuel','formRange','formColor','formTrunk','formDescription'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('formYear').value = new Date().getFullYear();
    document.getElementById('formCategory').value = '';
    document.getElementById('formTransmission').value = 'Automatic';
    document.getElementById('formMileage').value = '0';
    document.getElementById('formDailyRate').value = '';
    document.getElementById('formSeats').value = '5';
    document.getElementById('vehicleModal').classList.add('active');
}

function openEditVehicleModal(vehicleId) {
    const vehicle = vehicleSystem.getVehicleById(vehicleId);
    if (!vehicle) return;
    currentEditVehicleId = vehicleId;
    document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
    document.getElementById('formMake').value = vehicle.make;
    document.getElementById('formModel').value = vehicle.model;
    document.getElementById('formYear').value = vehicle.year;
    document.getElementById('formRego').value = vehicle.rego;
    document.getElementById('formCategory').value = vehicle.category;
    document.getElementById('formTransmission').value = vehicle.transmission;
    document.getElementById('formFuel').value = vehicle.fuel;
    document.getElementById('formRange').value = vehicle.range;
    document.getElementById('formColor').value = vehicle.color;
    document.getElementById('formMileage').value = vehicle.mileage;
    document.getElementById('formDailyRate').value = vehicle.dailyRate;
    document.getElementById('formSeats').value = vehicle.seats;
    document.getElementById('formTrunk').value = vehicle.trunk || '';
    document.getElementById('formDescription').value = vehicle.description || '';
    document.getElementById('vehicleModal').classList.add('active');
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.remove('active');
    currentEditVehicleId = null;
}

function saveVehicle(e) {
    e.preventDefault();
    const data = {
        make: document.getElementById('formMake').value,
        model: document.getElementById('formModel').value,
        year: parseInt(document.getElementById('formYear').value),
        rego: document.getElementById('formRego').value,
        category: document.getElementById('formCategory').value,
        transmission: document.getElementById('formTransmission').value,
        fuel: document.getElementById('formFuel').value,
        range: document.getElementById('formRange').value,
        color: document.getElementById('formColor').value,
        mileage: parseInt(document.getElementById('formMileage').value),
        dailyRate: parseFloat(document.getElementById('formDailyRate').value),
        seats: parseInt(document.getElementById('formSeats').value),
        trunk: document.getElementById('formTrunk').value,
        description: document.getElementById('formDescription').value,
        features: ['Climate control', 'Backup camera']
    };

    if (currentEditVehicleId) {
        vehicleSystem.updateVehicle(currentEditVehicleId, data);
        alert('✅ Vehicle updated!');
    } else {
        vehicleSystem.addVehicle(data);
        alert('✅ Vehicle added to fleet!');
    }
    closeVehicleModal();
    loadVehicles();
}

function openStatusModal(vehicleId) {
    currentStatusVehicleId = vehicleId;
    const vehicle = vehicleSystem.getVehicleById(vehicleId);
    document.getElementById('newStatus').value = vehicle.status;
    document.getElementById('statusModal').classList.add('active');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
    currentStatusVehicleId = null;
}

function updateVehicleStatusAction() {
    const newStatus = document.getElementById('newStatus').value;
    vehicleSystem.updateVehicleStatus(currentStatusVehicleId, newStatus);
    alert('✅ Status updated!');
    closeStatusModal();
    loadVehicles();
}

function deleteVehicle(vehicleId) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    vehicleSystem.deleteVehicle(vehicleId);
    alert('🗑️ Vehicle deleted');
    loadVehicles();
}

// ===== ANALYTICS =====
function renderAnalytics() {
    const fleetStats = analyticsSystem.getFleetStats();
    const revenueStats = analyticsSystem.getRevenueStats();
    const requestStats = analyticsSystem.getRequestStats();

    document.getElementById('analytics-metrics').innerHTML = `
        <div class="stat-card success">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">$${revenueStats.totalRevenue.toLocaleString()}</div>
            <div class="stat-subtitle">From completed rentals</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Fleet Utilization</div>
            <div class="stat-value">${fleetStats.utilization}%</div>
            <div class="stat-subtitle">Vehicles currently rented</div>
        </div>
        <div class="stat-card warning">
            <div class="stat-label">Pending Approvals</div>
            <div class="stat-value">${requestStats.pending}</div>
        </div>
        <div class="stat-card success">
            <div class="stat-label">Approved</div>
            <div class="stat-value">${requestStats.approved}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Fleet Size</div>
            <div class="stat-value">${fleetStats.total}</div>
        </div>
        <div class="stat-card success">
            <div class="stat-label">Avg Revenue / Rental</div>
            <div class="stat-value">$${revenueStats.averagePerRental.toLocaleString()}</div>
        </div>
    `;

    // Charts
    if (analyticsRequestChartInstance) analyticsRequestChartInstance.destroy();
    if (analyticsFleetChartInstance) analyticsFleetChartInstance.destroy();

    const rCtx = document.getElementById('requestChart');
    if (rCtx) {
        analyticsRequestChartInstance = new Chart(rCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Completed', 'Denied'],
                datasets: [{ data: [requestStats.pending, requestStats.approved, requestStats.completed, requestStats.denied], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'], borderRadius: 8, borderWidth: 2, borderColor: 'white' }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    const fCtx = document.getElementById('fleetChart');
    if (fCtx) {
        analyticsFleetChartInstance = new Chart(fCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Available', 'In Use', 'Maintenance', 'Other'],
                datasets: [{ data: [fleetStats.available, fleetStats.inUse, fleetStats.maintenance, Math.max(0, fleetStats.total - fleetStats.available - fleetStats.inUse - fleetStats.maintenance)], backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'], borderRadius: 8, borderWidth: 2, borderColor: 'white' }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // Popular Vehicles
    const popularVehicles = analyticsSystem.getMostPopularVehicles();
    document.getElementById('popularVehicles').innerHTML = popularVehicles.length > 0
        ? popularVehicles.map((item, idx) => `
            <div class="vehicle-row">
                <div class="v-info">
                    <div class="v-name">${idx + 1}. ${item.vehicle ? item.vehicle.year + ' ' + item.vehicle.make + ' ' + item.vehicle.model : 'Unknown'}</div>
                    <div class="v-category">${item.vehicle ? item.vehicle.category : ''}</div>
                </div>
                <span class="rental-count">${item.rentals} rentals</span>
            </div>
        `).join('')
        : '<p style="color: #999; text-align: center; padding: 1rem;">No rental data yet</p>';

    // Revenue Breakdown
    document.getElementById('revenueBreakdown').innerHTML = `
        <div class="revenue-row"><span class="revenue-label">Completed Rentals</span><span class="revenue-value">${revenueStats.completedRentals}</span></div>
        <div class="revenue-row"><span class="revenue-label">Total Revenue</span><span class="revenue-value">$${revenueStats.totalRevenue.toLocaleString()}</span></div>
        <div class="revenue-row"><span class="revenue-label">Avg Per Rental</span><span class="revenue-value">$${revenueStats.averagePerRental}</span></div>
        <div class="revenue-row"><span class="revenue-label">Fleet Size</span><span class="revenue-value">${fleetStats.total} vehicles</span></div>
    `;
}

// ===== LOCATIONS =====
async function loadLocationData() {
    const visits = JSON.parse(localStorage.getItem('visitor_locations') || '[]');
    const firestoreVisits = await fetchFirestoreLocations();
    const allVisits = [...firestoreVisits, ...visits];

    // Stats
    const today = new Date().toDateString();
    const todayVisits = allVisits.filter(v => new Date(v.createdAtIso || v.timestamp).toDateString() === today);
    const uniqueLocs = new Set();
    allVisits.forEach(v => {
        if (v.latitude && v.longitude) uniqueLocs.add(`${v.latitude.toFixed(2)},${v.longitude.toFixed(2)}`);
    });

    const statsContainer = document.getElementById('location-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card"><div class="stat-label">Total Visitors</div><div class="stat-value">${allVisits.length}</div></div>
            <div class="stat-card"><div class="stat-label">Today's Visits</div><div class="stat-value">${todayVisits.length}</div></div>
            <div class="stat-card"><div class="stat-label">Unique Locations</div><div class="stat-value">${uniqueLocs.size}</div></div>
        `;
    }

    const content = document.getElementById('locations-content');
    if (!content) return;

    if (allVisits.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="empty-icon">📍</div><p>No visitor locations tracked yet</p></div>';
        return;
    }

    allVisits.sort((a, b) => new Date(b.createdAtIso || b.timestamp) - new Date(a.createdAtIso || a.timestamp));

    content.innerHTML = `
        <table>
            <thead><tr><th>#</th><th>Date & Time</th><th>Latitude</th><th>Longitude</th><th>Accuracy (m)</th><th>Page</th><th>Map</th></tr></thead>
            <tbody>
                ${allVisits.map((v, i) => {
                    const date = new Date(v.createdAtIso || v.timestamp);
                    const mapUrl = `https://www.google.com/maps?q=${v.latitude},${v.longitude}`;
                    return `<tr>
                        <td>${i + 1}</td>
                        <td>${date.toLocaleString()}</td>
                        <td>${v.latitude ? v.latitude.toFixed(6) : 'N/A'}</td>
                        <td>${v.longitude ? v.longitude.toFixed(6) : 'N/A'}</td>
                        <td>${v.accuracy ? Math.round(v.accuracy) : 'N/A'}</td>
                        <td>${v.page || 'scanner'}</td>
                        <td><a href="${mapUrl}" target="_blank" class="map-link">View →</a></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

function exportLocationCSV() {
    const visits = JSON.parse(localStorage.getItem('visitor_locations') || '[]');
    if (visits.length === 0) { alert('No data to export'); return; }

    let csv = 'Index,Date,Time,Latitude,Longitude,Accuracy,Page\n';
    visits.forEach((v, i) => {
        const d = new Date(v.timestamp);
        csv += `${i + 1},${d.toLocaleDateString()},${d.toLocaleTimeString()},${v.latitude},${v.longitude},${v.accuracy},${v.page || 'scanner'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-locations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearLocationData() {
    if (!confirm('Clear all location data? This cannot be undone.')) return;
    localStorage.removeItem('visitor_locations');
    localStorage.removeItem('customer_location');
    loadLocationData();
    alert('Location data cleared.');
}

// ===== INVOICES =====
function renderInvoices() {
    const invoices = JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]');
    const grid = document.getElementById('invoices-grid');

    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const unpaid = invoices.filter(inv => inv.status === 'unpaid');

    grid.innerHTML = `
        <div class="invoice-header">
            <button class="btn btn-primary" onclick="showAddInvoiceModal()">+ Add Invoice</button>
            <div class="invoice-stats">
                <div class="stat-box"><h4>$${totalRevenue.toFixed(2)}</h4><p>Total Revenue</p></div>
                <div class="stat-box"><h4>${paid.length}</h4><p>Paid</p></div>
                <div class="stat-box"><h4>${unpaid.length}</h4><p>Unpaid</p></div>
            </div>
        </div>
        ${invoices.length === 0 ? '<div class="empty-state"><div class="empty-icon">💰</div><p>No invoices yet.</p></div>' : ''}
        ${invoices.sort((a, b) => new Date(b.date) - new Date(a.date)).map(inv => `
            <div class="invoice-card">
                <div class="invoice-row">
                    <div>
                        <h4>Invoice #${inv.invoiceNumber}</h4>
                        <p>${inv.customerName} - ${inv.description}</p>
                        <small style="color: var(--gray-600);">${new Date(inv.date).toLocaleDateString()}</small>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="color: var(--success);">$${inv.amount}</h3>
                        <span class="status-badge ${inv.status}">${inv.status}</span>
                    </div>
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-small btn-primary" onclick="toggleInvoiceStatus('${inv.invoiceNumber}')">${inv.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}</button>
                    <button class="btn btn-small btn-danger" onclick="deleteInvoice('${inv.invoiceNumber}')">Delete</button>
                </div>
            </div>
        `).join('')}
    `;
}

function showAddInvoiceModal() {
    let modal = document.getElementById('invoice-modal');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="invoice-modal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header"><h2>Add New Invoice</h2><button class="close-btn" onclick="document.getElementById('invoice-modal').classList.remove('active')">&times;</button></div>
                    <form id="invoice-form">
                        <div class="form-group"><label>Invoice Number</label><input type="text" id="invoice-number" value="INV-${Date.now()}" required></div>
                        <div class="form-group"><label>Customer Name</label><input type="text" id="invoice-customer" required></div>
                        <div class="form-group"><label>Description</label><input type="text" id="invoice-description" placeholder="Rental payment, Extra charges, etc." required></div>
                        <div class="form-group"><label>Amount ($)</label><input type="number" id="invoice-amount" step="0.01" required></div>
                        <div class="form-group"><label>Status</label><select id="invoice-status"><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select></div>
                        <div class="modal-actions"><button type="button" class="btn-cancel" onclick="document.getElementById('invoice-modal').classList.remove('active')">Cancel</button><button type="submit" class="btn-submit">Save Invoice</button></div>
                    </form>
                </div>
            </div>
        `);
        document.getElementById('invoice-form').addEventListener('submit', saveInvoice);
    } else {
        document.getElementById('invoice-number').value = 'INV-' + Date.now();
        modal.classList.add('active');
    }
}

function saveInvoice(e) {
    e.preventDefault();
    const invoice = {
        invoiceNumber: document.getElementById('invoice-number').value,
        customerName: document.getElementById('invoice-customer').value,
        description: document.getElementById('invoice-description').value,
        amount: document.getElementById('invoice-amount').value,
        status: document.getElementById('invoice-status').value,
        date: new Date().toISOString()
    };

    const invoices = JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]');
    invoices.push(invoice);
    localStorage.setItem('veera-rentals-invoices', JSON.stringify(invoices));

    document.getElementById('invoice-modal').classList.remove('active');
    renderInvoices();
    alert('Invoice added!');
}

function toggleInvoiceStatus(invoiceNumber) {
    const invoices = JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]');
    const inv = invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv) {
        inv.status = inv.status === 'paid' ? 'unpaid' : 'paid';
        localStorage.setItem('veera-rentals-invoices', JSON.stringify(invoices));
        renderInvoices();
    }
}

function deleteInvoice(invoiceNumber) {
    if (!confirm('Delete this invoice?')) return;
    let invoices = JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]');
    invoices = invoices.filter(i => i.invoiceNumber !== invoiceNumber);
    localStorage.setItem('veera-rentals-invoices', JSON.stringify(invoices));
    renderInvoices();
}

// ===== REPORTS =====
function renderReports() {
    const invoices = JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]');
    const fleet = JSON.parse(localStorage.getItem('fleet-data') || '[]');
    const requests = requestSystem.getAllRequests();

    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const todayRevenue = invoices.filter(inv => new Date(inv.date).toDateString() === new Date().toDateString()).reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const utilization = fleet.length > 0 ? ((fleet.filter(v => v.status === 'rented' || v.status === 'in-use').length / fleet.length) * 100).toFixed(1) : 0;

    document.getElementById('reports-content').innerHTML = `
        <div class="reports-grid">
            <div class="report-card">
                <h3>💰 Revenue Summary</h3>
                <div class="report-stats">
                    <p><strong>Total Revenue:</strong> $${totalRevenue.toFixed(2)}</p>
                    <p><strong>Today's Revenue:</strong> $${todayRevenue.toFixed(2)}</p>
                    <p><strong>Total Invoices:</strong> ${invoices.length}</p>
                </div>
            </div>
            <div class="report-card">
                <h3>🚗 Fleet Statistics</h3>
                <div class="report-stats">
                    <p><strong>Total Vehicles:</strong> ${fleet.length}</p>
                    <p><strong>Available:</strong> ${fleet.filter(v => v.status === 'available').length}</p>
                    <p><strong>In Use:</strong> ${fleet.filter(v => v.status === 'rented' || v.status === 'in-use').length}</p>
                    <p><strong>Utilization:</strong> ${utilization}%</p>
                </div>
            </div>
            <div class="report-card">
                <h3>📋 Request Activity</h3>
                <div class="report-stats">
                    <p><strong>Total Requests:</strong> ${requests.length}</p>
                    <p><strong>Pending:</strong> ${requests.filter(r => r.status === 'pending').length}</p>
                    <p><strong>Approved:</strong> ${requests.filter(r => r.status === 'approved').length}</p>
                    <p><strong>Completed:</strong> ${requests.filter(r => r.status === 'completed').length}</p>
                </div>
            </div>
        </div>
        <div class="export-section">
            <button class="btn btn-primary" onclick="exportAllData()">📥 Export All Data</button>
            <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Report</button>
        </div>
    `;
}

function exportAllData() {
    const data = {
        fleet: JSON.parse(localStorage.getItem('fleet-data') || '[]'),
        requests: JSON.parse(localStorage.getItem('veera-rentals-requests') || '[]'),
        invoices: JSON.parse(localStorage.getItem('veera-rentals-invoices') || '[]'),
        locations: JSON.parse(localStorage.getItem('visitor_locations') || '[]')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veera-rentals-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== GEOLOCATION TRACKING =====
function trackAdminLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async function(position) {
                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString(),
                    page: 'admin-panel'
                };
                
                // Store in localStorage
                let allVisits = JSON.parse(localStorage.getItem('visitor_locations') || '[]');
                allVisits.push(locationData);
                localStorage.setItem('visitor_locations', JSON.stringify(allVisits));
                
                console.log('Admin location tracked:', locationData);
                
                // Send to Firestore if available
                if (window.firebaseServices && window.firebaseServices.db) {
                    try {
                        const { db, doc, setDoc, serverTimestamp } = window.firebaseServices;
                        const locationId = `LOC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                        await setDoc(doc(db, 'visitorLocations', locationId), {
                            ...locationData,
                            createdAt: serverTimestamp(),
                            createdAtIso: new Date().toISOString()
                        });
                        console.log('Location saved to Firestore');
                    } catch (error) {
                        console.log('Failed to save location to Firestore:', error);
                    }
                }
            },
            function(error) {
                console.log('Location access denied or unavailable:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.log('Geolocation not supported by this browser');
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    // Track admin location on page load
    trackAdminLocation();

    // Tab navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const tab = link.getAttribute('data-tab');
            if (tab) {
                e.preventDefault();
                showTab(tab);
            }
        });
    });

    // Inventory filter listeners
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterCategory = document.getElementById('filterCategory');
    if (searchInput) searchInput.addEventListener('input', () => loadVehicles());
    if (filterStatus) filterStatus.addEventListener('change', () => loadVehicles());
    if (filterCategory) filterCategory.addEventListener('change', () => loadVehicles());

    // Show dashboard
    showTab('dashboard');
});
