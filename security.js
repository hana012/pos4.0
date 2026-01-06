// Enhanced Security Module for SONIC POS System
// This module provides security utilities for the application

// Simple password hashing (for client-side - in production, use server-side hashing)
class SecurityUtils {
    // Simple hash function (for demonstration - use proper bcrypt in production)
    static async hashPassword(password) {
        // In production, use: bcrypt.hash(password, 10)
        // For now, using a simple hash (NOT SECURE FOR PRODUCTION)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify password hash
    static async verifyPassword(password, hash) {
        const passwordHash = await this.hashPassword(password);
        return passwordHash === hash;
    }

    // Encrypt sensitive data
    static async encryptData(data, key) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            // Generate a random IV
            const iv = crypto.getRandomValues(new Uint8Array(16));
            
            // Import the key
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(key.padEnd(32, '0').slice(0, 32)),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );
            
            // Encrypt
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                keyMaterial,
                dataBuffer
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);
            
            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // Decrypt sensitive data
    static async decryptData(encryptedData, key) {
        try {
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            
            // Decode from base64
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 16);
            const encrypted = combined.slice(16);
            
            // Import the key
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(key.padEnd(32, '0').slice(0, 32)),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );
            
            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                keyMaterial,
                encrypted
            );
            
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // Enhanced input sanitization
    static sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') return '';
        
        let sanitized = input.trim();
        
        // Remove potentially dangerous characters
        sanitized = sanitized.replace(/[<>\"']/g, '');
        
        // Type-specific validation
        switch (type) {
            case 'email':
                sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
                break;
            case 'number':
                sanitized = sanitized.replace(/[^0-9.-]/g, '');
                break;
            case 'alphanumeric':
                sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'barcode':
                sanitized = sanitized.replace(/[^a-zA-Z0-9-_]/g, '');
                break;
        }
        
        return sanitized;
    }

    // Validate input format
    static validateInput(input, type, required = false) {
        if (required && (!input || input.trim() === '')) {
            return { valid: false, error: 'This field is required' };
        }
        
        if (!input) return { valid: true };
        
        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input)) {
                    return { valid: false, error: 'Invalid email format' };
                }
                break;
            case 'number':
                if (isNaN(input) || input === '') {
                    return { valid: false, error: 'Must be a valid number' };
                }
                break;
            case 'positiveNumber':
                const num = parseFloat(input);
                if (isNaN(num) || num < 0) {
                    return { valid: false, error: 'Must be a positive number' };
                }
                break;
            case 'barcode':
                if (input.length > 100) {
                    return { valid: false, error: 'Barcode too long' };
                }
                break;
        }
        
        return { valid: true };
    }

    // Generate CSRF token
    static generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Store CSRF token
    static storeCSRFToken() {
        const token = this.generateCSRFToken();
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    // Verify CSRF token
    static verifyCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        return storedToken && storedToken === token;
    }

    // Check if running on HTTPS
    static isSecureConnection() {
        return window.location.protocol === 'https:' || 
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    }

    // Warn if not using HTTPS
    static checkHTTPS() {
        if (!this.isSecureConnection() && window.location.hostname !== 'localhost') {
            console.warn('⚠️ SECURITY WARNING: Not using HTTPS. Sensitive data may be at risk.');
            return false;
        }
        return true;
    }

    // Secure storage wrapper
    static secureSetItem(key, value, encrypt = false) {
        try {
            if (encrypt) {
                // For sensitive data, encrypt before storing
                const encryptionKey = this.getEncryptionKey();
                this.encryptData(value, encryptionKey).then(encrypted => {
                    if (encrypted) {
                        localStorage.setItem(key, encrypted);
                    }
                });
            } else {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Storage error:', error);
        }
    }

    // Get encryption key (should be derived from user session)
    static getEncryptionKey() {
        const sessionId = sessionStorage.getItem('sonic_session_id') || 'default';
        return sessionId.substring(0, 32).padEnd(32, '0');
    }

    // Enhanced XSS protection
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Validate and sanitize HTML content
    static sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SecurityUtils = SecurityUtils;
}

