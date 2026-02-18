// ========================
// AUTHENTICATION SYSTEM
// ========================

class AuthenticationSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Load current session
        const sessionData = localStorage.getItem('currentSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            // Check if session is still valid (24 hour expiry)
            if (new Date(session.expiry) > new Date()) {
                this.currentUser = session.user;
            } else {
                this.logout();
            }
        }
    }

    // Register new customer
    register(userData) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        
        // Validate email doesn't already exist
        if (customers.some(c => c.email === userData.email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Validate phone doesn't already exist
        if (customers.some(c => c.phone === userData.phone)) {
            return { success: false, message: 'Phone number already registered' };
        }

        // Create new customer
        const newCustomer = {
            id: 'CUST' + String(Date.now()).slice(-6),
            ...userData,
            createdAt: new Date().toISOString(),
            rating: 5.0,
            totalSpent: 0,
            rentalHistory: [],
            status: 'active'
        };

        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));

        return { success: true, message: 'Registration successful', customer: newCustomer };
    }

    // Customer login
    login(email, password) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        
        const customer = customers.find(c => c.email === email && c.password === password);
        
        if (!customer) {
            return { success: false, message: 'Invalid email or password' };
        }

        if (customer.status === 'suspended') {
            return { success: false, message: 'Account suspended. Please contact support.' };
        }

        // Create session (24 hour expiry)
        const session = {
            user: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                licenseNumber: customer.licenseNumber,
                licenseExpiry: customer.licenseExpiry,
                rating: customer.rating,
                totalSpent: customer.totalSpent
            },
            loginTime: new Date().toISOString(),
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('currentSession', JSON.stringify(session));
        this.currentUser = session.user;

        return { success: true, message: 'Login successful', user: session.user };
    }

    // Admin login
    adminLogin(username, password) {
        // Simple admin credentials (in production, use proper backend authentication)
        const adminCredentials = [
            { username: 'admin', password: 'admin123', role: 'superadmin', name: 'Admin User' },
            { username: 'manager', password: 'manager123', role: 'manager', name: 'Manager User' }
        ];

        const admin = adminCredentials.find(a => a.username === username && a.password === password);

        if (!admin) {
            return { success: false, message: 'Invalid admin credentials' };
        }

        // Create admin session (8 hour expiry)
        const session = {
            user: {
                username: admin.username,
                name: admin.name,
                role: admin.role,
                isAdmin: true
            },
            loginTime: new Date().toISOString(),
            expiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('adminSession', JSON.stringify(session));

        return { success: true, message: 'Admin login successful', user: session.user };
    }

    // Logout
    logout() {
        localStorage.removeItem('currentSession');
        this.currentUser = null;
        window.location.href = 'login.html';
    }

    // Admin logout
    adminLogout() {
        localStorage.removeItem('adminSession');
        window.location.href = 'admin-login.html';
    }

    // Check if user is logged in
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Require authentication (redirect if not logged in)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Check admin authentication
    isAdminAuthenticated() {
        const sessionData = localStorage.getItem('adminSession');
        if (!sessionData) return false;

        const session = JSON.parse(sessionData);
        if (new Date(session.expiry) <= new Date()) {
            localStorage.removeItem('adminSession');
            return false;
        }

        return true;
    }

    // Require admin authentication
    requireAdminAuth() {
        if (!this.isAdminAuthenticated()) {
            window.location.href = 'admin-login.html';
            return false;
        }
        return true;
    }

    // Get admin user
    getAdminUser() {
        const sessionData = localStorage.getItem('adminSession');
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        return session.user;
    }

    // Update customer profile
    updateProfile(customerId, updates) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const index = customers.findIndex(c => c.id === customerId);

        if (index === -1) {
            return { success: false, message: 'Customer not found' };
        }

        // Prevent updating sensitive fields
        delete updates.id;
        delete updates.createdAt;
        delete updates.rating;
        delete updates.totalSpent;

        customers[index] = { ...customers[index], ...updates };
        localStorage.setItem('customers', JSON.stringify(customers));

        // Update current session
        if (this.currentUser && this.currentUser.id === customerId) {
            const sessionData = JSON.parse(localStorage.getItem('currentSession'));
            sessionData.user = { ...sessionData.user, ...updates };
            localStorage.setItem('currentSession', JSON.stringify(sessionData));
            this.currentUser = sessionData.user;
        }

        return { success: true, message: 'Profile updated successfully' };
    }

    // Change password
    changePassword(customerId, currentPassword, newPassword) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find(c => c.id === customerId);

        if (!customer) {
            return { success: false, message: 'Customer not found' };
        }

        if (customer.password !== currentPassword) {
            return { success: false, message: 'Current password is incorrect' };
        }

        if (newPassword.length < 6) {
            return { success: false, message: 'New password must be at least 6 characters' };
        }

        customer.password = newPassword;
        localStorage.setItem('customers', JSON.stringify(customers));

        return { success: true, message: 'Password changed successfully' };
    }
}

// Initialize authentication system
const authSystem = new AuthenticationSystem();
