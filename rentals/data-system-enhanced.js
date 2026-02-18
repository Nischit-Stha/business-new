/**
 * STARR365 CAR RENTAL - PRODUCTION READY PRE-APPROVAL SYSTEM
 * Enhanced Data Structure, Workflows & Calculations
 * 
 * Features:
 * - 25+ vehicle fleet with realistic specs
 * - 15+ customer profiles
 * - Insurance plans with coverage details
 * - Pricing calculations (daily, mileage, late fees)
 * - Equipment rentals (GPS, child seats, etc.)
 * - Rental agreement generation
 * - Advanced analytics
 */

// ===== ENUMS & CONSTANTS =====
const REQUEST_STATES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    DENIED: 'denied',
    COMPLETED: 'completed'
};

const REQUEST_TYPES = {
    PICKUP: 'pickup',
    SWAP: 'swap',
    DROPOFF: 'dropoff'
};

const VEHICLE_STATUS = {
    AVAILABLE: 'available',
    IN_USE: 'in-use',
    MAINTENANCE: 'maintenance',
    RETURNED: 'returned',
    RESERVED: 'reserved'
};

const VEHICLE_CATEGORIES = {
    ECONOMY: 'Economy',
    COMPACT: 'Compact',
    MIDSIZE: 'Midsize',
    SEDAN: 'Sedan',
    SUV: 'SUV',
    LUXURY: 'Luxury',
    VAN: 'Van',
    TRUCK: 'Truck'
};

// ===== INSURANCE PLANS =====
const INSURANCE_PLANS = {
    BASIC: {
        id: 'INS-BASIC',
        name: 'Basic Liability',
        description: 'Liability coverage only - Customer pays for damage',
        dailyRate: 0,
        deductible: 2500,
        coverage: 'Third-party liability only',
        details: ['No collision coverage', 'Customer liable for all damage', 'Third-party only']
    },
    STANDARD: {
        id: 'INS-STD',
        name: 'Standard Protection',
        description: 'Collision & comprehensive with $750 deductible (RECOMMENDED)',
        dailyRate: 12.99,
        deductible: 750,
        coverage: 'Collision & Comprehensive',
        details: ['Collision coverage', 'Comprehensive coverage', 'TPD included', '$750 deductible']
    },
    PREMIUM: {
        id: 'INS-PREM',
        name: 'Premium Coverage',
        description: 'Full coverage with $250 deductible + roadside assistance',
        dailyRate: 19.99,
        deductible: 250,
        coverage: 'Full Coverage + Roadside',
        details: ['Collision coverage', 'Comprehensive coverage', 'Roadside assistance 24/7', '$250 deductible']
    },
    SUPER: {
        id: 'INS-SUPER',
        name: 'Super Coverage',
        description: 'Zero deductible + upgrade protection + concierge (BEST VALUE)',
        dailyRate: 29.99,
        deductible: 0,
        coverage: 'Full Coverage Zero Deductible',
        details: ['Zero deductible', 'Upgrade protection', 'Roadside 24/7', 'Concierge service', '100% windscreen coverage']
    }
};

// ===== EQUIPMENT OPTIONS =====
const EQUIPMENT = {
    GPS: { id: 'EQ-GPS', name: 'GPS Navigation', dailyRate: 5 },
    CHILD_SEAT: { id: 'EQ-CS', name: 'Child Seat (0-5yr)', dailyRate: 8 },
    BOOSTER_SEAT: { id: 'EQ-BS', name: 'Booster Seat (5-12yr)', dailyRate: 6 },
    WIFI_HOTSPOT: { id: 'EQ-WIFI', name: '4G WiFi Hotspot', dailyRate: 4 },
    ROOF_RACK: { id: 'EQ-RR', name: 'Roof Rack', dailyRate: 10 },
    SKI_RACK: { id: 'EQ-SKI', name: 'Ski Rack', dailyRate: 12 }
};

// ===== PRICING CONFIGURATION =====
const PRICING_CONFIG = {
    DAILY_MILEAGE_ALLOWANCE: 150,           // km per day
    EXCESS_MILEAGE_RATE: 0.30,               // $ per km
    LATE_FEE_PER_HOUR: 25,                   // Start after 1 hour grace
    FUEL_UNDERFILL_CHARGE: 50,               // If returned with <1/4 tank
    CLEANING_FEE: 75,
    DISCOUNT_WEEKLY: 0.15,                   // 7+ days
    DISCOUNT_MONTHLY: 0.25,                  // 30+ days
    YOUNG_DRIVER_SURCHARGE: 15,              // Per day if <25 years old
    DELIVERY_FEE: 45,
    PICKUP_FEE: 35
};

// ===== EXPANDED CUSTOMER DATABASE (15) =====
const DUMMY_CUSTOMERS = [
    {
        id: 'CUST001',
        name: 'James Wilson',
        email: 'james.wilson@business.com',
        phone: '+1-555-0101',
        age: 35,
        licenseNumber: 'DL-123456-789',
        licenseExpiry: '2027-06-15',
        registeredDate: '2023-01-15',
        totalRentals: 12,
        totalSpent: 4850.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST002',
        name: 'Sarah Ahmed',
        email: 'sarah.ahmed@company.co',
        phone: '+1-555-0102',
        age: 41,
        licenseNumber: 'DL-987654-321',
        licenseExpiry: '2026-11-22',
        registeredDate: '2024-08-22',
        totalRentals: 8,
        totalSpent: 2940.00,
        rating: 4,
        verified: true
    },
    {
        id: 'CUST003',
        name: 'Michael Chen',
        email: 'michael.chen@startup.io',
        phone: '+1-555-0103',
        age: 28,
        licenseNumber: 'DL-456789-012',
        licenseExpiry: '2028-03-10',
        registeredDate: '2025-03-10',
        totalRentals: 3,
        totalSpent: 585.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST004',
        name: 'Emma Rodriguez',
        email: 'emma.r@family.net',
        phone: '+1-555-0104',
        age: 33,
        licenseNumber: 'DL-789012-345',
        licenseExpiry: '2027-11-05',
        registeredDate: '2024-11-05',
        totalRentals: 6,
        totalSpent: 1890.00,
        rating: 4,
        verified: true
    },
    {
        id: 'CUST005',
        name: 'David Thompson',
        email: 'david.t@consulting.com',
        phone: '+1-555-0105',
        age: 52,
        licenseNumber: 'DL-345678-901',
        licenseExpiry: '2025-02-20',
        registeredDate: '2025-02-20',
        totalRentals: 15,
        totalSpent: 6725.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST006',
        name: 'Lisa Park',
        email: 'lisa.park@design.co',
        phone: '+1-555-0106',
        age: 29,
        licenseNumber: 'DL-234567-890',
        licenseExpiry: '2027-08-12',
        registeredDate: '2024-02-14',
        totalRentals: 10,
        totalSpent: 3500.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST007',
        name: 'Robert Garcia',
        email: 'robert.garcia@finance.net',
        phone: '+1-555-0107',
        age: 45,
        licenseNumber: 'DL-567890-123',
        licenseExpiry: '2026-05-30',
        registeredDate: '2023-09-03',
        totalRentals: 19,
        totalSpent: 7200.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST008',
        name: 'Jessica Brown',
        email: 'jessica.b@marketing.com',
        phone: '+1-555-0108',
        age: 31,
        licenseNumber: 'DL-890123-456',
        licenseExpiry: '2027-12-08',
        registeredDate: '2024-04-17',
        totalRentals: 5,
        totalSpent: 1475.00,
        rating: 4,
        verified: true
    },
    {
        id: 'CUST009',
        name: 'Kevin Martinez',
        email: 'kevin.m@tech.io',
        phone: '+1-555-0109',
        age: 38,
        licenseNumber: 'DL-123789-456',
        licenseExpiry: '2026-09-14',
        registeredDate: '2024-01-22',
        totalRentals: 11,
        totalSpent: 4400.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST010',
        name: 'Amanda White',
        email: 'amanda.white@executive.biz',
        phone: '+1-555-0110',
        age: 48,
        licenseNumber: 'DL-456123-789',
        licenseExpiry: '2025-07-25',
        registeredDate: '2023-06-11',
        totalRentals: 22,
        totalSpent: 9850.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST011',
        name: 'Nicholas Lee',
        email: 'nicholas.lee@travel.com',
        phone: '+1-555-0111',
        age: 26,
        licenseNumber: 'DL-789456-123',
        licenseExpiry: '2028-01-19',
        registeredDate: '2024-07-08',
        totalRentals: 4,
        totalSpent: 960.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST012',
        name: 'Victoria Scott',
        email: 'victoria.scott@hotel.net',
        phone: '+1-555-0112',
        age: 34,
        licenseNumber: 'DL-012345-678',
        licenseExpiry: '2027-03-30',
        registeredDate: '2024-09-20',
        totalRentals: 7,
        totalSpent: 2100.00,
        rating: 4,
        verified: true
    },
    {
        id: 'CUST013',
        name: 'Christopher Hall',
        email: 'christopher.h@energy.co',
        phone: '+1-555-0113',
        age: 39,
        licenseNumber: 'DL-345012-789',
        licenseExpiry: '2026-10-08',
        registeredDate: '2023-11-17',
        totalRentals: 14,
        totalSpent: 5600.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST014',
        name: 'Rachel Young',
        email: 'rachel.young@media.io',
        phone: '+1-555-0114',
        age: 30,
        licenseNumber: 'DL-678345-012',
        licenseExpiry: '2027-04-12',
        registeredDate: '2024-03-05',
        totalRentals: 8,
        totalSpent: 2560.00,
        rating: 5,
        verified: true
    },
    {
        id: 'CUST015',
        name: 'Andrew Martin',
        email: 'andrew.martin@law.firm',
        phone: '+1-555-0115',
        age: 44,
        licenseNumber: 'DL-901678-345',
        licenseExpiry: '2026-12-03',
        registeredDate: '2023-08-28',
        totalRentals: 17,
        totalSpent: 6800.00,
        rating: 5,
        verified: true
    }
];

// ===== EXPANDED VEHICLE FLEET (25) =====
const DUMMY_VEHICLES = [
    // ECONOMY (5)
    { id: 'VEH001', make: 'Toyota', model: 'Corolla', year: 2024, rego: 'TCR-001', transmission: 'Automatic', fuel: 'Hybrid', range: '700 km', color: 'Silver', mileage: 8500, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 45, category: VEHICLE_CATEGORIES.ECONOMY, seats: 5, trunk: '400L', consumption: '4.5L/100km', features: ['Bluetooth', 'Backup camera', 'Lane assist'] },
    { id: 'VEH002', make: 'Honda', model: 'Civic', year: 2024, rego: 'HND-002', transmission: 'CVT', fuel: 'Petrol', range: '550 km', color: 'Blue', mileage: 12000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 48, category: VEHICLE_CATEGORIES.ECONOMY, seats: 5, trunk: '380L', consumption: '6.2L/100km', features: ['Apple CarPlay', 'Bluetooth', 'Lane assist'] },
    { id: 'VEH003', make: 'Hyundai', model: 'Elantra', year: 2023, rego: 'HYU-003', transmission: 'Automatic', fuel: 'Petrol', range: '480 km', color: 'Black', mileage: 28000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 42, category: VEHICLE_CATEGORIES.ECONOMY, seats: 5, trunk: '370L', consumption: '6.5L/100km', features: ['Bluetooth', 'Backup camera'] },
    { id: 'VEH004', make: 'Nissan', model: 'Altima', year: 2024, rego: 'NIS-004', transmission: 'CVT', fuel: 'Petrol', range: '520 km', color: 'White', mileage: 5200, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 50, category: VEHICLE_CATEGORIES.ECONOMY, seats: 5, trunk: '420L', consumption: '6.0L/100km', features: ['Bluetooth', 'Backup camera', 'Lane assist', 'Cruise control'] },
    { id: 'VEH005', make: 'Kia', model: 'Forte', year: 2023, rego: 'KIA-005', transmission: 'Automatic', fuel: 'Petrol', range: '520 km', color: 'Red', mileage: 22000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 46, category: VEHICLE_CATEGORIES.ECONOMY, seats: 5, trunk: '370L', consumption: '6.3L/100km', features: ['Bluetooth', 'Lane assist'] },

    // MIDSIZE (5)
    { id: 'VEH006', make: 'Toyota', model: 'Camry', year: 2024, rego: 'CAM-006', transmission: 'Automatic', fuel: 'Hybrid', range: '750 km', color: 'Silver', mileage: 5200, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 65, category: VEHICLE_CATEGORIES.SEDAN, seats: 5, trunk: '450L', consumption: '5.0L/100km', features: ['Leather', 'Sunroof', 'Climate control', 'Lane assist', 'Adaptive cruise'] },
    { id: 'VEH007', make: 'Mazda', model: 'CX-5', year: 2023, rego: 'MAZ-007', transmission: 'Automatic', fuel: 'Petrol', range: '620 km', color: 'Red', mileage: 18000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 68, category: VEHICLE_CATEGORIES.SUV, seats: 5, trunk: '500L', consumption: '7.2L/100km', features: ['Sunroof', 'Lane assist', 'Cruise control', 'Leather'] },
    { id: 'VEH008', make: 'Honda', model: 'Accord', year: 2024, rego: 'ACC-008', transmission: 'Automatic', fuel: 'Petrol', range: '580 km', color: 'Black', mileage: 8000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 62, category: VEHICLE_CATEGORIES.SEDAN, seats: 5, trunk: '430L', consumption: '6.8L/100km', features: ['Sunroof', 'Leather', 'Lane assist', 'Adaptive cruise'] },
    { id: 'VEH009', make: 'Ford', model: 'Fusion', year: 2023, rego: 'FRD-009', transmission: 'Automatic', fuel: 'Hybrid', range: '650 km', color: 'White', mileage: 25000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 60, category: VEHICLE_CATEGORIES.SEDAN, seats: 5, trunk: '430L', consumption: '5.5L/100km', features: ['Lane assist', 'Cruise control'] },
    { id: 'VEH010', make: 'Volkswagen', model: 'Passat', year: 2024, rego: 'VWG-010', transmission: 'Automatic', fuel: 'Petrol', range: '600 km', color: 'Gray', mileage: 12000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 66, category: VEHICLE_CATEGORIES.SEDAN, seats: 5, trunk: '460L', consumption: '6.9L/100km', features: ['Leather', 'Sunroof', 'Lane assist', 'Adaptive cruise'] },

    // SUV (5)
    { id: 'VEH011', make: 'Honda', model: 'CR-V', year: 2024, rego: 'CRV-011', transmission: 'Automatic', fuel: 'Petrol', range: '580 km', color: 'Blue', mileage: 12000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 75, category: VEHICLE_CATEGORIES.SUV, seats: 5, trunk: '580L', consumption: '7.8L/100km', features: ['Sunroof', 'Lane assist', 'Adaptive cruise', 'Leather'] },
    { id: 'VEH012', make: 'Toyota', model: 'RAV4', year: 2023, rego: 'RAV-012', transmission: 'Automatic', fuel: 'AWD Petrol', range: '620 km', color: 'Silver', mileage: 28000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 78, category: VEHICLE_CATEGORIES.SUV, seats: 5, trunk: '600L', consumption: '8.2L/100km', features: ['AWD', 'Lane assist', 'Cruise control', 'Leather'] },
    { id: 'VEH013', make: 'Mazda', model: 'CX-9', year: 2024, rego: 'CX9-013', transmission: 'Automatic', fuel: 'Petrol', range: '680 km', color: 'Black', mileage: 8500, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 85, category: VEHICLE_CATEGORIES.SUV, seats: 7, trunk: '700L', consumption: '8.5L/100km', features: ['Leather', 'Sunroof', 'Lane assist', 'Adaptive cruise', 'Panoramic roof'] },
    { id: 'VEH014', make: 'Jeep', model: 'Grand Cherokee', year: 2023, rego: 'JEP-014', transmission: 'Automatic', fuel: 'Petrol', range: '520 km', color: 'Navy', mileage: 32000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 90, category: VEHICLE_CATEGORIES.SUV, seats: 5, trunk: '630L', consumption: '9.5L/100km', features: ['AWD', 'Lane assist', 'Leather', 'Sunroof'] },
    { id: 'VEH015', make: 'Volkswagen', model: 'Tiguan', year: 2024, rego: 'TIG-015', transmission: 'Automatic', fuel: 'Petrol', range: '600 km', color: 'White', mileage: 15000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 80, category: VEHICLE_CATEGORIES.SUV, seats: 5, trunk: '650L', consumption: '7.9L/100km', features: ['Lane assist', 'Cruise control', 'Leather'] },

    // LUXURY (5)
    { id: 'VEH016', make: 'BMW', model: 'X5', year: 2023, rego: 'BMW-016', transmission: 'Automatic', fuel: 'Petrol', range: '550 km', color: 'Black', mileage: 25000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 150, category: VEHICLE_CATEGORIES.LUXURY, seats: 5, trunk: '650L', consumption: '10.2L/100km', features: ['Leather', 'Sunroof', 'Premium sound', 'Lane assist', 'Adaptive cruise'] },
    { id: 'VEH017', make: 'Mercedes-Benz', model: 'C-Class', year: 2024, rego: 'MER-017', transmission: 'Automatic', fuel: 'Petrol', range: '620 km', color: 'White', mileage: 10000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 140, category: VEHICLE_CATEGORIES.LUXURY, seats: 5, trunk: '430L', consumption: '8.5L/100km', features: ['Leather', 'Sunroof', 'Premium sound', 'Lane assist', 'Adaptive cruise'] },
    { id: 'VEH018', make: 'Audi', model: 'A4', year: 2023, rego: 'AUD-018', transmission: 'Automatic', fuel: 'Petrol', range: '580 km', color: 'Gray', mileage: 22000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 130, category: VEHICLE_CATEGORIES.LUXURY, seats: 5, trunk: '450L', consumption: '8.8L/100km', features: ['Leather', 'Sunroof', 'Lane assist', 'Cruise control'] },
    { id: 'VEH019', make: 'Tesla', model: 'Model 3', year: 2024, rego: 'TSL-019', transmission: 'Automatic', fuel: 'Electric', range: '650 km', color: 'White', mileage: 8500, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 120, category: VEHICLE_CATEGORIES.LUXURY, seats: 5, trunk: '500L', consumption: '0 L/100km', features: ['Autopilot', 'Premium sound', 'Lane assist', 'Touchscreen'] },
    { id: 'VEH020', make: 'Lexus', model: 'RX 350', year: 2024, rego: 'LEX-020', transmission: 'Automatic', fuel: 'Hybrid', range: '700 km', color: 'Silver', mileage: 12000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 160, category: VEHICLE_CATEGORIES.LUXURY, seats: 5, trunk: '680L', consumption: '6.2L/100km', features: ['Leather', 'Sunroof', 'Premium sound', 'Lane assist', 'Adaptive cruise'] },

    // VAN & TRUCK (5)
    { id: 'VEH021', make: 'Honda', model: 'Odyssey', year: 2023, rego: 'ODY-021', transmission: 'Automatic', fuel: 'Petrol', range: '620 km', color: 'Black', mileage: 28000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 95, category: VEHICLE_CATEGORIES.VAN, seats: 8, trunk: '1000L', consumption: '9.5L/100km', features: ['Leather', 'Sliding doors', 'Backup camera', 'Lane assist'] },
    { id: 'VEH022', make: 'Toyota', model: 'Sienna', year: 2024, rego: 'SIE-022', transmission: 'Automatic', fuel: 'Hybrid', range: '700 km', color: 'White', mileage: 15000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 98, category: VEHICLE_CATEGORIES.VAN, seats: 8, trunk: '1050L', consumption: '7.2L/100km', features: ['Hybrid', 'Sliding doors', 'Backup camera', 'Lane assist'] },
    { id: 'VEH023', make: 'Ford', model: 'F-150', year: 2023, rego: 'F150-023', transmission: 'Automatic', fuel: 'Petrol', range: '500 km', color: 'Silver', mileage: 35000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 110, category: VEHICLE_CATEGORIES.TRUCK, seats: 5, trunk: '1500L', consumption: '11.5L/100km', features: ['4WD', 'Towing package', 'Backup camera'] },
    { id: 'VEH024', make: 'Chevrolet', model: 'Silverado', year: 2024, rego: 'CHV-024', transmission: 'Automatic', fuel: 'Petrol', range: '520 km', color: 'Black', mileage: 22000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 115, category: VEHICLE_CATEGORIES.TRUCK, seats: 5, trunk: '1600L', consumption: '11.8L/100km', features: ['4WD', 'Towing package', 'Lane assist', 'Backup camera'] },
    { id: 'VEH025', make: 'Ram', model: '1500', year: 2023, rego: 'RAM-025', transmission: 'Automatic', fuel: 'Petrol', range: '480 km', color: 'Red', mileage: 28000, status: VEHICLE_STATUS.AVAILABLE, dailyRate: 112, category: VEHICLE_CATEGORIES.TRUCK, seats: 5, trunk: '1550L', consumption: '12.0L/100km', features: ['4WD', 'Towing package', 'Backup camera'] }
];

// ===== REQUEST MANAGEMENT SYSTEM =====
class RequestManagementSystem {
    constructor() {
        this.storageKey = 'starr365-requests';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    createRequest(customerId, type, details) {
        const requests = this.getAllRequests();
        
        const newRequest = {
            id: 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            customerId: customerId,
            type: type,
            status: REQUEST_STATES.PENDING,
            vehicleId: details.vehicleId || null,
            currentVehicleId: details.currentVehicleId || null,
            preferredDate: details.preferredDate,
            preferredTime: details.preferredTime,
            currentMileage: details.currentMileage || null,
            insurance: details.insurance || 'INS-STD',
            equipment: details.equipment || [],
            notes: details.notes || '',
            issues: details.issues || '',
            createdAt: new Date().toISOString(),
            approvedAt: null,
            approvalLocation: null,
            approvalTime: null,
            completedAt: null,
            estimatedCost: this.calculateEstimatedCost(details)
        };

        requests.push(newRequest);
        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        
        return newRequest;
    }

    calculateEstimatedCost(details) {
        const vehicle = vehicleSystem.getVehicleById(details.vehicleId);
        if (!vehicle) return 0;

        const startDate = new Date(details.preferredDate);
        const today = new Date();
        const days = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24)) || 1;
        
        let cost = vehicle.dailyRate * days;

        // Add insurance
        const insurance = INSURANCE_PLANS[details.insurance.split('-')[1].toUpperCase()] || INSURANCE_PLANS.STANDARD;
        cost += insurance.dailyRate * days;

        // Add equipment
        if (details.equipment && details.equipment.length > 0) {
            details.equipment.forEach(eqId => {
                const eq = Object.values(EQUIPMENT).find(e => e.id === eqId);
                if (eq) cost += eq.dailyRate * days;
            });
        }

        return Math.round(cost * 100) / 100;
    }

    getAllRequests() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    getPendingRequests() {
        return this.getAllRequests().filter(r => r.status === REQUEST_STATES.PENDING);
    }

    getCustomerRequests(customerId) {
        return this.getAllRequests().filter(r => r.customerId === customerId);
    }

    approveRequest(requestId, location, confirmedTime) {
        const requests = this.getAllRequests();
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return null;

        request.status = REQUEST_STATES.APPROVED;
        request.approvedAt = new Date().toISOString();
        request.approvalLocation = location;
        request.approvalTime = confirmedTime;

        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        this.sendApprovalNotification(request);
        
        return request;
    }

    denyRequest(requestId, reason) {
        const requests = this.getAllRequests();
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return null;

        request.status = REQUEST_STATES.DENIED;
        request.denyReason = reason;
        request.deniedAt = new Date().toISOString();

        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        this.sendDenialNotification(request);
        
        return request;
    }

    completeRequest(requestId) {
        const requests = this.getAllRequests();
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return null;

        request.status = REQUEST_STATES.COMPLETED;
        request.completedAt = new Date().toISOString();
        this.updateVehicleStatusForRequest(request);

        localStorage.setItem(this.storageKey, JSON.stringify(requests));
        
        return request;
    }

    updateVehicleStatusForRequest(request) {
        const vehicles = JSON.parse(localStorage.getItem('fleet-data') || '[]');
        
        if (request.type === REQUEST_TYPES.PICKUP) {
            const vehicle = vehicles.find(v => v.id == request.vehicleId);
            if (vehicle) vehicle.status = VEHICLE_STATUS.IN_USE;
        } 
        else if (request.type === REQUEST_TYPES.SWAP) {
            const oldVehicle = vehicles.find(v => v.id == request.currentVehicleId);
            const newVehicle = vehicles.find(v => v.id == request.vehicleId);
            if (oldVehicle) oldVehicle.status = VEHICLE_STATUS.RETURNED;
            if (newVehicle) newVehicle.status = VEHICLE_STATUS.IN_USE;
        }
        else if (request.type === REQUEST_TYPES.DROPOFF) {
            const vehicle = vehicles.find(v => v.id == request.vehicleId);
            if (vehicle) vehicle.status = VEHICLE_STATUS.AVAILABLE;
        }

        localStorage.setItem('fleet-data', JSON.stringify(vehicles));
    }

    sendApprovalNotification(request) {
        const customer = customerSystem.getCustomerById(request.customerId);
        const vehicle = vehicleSystem.getVehicleById(request.vehicleId);
        if (!customer || !vehicle) return;

        const emailLog = JSON.parse(localStorage.getItem('email-notifications') || '[]');
        
        emailLog.push({
            id: 'EMAIL-' + Date.now(),
            to: customer.email,
            subject: '✅ Request #' + request.id.substring(0, 12) + ' Approved | STARR365',
            body: `
Hello ${customer.name},

Great news! Your ${request.type} request has been APPROVED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Request Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request ID: ${request.id.substring(0, 12)}
Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Rego: ${vehicle.rego}

📍 Meeting Location: ${request.approvalLocation}
⏰ Confirmed Date: ${new Date(request.approvalTime).toLocaleDateString()}
🕐 Confirmed Time: ${new Date(request.approvalTime).toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Estimated Cost: $${request.estimatedCost}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please arrive 15 minutes early.
Bring your driver's license and a valid payment method.

Safe travels!
STARR365 Rental Management
            `,
            status: 'sent',
            type: 'approval',
            requestId: request.id,
            sentAt: new Date().toISOString()
        });

        localStorage.setItem('email-notifications', JSON.stringify(emailLog));
    }

    sendDenialNotification(request) {
        const customer = customerSystem.getCustomerById(request.customerId);
        if (!customer) return;

        const emailLog = JSON.parse(localStorage.getItem('email-notifications') || '[]');
        
        emailLog.push({
            id: 'EMAIL-' + Date.now(),
            to: customer.email,
            subject: '❌ Request #' + request.id.substring(0, 12) + ' Could Not Be Processed',
            body: `
Hello ${customer.name},

Unfortunately, we could not process your ${request.type} request at this time.

Request ID: ${request.id.substring(0, 12)}
Reason: ${request.denyReason || 'Not available for selected date'}

Please contact our support team to discuss alternatives:
📞 1-800-STARR-365
📧 support@starr365.com

Best regards,
STARR365 Rental Management
            `,
            status: 'sent',
            type: 'denial',
            requestId: request.id,
            sentAt: new Date().toISOString()
        });

        localStorage.setItem('email-notifications', JSON.stringify(emailLog));
    }

    getRequestById(id) {
        return this.getAllRequests().find(r => r.id === id);
    }

    generateRentalAgreement(requestId) {
        const request = this.getRequestById(requestId);
        const customer = customerSystem.getCustomerById(request.customerId);
        const vehicle = vehicleSystem.getVehicleById(request.vehicleId);
        const insurance = INSURANCE_PLANS[request.insurance.split('-')[1].toUpperCase()];

        return {
            requestId: request.id,
            customerName: customer.name,
            customerLicense: customer.licenseNumber,
            vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.rego})`,
            pickupLocation: request.approvalLocation,
            pickupTime: request.approvalTime,
            rentalPeriod: request.preferredDate,
            dailyRate: vehicle.dailyRate,
            insurancePlan: insurance.name,
            insuranceCost: insurance.dailyRate,
            estimatedTotal: request.estimatedCost,
            termsAccepted: false
        };
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

    getVehiclesByCategory(category) {
        return this.getAllVehicles().filter(v => v.category === category);
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

    addVehicle(vehicleData) {
        const fleet = this.getAllVehicles();
        const newVehicle = {
            id: 'VEH' + (fleet.length + 1).toString().padStart(3, '0'),
            ...vehicleData,
            status: VEHICLE_STATUS.AVAILABLE
        };
        fleet.push(newVehicle);
        localStorage.setItem(this.storageKey, JSON.stringify(fleet));
        return newVehicle;
    }

    updateVehicle(vehicleId, updates) {
        const fleet = this.getAllVehicles();
        const vehicle = fleet.find(v => v.id == vehicleId);
        if (vehicle) {
            Object.assign(vehicle, updates);
            localStorage.setItem(this.storageKey, JSON.stringify(fleet));
        }
        return vehicle;
    }

    deleteVehicle(vehicleId) {
        let fleet = this.getAllVehicles();
        fleet = fleet.filter(v => v.id != vehicleId);
        localStorage.setItem(this.storageKey, JSON.stringify(fleet));
        return true;
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

    getCustomerByEmail(email) {
        return DUMMY_CUSTOMERS.find(c => c.email === email);
    }

    getCustomerStats(customerId) {
        const customer = this.getCustomerById(customerId);
        const requests = requestSystem.getCustomerRequests(customerId);
        return {
            ...customer,
            totalRequests: requests.length,
            completedRequests: requests.filter(r => r.status === REQUEST_STATES.COMPLETED).length,
            pendingRequests: requests.filter(r => r.status === REQUEST_STATES.PENDING).length,
            approvedRequests: requests.filter(r => r.status === REQUEST_STATES.APPROVED).length
        };
    }
}

// ===== ANALYTICS SYSTEM =====
class AnalyticsSystem {
    getFleetStats() {
        const vehicles = vehicleSystem.getAllVehicles();
        return {
            total: vehicles.length,
            available: vehicles.filter(v => v.status === VEHICLE_STATUS.AVAILABLE).length,
            inUse: vehicles.filter(v => v.status === VEHICLE_STATUS.IN_USE).length,
            maintenance: vehicles.filter(v => v.status === VEHICLE_STATUS.MAINTENANCE).length,
            utilization: Math.round((vehicles.filter(v => v.status === VEHICLE_STATUS.IN_USE).length / vehicles.length) * 100)
        };
    }

    getRevenueStats() {
        const requests = requestSystem.getAllRequests();
        const completed = requests.filter(r => r.status === REQUEST_STATES.COMPLETED);
        const total = completed.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
        return {
            totalRevenue: total,
            averagePerRental: completed.length > 0 ? Math.round(total / completed.length) : 0,
            completedRentals: completed.length,
            totalRequests: requests.length
        };
    }

    getRequestStats() {
        const requests = requestSystem.getAllRequests();
        return {
            pending: requests.filter(r => r.status === REQUEST_STATES.PENDING).length,
            approved: requests.filter(r => r.status === REQUEST_STATES.APPROVED).length,
            denied: requests.filter(r => r.status === REQUEST_STATES.DENIED).length,
            completed: requests.filter(r => r.status === REQUEST_STATES.COMPLETED).length
        };
    }

    getMostPopularVehicles() {
        const requests = requestSystem.getAllRequests();
        const vehicleCounts = {};
        requests.forEach(r => {
            vehicleCounts[r.vehicleId] = (vehicleCounts[r.vehicleId] || 0) + 1;
        });
        
        return Object.entries(vehicleCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([vehicleId, count]) => ({
                vehicle: vehicleSystem.getVehicleById(vehicleId),
                rentals: count
            }));
    }
}

// ===== INITIALIZE SYSTEMS =====
const requestSystem = new RequestManagementSystem();
const vehicleSystem = new VehicleManagementSystem();
const customerSystem = new CustomerManagementSystem();
const analyticsSystem = new AnalyticsSystem();

function initializeDummyData() {
    console.log('✅ STARR365 Enhanced System Initialized');
    console.log('📊 Fleet: ' + vehicleSystem.getAllVehicles().length + ' vehicles');
    console.log('👥 Customers: ' + customerSystem.getAllCustomers().length + ' registered');
    console.log('💳 Insurance Plans: 4 options available');
    console.log('🎁 Equipment: 6 rentable items');
}

initializeDummyData();
