/**
 * VEERA RENTALS - PRE-APPROVAL MANAGEMENT SYSTEM
 * Data Structure & Workflow Engine
 * 
 * System States:
 * - Pending: Awaiting admin approval
 * - Approved: Admin approved, scheduled for handover
 * - Denied: Admin rejected the request
 * - Completed: Vehicle handover completed
 */

// ===== REQUEST STATES =====
const REQUEST_STATES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    DENIED: 'denied',
    COMPLETED: 'completed'
};

const REQUEST_TYPES = {
    PICKUP: 'pickup',      // New rental
    SWAP: 'swap',          // Exchange current vehicle for another
    DROPOFF: 'dropoff'     // Return vehicle
};

const VEHICLE_STATUS = {
    AVAILABLE: 'available',
    IN_USE: 'in-use',
    MAINTENANCE: 'maintenance',
    RETURNED: 'returned'
};

// ===== DUMMY CUSTOMERS (5) =====
const DUMMY_CUSTOMERS = [
    {
        id: 'CUST001',
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        phone: '+61 412 345 678',
        licenseNumber: 'DL-123456-789',
        registeredDate: '2025-01-15',
        totalRentals: 3
    },
    {
        id: 'CUST002',
        name: 'Sarah Ahmed',
        email: 'sarah.ahmed@email.com',
        phone: '+61 423 456 789',
        licenseNumber: 'DL-987654-321',
        registeredDate: '2024-08-22',
        totalRentals: 7
    },
    {
        id: 'CUST003',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+61 434 567 890',
        licenseNumber: 'DL-456789-012',
        registeredDate: '2025-03-10',
        totalRentals: 1
    },
    {
        id: 'CUST004',
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@email.com',
        phone: '+61 445 678 901',
        licenseNumber: 'DL-789012-345',
        registeredDate: '2024-11-05',
        totalRentals: 5
    },
    {
        id: 'CUST005',
        name: 'David Thompson',
        email: 'david.thompson@email.com',
        phone: '+61 456 789 012',
        licenseNumber: 'DL-345678-901',
        registeredDate: '2025-02-20',
        totalRentals: 2
    }
];

// ===== DUMMY VEHICLES (5) =====
const DUMMY_VEHICLES = [
    {
        id: 'VEH001',
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        rego: 'TSL-001',
        transmission: 'Automatic',
        fuel: 'Electric',
        range: '600 km',
        color: 'Pearl White',
        mileage: 8500,
        status: VEHICLE_STATUS.AVAILABLE,
        dailyRate: 120,
        description: 'Premium electric sedan with autopilot'
    },
    {
        id: 'VEH002',
        make: 'BMW',
        model: 'X5',
        year: 2023,
        rego: 'BMW-777',
        transmission: 'Automatic',
        fuel: 'Petrol',
        range: '550 km',
        color: 'Black',
        mileage: 25000,
        status: VEHICLE_STATUS.AVAILABLE,
        dailyRate: 150,
        description: 'Luxury SUV with premium comfort'
    },
    {
        id: 'VEH003',
        make: 'Toyota',
        model: 'Camry',
        year: 2024,
        rego: 'TOY-555',
        transmission: 'Automatic',
        fuel: 'Hybrid',
        range: '700 km',
        color: 'Silver',
        mileage: 5200,
        status: VEHICLE_STATUS.AVAILABLE,
        dailyRate: 85,
        description: 'Reliable hybrid sedan, fuel-efficient'
    },
    {
        id: 'VEH004',
        make: 'Mercedes-Benz',
        model: 'C-Class',
        year: 2023,
        rego: 'MER-333',
        transmission: 'Automatic',
        fuel: 'Petrol',
        range: '520 km',
        color: 'White',
        mileage: 18000,
        status: VEHICLE_STATUS.AVAILABLE,
        dailyRate: 140,
        description: 'Premium sedan with luxury features'
    },
    {
        id: 'VEH005',
        make: 'Honda',
        model: 'CR-V',
        year: 2024,
        rego: 'HON-222',
        transmission: 'Automatic',
        fuel: 'Petrol',
        range: '480 km',
        color: 'Blue',
        mileage: 12000,
        status: VEHICLE_STATUS.AVAILABLE,
        dailyRate: 95,
        description: 'Spacious family SUV, perfect for road trips'
    }
];

// ===== REQUEST MANAGEMENT SYSTEM =====
class RequestManagementSystem {
    constructor() {
        this.storageKey = 'veera-rentals-requests';
        this.initializeStorage();
    }

    // Initialize empty storage if not exists
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Create new request
    createRequest(customerId, type, details) {
        const requests = this.getAllRequests();
        
        const newRequest = {
            id: 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            customerId: customerId,
            type: type, // pickup, swap, dropoff
            status: REQUEST_STATES.PENDING,
            vehicleId: details.vehicleId || null,
            currentVehicleId: details.currentVehicleId || null, // For swaps
            preferredDate: details.preferredDate,
            preferredTime: details.preferredTime,
            currentMileage: details.currentMileage || null,
            issues: details.issues || '',
            notes: details.notes || '',
            createdAt: new Date().toISOString(),
            approvedAt: null,
            approvalLocation: null,
            approvalTime: null,
            completedAt: null
        };

        requests.push(newRequest);
        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        
        return newRequest;
    }

    // Get all requests
    getAllRequests() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    // Get pending requests (for admin)
    getPendingRequests() {
        return this.getAllRequests().filter(r => r.status === REQUEST_STATES.PENDING);
    }

    // Get customer's requests
    getCustomerRequests(customerId) {
        return this.getAllRequests().filter(r => r.customerId === customerId);
    }

    // Approve request
    approveRequest(requestId, location, confirmedTime) {
        const requests = this.getAllRequests();
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return null;

        request.status = REQUEST_STATES.APPROVED;
        request.approvedAt = new Date().toISOString();
        request.approvalLocation = location;
        request.approvalTime = confirmedTime;

        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        
        // Send notification
        this.sendApprovalNotification(request);
        
        return request;
    }

    // Deny request
    denyRequest(requestId, reason) {
        const requests = this.getAllRequests();
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return null;

        request.status = REQUEST_STATES.DENIED;
        request.denyReason = reason;
        request.deniedAt = new Date().toISOString();

        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        
        // Send denial notification
        this.sendDenialNotification(request);
        
        return request;
    }

    // Complete request
    completeRequest(requestId) {
        const requests = this.getAllRequests();
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return null;

        request.status = REQUEST_STATES.COMPLETED;
        request.completedAt = new Date().toISOString();

        // Update vehicle status
        this.updateVehicleStatusForRequest(request);

        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        
        return request;
    }

    // Update vehicle status based on request completion
    updateVehicleStatusForRequest(request) {
        const vehicles = JSON.parse(localStorage.getItem('fleet-data') || '[]');
        
        if (request.type === REQUEST_TYPES.PICKUP) {
            // Mark vehicle as in use
            const vehicle = vehicles.find(v => v.id == request.vehicleId);
            if (vehicle) vehicle.status = VEHICLE_STATUS.IN_USE;
        } 
        else if (request.type === REQUEST_TYPES.SWAP) {
            // Old vehicle becomes returned, new becomes in-use
            const oldVehicle = vehicles.find(v => v.id == request.currentVehicleId);
            const newVehicle = vehicles.find(v => v.id == request.vehicleId);
            if (oldVehicle) oldVehicle.status = VEHICLE_STATUS.RETURNED;
            if (newVehicle) newVehicle.status = VEHICLE_STATUS.IN_USE;
        }
        else if (request.type === REQUEST_TYPES.DROPOFF) {
            // Vehicle becomes available again
            const vehicle = vehicles.find(v => v.id == request.vehicleId);
            if (vehicle) vehicle.status = VEHICLE_STATUS.AVAILABLE;
        }

        localStorage.setItem('fleet-data', JSON.stringify(vehicles));
    }

    // Mock email notifications
    sendApprovalNotification(request) {
        const customer = DUMMY_CUSTOMERS.find(c => c.id === request.customerId);
        if (!customer) return;

        const emailLog = JSON.parse(localStorage.getItem('email-notifications') || '[]');
        
        emailLog.push({
            id: 'EMAIL-' + Date.now(),
            to: customer.email,
            subject: '✅ Your Request #' + request.id + ' is Approved!',
            body: `
Dear ${customer.name},

Great news! Your ${request.type} request has been APPROVED.

📍 Meeting Location: ${request.approvalLocation}
⏰ Confirmed Time: ${new Date(request.approvalTime).toLocaleString()}
📋 Request ID: ${request.id}

Please arrive 15 minutes early. Bring your driver's license and contact details.

Best regards,
Veera Rentals Management Team
            `,
            status: 'sent',
            sentAt: new Date().toISOString()
        });

        localStorage.setItem('email-notifications', JSON.stringify(emailLog));
    }

    // Mock denial notification
    sendDenialNotification(request) {
        const customer = DUMMY_CUSTOMERS.find(c => c.id === request.customerId);
        if (!customer) return;

        const emailLog = JSON.parse(localStorage.getItem('email-notifications') || '[]');
        
        emailLog.push({
            id: 'EMAIL-' + Date.now(),
            to: customer.email,
            subject: '❌ Your Request #' + request.id + ' Could Not Be Processed',
            body: `
Dear ${customer.name},

We regret to inform you that your ${request.type} request has been DENIED.

Please contact our support team to discuss alternatives.

Best regards,
Veera Rentals Management Team
            `,
            status: 'sent',
            sentAt: new Date().toISOString()
        });

        localStorage.setItem('email-notifications', JSON.stringify(emailLog));
    }
}

// ===== VEHICLE MANAGEMENT =====
class VehicleManagementSystem {
    constructor() {
        this.storageKey = 'fleet-data';
        this.initializeFleet();
    }

    initializeFleet() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify(DUMMY_VEHICLES));
        }
    }

    getAvailableVehicles() {
        const fleet = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        return fleet.filter(v => v.status === VEHICLE_STATUS.AVAILABLE);
    }

    getAllVehicles() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    getVehicleById(id) {
        const fleet = this.getAllVehicles();
        return fleet.find(v => v.id == id);
    }

    updateVehicleStatus(vehicleId, newStatus) {
        const fleet = this.getAllVehicles();
        const vehicle = fleet.find(v => v.id == vehicleId);
        if (vehicle) {
            vehicle.status = newStatus;
            localStorage.setItem(this.storageKey, JSON.stringify(fleet));
        }
        return vehicle;
    }
}

// ===== CUSTOMER MANAGEMENT =====
class CustomerManagementSystem {
    getCustomerById(customerId) {
        return DUMMY_CUSTOMERS.find(c => c.id === customerId);
    }

    getAllCustomers() {
        return DUMMY_CUSTOMERS;
    }

    // For login simulation
    getCustomerByEmail(email) {
        return DUMMY_CUSTOMERS.find(c => c.email === email);
    }
}

// ===== INITIALIZE SYSTEMS =====
const requestSystem = new RequestManagementSystem();
const vehicleSystem = new VehicleManagementSystem();
const customerSystem = new CustomerManagementSystem();

// Initialize dummy data on first load
function initializeDummyData() {
    // Fleet already initialized in VehicleManagementSystem
    // Requests start empty (will be created by customers)
    console.log('Veera Rentals system initialized with:');
    console.log('- 5 Dummy Customers');
    console.log('- 5 Dummy Vehicles');
    console.log('- Pre-Approval Workflow Ready');
}

// Auto-initialize
initializeDummyData();
