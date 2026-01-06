// Comprehensive Loading Utility for SONIC POS System
// Provides various loading states and indicators throughout the application

class LoadingManagerClass {
    constructor() {
        this.activeLoaders = new Set();
        this.loadingOverlay = null;
    }

    // Create full-page loading overlay
    createOverlay(message = 'Loading...', showProgress = false) {
        // Remove existing overlay if any
        this.removeOverlay();

        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 60px;
            height: 60px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top: 5px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        `;

        const text = document.createElement('div');
        text.textContent = message;
        text.style.cssText = `
            color: white;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: ${showProgress ? '15px' : '0'};
            text-align: center;
        `;

        overlay.appendChild(spinner);
        overlay.appendChild(text);

        if (showProgress) {
            const progressBar = document.createElement('div');
            progressBar.id = 'loading-progress-bar';
            progressBar.style.cssText = `
                width: 300px;
                height: 6px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                overflow: hidden;
                margin-top: 10px;
            `;

            const progressFill = document.createElement('div');
            progressFill.id = 'loading-progress-fill';
            progressFill.style.cssText = `
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                transition: width 0.3s ease;
                border-radius: 3px;
            `;

            progressBar.appendChild(progressFill);
            overlay.appendChild(progressBar);
        }

        // Add spin animation if not exists
        if (!document.getElementById('loading-spin-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spin-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        this.loadingOverlay = overlay;
        this.activeLoaders.add('overlay');

        return overlay;
    }

    // Show full-page loading
    showOverlay(message = 'Loading...', showProgress = false) {
        return this.createOverlay(message, showProgress);
    }

    // Update overlay message
    updateOverlayMessage(message) {
        if (this.loadingOverlay) {
            const textElement = this.loadingOverlay.querySelector('div:not(#loading-progress-bar)');
            if (textElement && textElement.id !== 'loading-progress-fill') {
                textElement.textContent = message;
            }
        }
    }

    // Update progress bar
    updateProgress(percentage) {
        if (this.loadingOverlay) {
            const progressFill = document.getElementById('loading-progress-fill');
            if (progressFill) {
                progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
            }
        }
    }

    // Remove overlay
    removeOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
            this.activeLoaders.delete('overlay');
        }
    }

    // Show button loading state
    showButtonLoading(button, text = 'Loading...') {
        if (!button) return null;

        const originalText = button.innerHTML;
        const originalDisabled = button.disabled;

        button.disabled = true;
        button.dataset.originalContent = originalText;
        button.dataset.originalDisabled = originalDisabled;

        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        spinner.style.marginRight = '8px';

        button.innerHTML = '';
        button.appendChild(spinner);
        button.appendChild(document.createTextNode(text));

        const loaderId = `button-${Date.now()}-${Math.random()}`;
        this.activeLoaders.add(loaderId);
        button.dataset.loaderId = loaderId;

        return loaderId;
    }

    // Hide button loading state
    hideButtonLoading(button) {
        if (!button) return;

        const loaderId = button.dataset.loaderId;
        if (loaderId) {
            this.activeLoaders.delete(loaderId);
            delete button.dataset.loaderId;
        }

        const originalText = button.dataset.originalContent;
        const originalDisabled = button.dataset.originalDisabled === 'true';

        if (originalText) {
            button.innerHTML = originalText;
            button.disabled = originalDisabled;
            delete button.dataset.originalContent;
            delete button.dataset.originalDisabled;
        } else {
            button.disabled = false;
        }
    }

    // Show inline loading spinner
    showInlineLoader(element, position = 'after') {
        if (!element) return null;

        const loader = document.createElement('div');
        loader.className = 'inline-loader';
        loader.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #667eea;
            font-size: 14px;
            margin-left: 10px;
        `;

        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        loader.appendChild(spinner);

        const loaderId = `inline-${Date.now()}-${Math.random()}`;
        loader.dataset.loaderId = loaderId;
        this.activeLoaders.add(loaderId);

        if (position === 'before') {
            element.parentNode.insertBefore(loader, element);
        } else {
            element.parentNode.insertBefore(loader, element.nextSibling);
        }

        return loaderId;
    }

    // Hide inline loader
    hideInlineLoader(loaderId) {
        const loader = document.querySelector(`[data-loader-id="${loaderId}"]`);
        if (loader) {
            loader.remove();
            this.activeLoaders.delete(loaderId);
        }
    }

    // Show loading in container
    showContainerLoading(container, message = 'Loading...') {
        if (!container) return null;

        const loader = document.createElement('div');
        loader.className = 'container-loader';
        loader.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            min-height: 200px;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 4px solid rgba(102, 126, 234, 0.2);
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        `;

        const text = document.createElement('div');
        text.textContent = message;
        text.style.cssText = `
            color: #6b7280;
            font-size: 14px;
        `;

        loader.appendChild(spinner);
        loader.appendChild(text);

        // Store original content
        container.dataset.originalContent = container.innerHTML;
        container.innerHTML = '';
        container.appendChild(loader);

        const loaderId = `container-${Date.now()}-${Math.random()}`;
        container.dataset.loaderId = loaderId;
        this.activeLoaders.add(loaderId);

        return loaderId;
    }

    // Hide container loading
    hideContainerLoading(container) {
        if (!container) return;

        const loaderId = container.dataset.loaderId;
        if (loaderId) {
            this.activeLoaders.delete(loaderId);
            delete container.dataset.loaderId;
        }

        const originalContent = container.dataset.originalContent;
        if (originalContent) {
            container.innerHTML = originalContent;
            delete container.dataset.originalContent;
        }
    }

    // Show table row loading
    showRowLoading(row, message = 'Loading...') {
        if (!row) return null;

        row.style.opacity = '0.6';
        row.style.pointerEvents = 'none';

        const loader = document.createElement('td');
        loader.colSpan = row.cells.length || 10;
        loader.style.cssText = `
            text-align: center;
            padding: 20px;
            color: #667eea;
        `;

        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        spinner.style.marginRight = '8px';

        loader.appendChild(spinner);
        loader.appendChild(document.createTextNode(message));

        // Clear row content
        row.innerHTML = '';
        row.appendChild(loader);

        const loaderId = `row-${Date.now()}-${Math.random()}`;
        row.dataset.loaderId = loaderId;
        this.activeLoaders.add(loaderId);

        return loaderId;
    }

    // Hide row loading
    hideRowLoading(row) {
        if (!row) return;

        const loaderId = row.dataset.loaderId;
        if (loaderId) {
            this.activeLoaders.delete(loaderId);
            delete row.dataset.loaderId;
        }

        row.style.opacity = '';
        row.style.pointerEvents = '';
    }

    // Execute async function with loading
    async executeWithLoading(asyncFunction, options = {}) {
        const {
            message = 'Loading...',
            showProgress = false,
            button = null,
            container = null,
            onProgress = null
        } = options;

        let loaderId = null;

        try {
            // Show appropriate loading indicator
            if (button) {
                loaderId = this.showButtonLoading(button, message);
            } else if (container) {
                loaderId = this.showContainerLoading(container, message);
            } else {
                this.showOverlay(message, showProgress);
            }

            // Execute async function
            const result = await asyncFunction((progress) => {
                if (showProgress && onProgress) {
                    onProgress(progress);
                    this.updateProgress(progress);
                }
            });

            return result;
        } catch (error) {
            console.error('Error in async operation:', error);
            throw error;
        } finally {
            // Hide loading indicator
            if (button && loaderId) {
                this.hideButtonLoading(button);
            } else if (container && loaderId) {
                this.hideContainerLoading(container);
            } else {
                this.removeOverlay();
            }
        }
    }

    // Show toast loading (small notification)
    showToastLoading(message = 'Processing...', duration = 3000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1f2937;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        toast.appendChild(spinner);
        toast.appendChild(document.createTextNode(message));

        // Add animation if not exists
        if (!document.getElementById('loading-toast-style')) {
            const style = document.createElement('style');
            style.id = 'loading-toast-style';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        const loaderId = `toast-${Date.now()}-${Math.random()}`;
        toast.dataset.loaderId = loaderId;
        this.activeLoaders.add(loaderId);

        if (duration > 0) {
            setTimeout(() => {
                this.hideToastLoading(loaderId);
            }, duration);
        }

        return loaderId;
    }

    // Hide toast loading
    hideToastLoading(loaderId) {
        const toast = document.querySelector(`[data-loader-id="${loaderId}"]`);
        if (toast) {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                toast.remove();
                this.activeLoaders.delete(loaderId);
            }, 300);
        }
    }

    // Clear all loaders
    clearAll() {
        // Remove overlay
        this.removeOverlay();

        // Remove all button loaders
        document.querySelectorAll('[data-loader-id]').forEach(element => {
            const loaderId = element.dataset.loaderId;
            if (loaderId && loaderId.startsWith('button-')) {
                this.hideButtonLoading(element);
            } else if (loaderId && loaderId.startsWith('container-')) {
                this.hideContainerLoading(element);
            } else if (loaderId && loaderId.startsWith('row-')) {
                this.hideRowLoading(element);
            } else if (loaderId && loaderId.startsWith('toast-')) {
                this.hideToastLoading(loaderId);
            } else if (loaderId && loaderId.startsWith('inline-')) {
                this.hideInlineLoader(loaderId);
            }
        });

        this.activeLoaders.clear();
    }

    // Get active loaders count
    getActiveLoadersCount() {
        return this.activeLoaders.size;
    }
}

// Create global instance
let LoadingManager;
try {
    LoadingManager = new LoadingManagerClass();
} catch (error) {
    console.error('Error creating LoadingManager:', error);
    // Create a fallback object to prevent errors
    LoadingManager = {
        showOverlay: () => {},
        removeOverlay: () => {},
        showButtonLoading: () => null,
        hideButtonLoading: () => {},
        updateProgress: () => {},
        clearAll: () => {}
    };
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    try {
        window.LoadingManager = LoadingManager;
        
        // Create convenient global functions (only if they don't exist to avoid conflicts)
        if (!window.showLoading) {
            window.showLoading = (message, showProgress) => {
                try {
                    return LoadingManager.showOverlay(message, showProgress);
                } catch (error) {
                    console.warn('Error showing loading:', error);
                }
            };
        }
        if (!window.hideLoading) {
            window.hideLoading = () => {
                try {
                    LoadingManager.removeOverlay();
                } catch (error) {
                    console.warn('Error hiding loading:', error);
                }
            };
        }
        if (!window.updateLoadingProgress) {
            window.updateLoadingProgress = (percentage) => {
                try {
                    LoadingManager.updateProgress(percentage);
                } catch (error) {
                    console.warn('Error updating progress:', error);
                }
            };
        }
        if (!window.showButtonLoading) {
            window.showButtonLoading = (button, text) => {
                try {
                    return LoadingManager.showButtonLoading(button, text);
                } catch (error) {
                    console.warn('Error showing button loading:', error);
                    return null;
                }
            };
        }
        if (!window.hideButtonLoading) {
            window.hideButtonLoading = (button) => {
                try {
                    LoadingManager.hideButtonLoading(button);
                } catch (error) {
                    console.warn('Error hiding button loading:', error);
                }
            };
        }
    } catch (error) {
        console.error('Error initializing LoadingManager:', error);
        // Ensure page can still load even if loading.js fails
        if (typeof window !== 'undefined' && !window.LoadingManager) {
            window.LoadingManager = {
                showOverlay: () => {},
                removeOverlay: () => {},
                showButtonLoading: () => null,
                hideButtonLoading: () => {},
                updateProgress: () => {},
                clearAll: () => {}
            };
        }
    }
}

