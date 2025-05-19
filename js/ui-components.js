/**
 * MedwithPurpose UI Components Module
 * 
 * This module provides reusable UI component functionality including:
 * - Tab navigation
 * - Accessibility helpers
 * - Form handling
 * - Dynamic content loading
 * - Notifications
 * - Loading indicators
 */

const MWPUI = (function() {
    // Private variables
    let _accessibilityAnnouncer = null;
    let _notificationContainer = null;
    let _loadingOverlay = null;
    let _activeNotifications = [];
    let _notificationCounter = 0;
    
    // Private methods
    function _createAccessibilityAnnouncer() {
        if (!_accessibilityAnnouncer) {
            _accessibilityAnnouncer = document.createElement('div');
            _accessibilityAnnouncer.setAttribute('aria-live', 'assertive');
            _accessibilityAnnouncer.setAttribute('role', 'status');
            _accessibilityAnnouncer.setAttribute('aria-atomic', 'true');
            _accessibilityAnnouncer.className = 'sr-only';
            document.body.appendChild(_accessibilityAnnouncer);
        }
        return _accessibilityAnnouncer;
    }
    
    function _createNotificationContainer() {
        if (!_notificationContainer) {
            _notificationContainer = document.createElement('div');
            _notificationContainer.className = 'notification-container';
            _notificationContainer.setAttribute('aria-live', 'polite');
            _notificationContainer.setAttribute('role', 'region');
            _notificationContainer.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(_notificationContainer);
        }
        return _notificationContainer;
    }
    
    function _createLoadingOverlay() {
        if (!_loadingOverlay) {
            _loadingOverlay = document.createElement('div');
            _loadingOverlay.className = 'loading-overlay hidden';
            _loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">Loading...</div>
            `;
            document.body.appendChild(_loadingOverlay);
        }
        return _loadingOverlay;
    }
    
    // Public API
    return {
        /**
         * Initialize UI components
         */
        initialize: function() {
            // Create accessibility announcer
            _createAccessibilityAnnouncer();
            
            // Create notification container
            _createNotificationContainer();
            
            // Create loading overlay
            _createLoadingOverlay();
            
            // Add keyboard handler for tabs
            this.initTabNavigation();
            
            // Add notification styles if not already present
            this.addNotificationStyles();
        },
        
        /**
         * Add notification CSS styles to the document
         */
        addNotificationStyles: function() {
            // Check if styles are already added
            if (document.getElementById('mwp-ui-styles')) {
                return;
            }
            
            // Create style element
            const style = document.createElement('style');
            style.id = 'mwp-ui-styles';
            style.textContent = `
                /* Notification Styles */
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 350px;
                }
                
                .notification {
                    padding: 16px;
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-md);
                    display: flex;
                    align-items: flex-start;
                    animation: slideIn 0.3s ease-out forwards;
                    position: relative;
                    overflow: hidden;
                }
                
                .notification.closing {
                    animation: slideOut 0.3s ease-in forwards;
                }
                
                .notification-success {
                    background-color: #ecfdf5;
                    border-left: 4px solid var(--color-success);
                }
                
                .notification-error {
                    background-color: #fef2f2;
                    border-left: 4px solid var(--color-danger);
                }
                
                .notification-warning {
                    background-color: #fffbeb;
                    border-left: 4px solid var(--color-warning);
                }
                
                .notification-info {
                    background-color: #eff6ff;
                    border-left: 4px solid var(--color-primary);
                }
                
                .notification-icon {
                    margin-right: 12px;
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                }
                
                .notification-content {
                    flex: 1;
                }
                
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .notification-message {
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--color-text-tertiary);
                    padding: 0;
                    margin-left: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                }
                
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background-color: rgba(0, 0, 0, 0.1);
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                
                /* Loading Overlay Styles */
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.85);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(59, 130, 246, 0.2);
                    border-radius: 50%;
                    border-top-color: var(--color-primary);
                    animation: spin 1s ease-in-out infinite;
                }
                
                .loading-message {
                    color: var(--color-text-secondary);
                    margin-top: 16px;
                    font-weight: 500;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Form validation styles */
                .is-valid {
                    border-color: var(--color-success) !important;
                }
                
                .is-invalid {
                    border-color: var(--color-danger) !important;
                }
                
                .form-error-message {
                    color: var(--color-danger);
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: block;
                }
            `;
            
            document.head.appendChild(style);
        },
        
        /**
         * Announce a message to screen readers
         * @param {string} message - The message to announce
         */
        announceToScreenReader: function(message) {
            const announcer = _createAccessibilityAnnouncer();
            announcer.textContent = message;
            
            // Remove the announcement after a delay
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        },
        
        /**
         * Initialize tab navigation with keyboard support
         * @param {string} tabSelector - CSS selector for tabs
         * @param {string} contentSelector - CSS selector for tab content
         * @param {Function} callback - Optional callback after tab change
         */
        initTabNavigation: function(tabSelector = '.nav-tab', contentSelector = '[role="tabpanel"]', callback) {
            const tabs = document.querySelectorAll(tabSelector + ':not(.disabled)');
            
            tabs.forEach(tab => {
                // Click handler
                tab.addEventListener('click', () => {
                    this.activateTab(tab, tabSelector, contentSelector, callback);
                });
                
                // Keyboard handler
                tab.addEventListener('keydown', (e) => {
                    // Enter or Space
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.activateTab(tab, tabSelector, contentSelector, callback);
                    }
                    
                    // Arrow keys
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        
                        const allTabs = Array.from(document.querySelectorAll(tabSelector));
                        const currentIndex = allTabs.indexOf(tab);
                        let newIndex;
                        
                        if (e.key === 'ArrowRight') {
                            newIndex = (currentIndex + 1) % allTabs.length;
                        } else {
                            newIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
                        }
                        
                        // Skip disabled tabs
                        while (allTabs[newIndex].classList.contains('disabled') && newIndex !== currentIndex) {
                            if (e.key === 'ArrowRight') {
                                newIndex = (newIndex + 1) % allTabs.length;
                            } else {
                                newIndex = (newIndex - 1 + allTabs.length) % allTabs.length;
                            }
                        }
                        
                        // Focus the new tab
                        allTabs[newIndex].focus();
                    }
                });
            });
        },
        
        /**
         * Activate a tab and show its content
         * @param {Element} tab - The tab element to activate
         * @param {string} tabSelector - CSS selector for tabs
         * @param {string} contentSelector - CSS selector for tab content
         * @param {Function} callback - Optional callback after tab change
         */
        activateTab: function(tab, tabSelector = '.nav-tab', contentSelector = '[role="tabpanel"]', callback) {
            if (tab.classList.contains('disabled')) {
                return;
            }
            
            // Get all tabs and content panels
            const tabs = document.querySelectorAll(tabSelector);
            const panels = document.querySelectorAll(contentSelector);
            
            // Deactivate all tabs
            tabs.forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('active');
                t.tabIndex = -1;
            });
            
            // Activate the selected tab
            tab.setAttribute('aria-selected', 'true');
            tab.classList.add('active');
            tab.tabIndex = 0;
            
            // Hide all content panels
            panels.forEach(panel => {
                panel.classList.add('hidden');
                panel.setAttribute('aria-hidden', 'true');
            });
            
            // Show the selected content panel
            const panelId = tab.getAttribute('aria-controls');
            if (panelId) {
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.classList.remove('hidden');
                    panel.setAttribute('aria-hidden', 'false');
                }
            }
            
            // Announce the tab change to screen readers
            const tabName = tab.textContent.trim();
            this.announceToScreenReader(`${tabName} tab selected`);
            
            // Execute callback if provided
            if (typeof callback === 'function') {
                callback(tab);
            }
        },
        
        /**
         * Show a modal dialog
         * @param {string} title - The modal title
         * @param {string} content - The modal content (HTML allowed)
         * @param {Object} options - Modal options
         */
        showModal: function(title, content, options = {}) {
            const modalId = options.id || 'mwp-modal-' + Date.now();
            const primaryBtn = options.primaryButton || { text: 'OK', action: null };
            const secondaryBtn = options.secondaryButton || null;
            
            // Create modal elements
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 flex items-center justify-center z-50';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', `${modalId}-title`);
            
            // Modal HTML
            modal.innerHTML = `
                <div class="modal-overlay fixed inset-0 bg-black bg-opacity-40"></div>
                <div class="modal-container bg-white w-11/12 md:max-w-md mx-auto rounded-lg shadow-lg z-50 overflow-y-auto">
                    <div class="modal-content p-6">
                        <div class="flex justify-between items-center pb-3">
                            <h3 id="${modalId}-title" class="text-xl font-bold">${title}</h3>
                            <button class="modal-close focus:outline-none" aria-label="Close modal">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="my-4">${content}</div>
                        <div class="flex justify-end pt-2">
                            ${secondaryBtn ? 
                                `<button class="btn btn-secondary modal-secondary-btn mr-2">${secondaryBtn.text}</button>` : 
                                ''}
                            <button class="btn btn-primary modal-primary-btn">${primaryBtn.text}</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to the document
            document.body.appendChild(modal);
            
            // Trap focus inside modal
            const firstFocusable = modal.querySelector('.modal-close');
            const lastFocusable = modal.querySelector('.modal-primary-btn');
            const prevFocused = document.activeElement;
            
            // Focus first element
            setTimeout(() => {
                firstFocusable.focus();
            }, 100);
            
            // Set up close functionality
            const closeModal = () => {
                modal.remove();
                if (prevFocused) {
                    prevFocused.focus();
                }
            };
            
            // Attach event listeners
            const overlay = modal.querySelector('.modal-overlay');
            const closeBtn = modal.querySelector('.modal-close');
            const primaryButton = modal.querySelector('.modal-primary-btn');
            const secondaryButton = modal.querySelector('.modal-secondary-btn');
            
            // Close button
            closeBtn.addEventListener('click', closeModal);
            
            // Overlay click
            overlay.addEventListener('click', () => {
                if (options.closeOnOverlayClick !== false) {
                    closeModal();
                }
            });
            
            // Primary button
            primaryButton.addEventListener('click', () => {
                if (primaryBtn.action) {
                    primaryBtn.action();
                }
                closeModal();
            });
            
            // Secondary button
            if (secondaryButton) {
                secondaryButton.addEventListener('click', () => {
                    if (secondaryBtn.action) {
                        secondaryBtn.action();
                    }
                    closeModal();
                });
            }
            
            // ESC key
            document.addEventListener('keydown', function escListener(e) {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escListener);
                }
                
                // Tab trap
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            });
            
            // Return close function
            return closeModal;
        },

        /**
         * Show a notification
         * @param {Object} options - Notification options
         * @returns {Object} Notification control object
         */
        showNotification: function(options = {}) {
            // Ensure container exists
            const container = _createNotificationContainer();
            
            // Default options
            const defaults = {
                type: 'info',  // info, success, error, warning
                title: '',
                message: '',
                duration: 5000, // ms
                dismissible: true,
                onClose: null
            };
            
            // Merge options
            const settings = { ...defaults, ...options };
            
            // Generate unique ID
            const notificationId = 'notification-' + (++_notificationCounter);
            
            // Create notification element
            const notification = document.createElement('div');
            notification.id = notificationId;
            notification.className = `notification notification-${settings.type}`;
            notification.setAttribute('role', 'alert');
            
            // Icon based on type
            let iconSvg = '';
            switch (settings.type) {
                case 'success':
                    iconSvg = `<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#10b981"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
                    break;
                case 'error':
                    iconSvg = `<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#ef4444"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
                    break;
                case 'warning':
                    iconSvg = `<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#f59e0b"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
                    break;
                default: // info
                    iconSvg = `<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#3b82f6"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;
            }
            
            // Progress bar for auto-dismiss
            const progressBar = document.createElement('div');
            progressBar.className = 'notification-progress';
            progressBar.style.width = '100%';
            
            if (settings.duration) {
                progressBar.style.transition = `width ${settings.duration}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 10);
            }
            
            // Build notification content
            notification.innerHTML = `
                ${iconSvg}
                <div class="notification-content">
                    ${settings.title ? `<div class="notification-title">${settings.title}</div>` : ''}
                    <div class="notification-message">${settings.message}</div>
                </div>
                ${settings.dismissible ? `
                    <button class="notification-close" aria-label="Close notification">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                ` : ''}
            `;
            
            // Add progress bar
            if (settings.duration) {
                notification.appendChild(progressBar);
            }
            
            // Add to container
            container.appendChild(notification);
            
            // Announce to screen readers
            this.announceToScreenReader(`${settings.type} notification: ${settings.message}`);
            
            // Function to remove notification
            const removeNotification = () => {
                // Mark as closing
                notification.classList.add('closing');
                
                // Remove after animation
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                    
                    // Remove from active notifications
                    const index = _activeNotifications.findIndex(n => n.id === notificationId);
                    if (index !== -1) {
                        _activeNotifications.splice(index, 1);
                    }
                    
                    // Call onClose callback
                    if (typeof settings.onClose === 'function') {
                        settings.onClose();
                    }
                }, 300);
            };
            
            // Close button event
            if (settings.dismissible) {
                const closeButton = notification.querySelector('.notification-close');
                closeButton.addEventListener('click', removeNotification);
            }
            
            // Auto dismiss
            let autoCloseTimeout;
            if (settings.duration) {
                autoCloseTimeout = setTimeout(removeNotification, settings.duration);
                
                // Pause auto-dismiss on hover
                notification.addEventListener('mouseenter', () => {
                    clearTimeout(autoCloseTimeout);
                    // Also pause the progress bar
                    progressBar.style.transitionProperty = 'none';
                });
                
                // Resume auto-dismiss on mouse leave
                notification.addEventListener('mouseleave', () => {
                    const timeLeft = parseFloat(progressBar.offsetWidth) / parseFloat(notification.offsetWidth) * settings.duration;
                    autoCloseTimeout = setTimeout(removeNotification, timeLeft);
                    // Resume progress bar
                    progressBar.style.transitionProperty = 'width';
                    progressBar.style.width = '0%';
                });
            }
            
            // Store in active notifications
            const notificationObj = {
                id: notificationId,
                element: notification,
                close: removeNotification
            };
            
            _activeNotifications.push(notificationObj);
            
            return notificationObj;
        },
        
        /**
         * Clear all notifications
         */
        clearAllNotifications: function() {
            // Copy array because we'll be modifying it when closing
            const notifications = [..._activeNotifications];
            notifications.forEach(notification => {
                notification.close();
            });
        },
        
        /**
         * Show loading overlay
         * @param {string} message - Optional loading message
         * @returns {Function} Function to hide the overlay
         */
        showLoading: function(message = 'Loading...') {
            const overlay = _createLoadingOverlay();
            const messageEl = overlay.querySelector('.loading-message');
            
            // Update message
            messageEl.textContent = message;
            
            // Show overlay
            overlay.classList.remove('hidden');
            
            // Announce to screen readers
            this.announceToScreenReader(message);
            
            // Return function to hide overlay
            return () => {
                overlay.classList.add('hidden');
                this.announceToScreenReader('Loading complete');
            };
        },
        
        /**
         * Validate a form
         * @param {string|Element} formSelector - Form element or selector
         * @param {Object} rules - Validation rules
         * @returns {boolean} Whether form is valid
         */
        validateForm: function(formSelector, rules) {
            const form = typeof formSelector === 'string' ? 
                document.querySelector(formSelector) : formSelector;
            
            if (!form) {
                console.error('Form not found');
                return false;
            }
            
            let isValid = true;
            const errors = {};
            
            // Clear previous errors
            form.querySelectorAll('.validation-error').forEach(el => {
                el.remove();
            });
            
            // Check each rule
            for (const fieldName in rules) {
                const field = form.elements[fieldName];
                const fieldRules = rules[fieldName];
                
                if (!field) {
                    console.warn(`Field ${fieldName} not found in form`);
                    continue;
                }
                
                const value = field.value.trim();
                
                // Required check
                if (fieldRules.required && value === '') {
                    isValid = false;
                    errors[fieldName] = fieldRules.requiredMessage || 'This field is required';
                }
                
                // Email check
                if (fieldRules.email && value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    isValid = false;
                    errors[fieldName] = fieldRules.emailMessage || 'Please enter a valid email address';
                }
                
                // Minimum length check
                if (fieldRules.minLength && value.length < fieldRules.minLength) {
                    isValid = false;
                    errors[fieldName] = fieldRules.minLengthMessage || 
                        `Please enter at least ${fieldRules.minLength} characters`;
                }
                
                // Custom validation
                if (typeof fieldRules.validate === 'function') {
                    const customValid = fieldRules.validate(value, form);
                    if (!customValid) {
                        isValid = false;
                        errors[fieldName] = fieldRules.validateMessage || 'Invalid input';
                    }
                }
                
                // Show error if any
                if (errors[fieldName]) {
                    const errorEl = document.createElement('div');
                    errorEl.className = 'validation-error text-red-500 text-sm mt-1';
                    errorEl.textContent = errors[fieldName];
                    
                    // Insert after field
                    field.parentNode.insertBefore(errorEl, field.nextSibling);
                    
                    // Highlight the field
                    field.classList.add('border-red-500');
                    
                    // Announce to screen readers
                    if (Object.keys(errors).length === 1) {
                        this.announceToScreenReader(`Form error: ${errors[fieldName]}`);
                    }
                }
            }
            
            if (!isValid && Object.keys(errors).length > 1) {
                this.announceToScreenReader('There are form errors. Please check the form and try again.');
            }
            
            return isValid;
        },
        
        /**
         * Load content dynamically from server
         * @param {string} url - URL to fetch content from
         * @param {string|Element} targetSelector - Element or selector to load content into
         * @param {Object} options - Additional options
         * @returns {Promise} Promise that resolves when content is loaded
         */
        loadContent: function(url, targetSelector, options = {}) {
            const targetElement = typeof targetSelector === 'string' ? 
                document.querySelector(targetSelector) : targetSelector;
            
            if (!targetElement) {
                return Promise.reject(new Error('Target element not found'));
            }
            
            // Show loading state
            if (options.showLoading !== false) {
                targetElement.innerHTML = '<div class="text-center py-6"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p class="mt-2 text-gray-600">Loading...</p></div>';
            }
            
            // Announce loading to screen readers
            this.announceToScreenReader('Loading content, please wait');
            
            // Fetch the content
            return fetch(url, options.fetchOptions || {})
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    // Insert the HTML
                    if (options.append) {
                        targetElement.insertAdjacentHTML('beforeend', html);
                    } else {
                        targetElement.innerHTML = html;
                    }
                    
                    // Execute JS if needed
                    if (options.executeScripts !== false) {
                        const scripts = targetElement.querySelectorAll('script');
                        scripts.forEach(oldScript => {
                            const newScript = document.createElement('script');
                            Array.from(oldScript.attributes).forEach(attr => {
                                newScript.setAttribute(attr.name, attr.value);
                            });
                            newScript.textContent = oldScript.textContent;
                            oldScript.parentNode.replaceChild(newScript, oldScript);
                        });
                    }
                    
                    // Announce completion to screen readers
                    this.announceToScreenReader('Content loaded');
                    
                    // Execute callback if provided
                    if (typeof options.callback === 'function') {
                        options.callback(html, targetElement);
                    }
                    
                    return html;
                })
                .catch(error => {
                    // Show error
                    targetElement.innerHTML = `<div class="text-center py-6 text-red-600"><p>Error loading content: ${error.message}</p></div>`;
                    
                    // Announce error to screen readers
                    this.announceToScreenReader(`Error loading content: ${error.message}`);
                    
                    throw error;
                });
        }
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWPUI;
} 