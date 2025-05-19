/**
 * MedwithPurpose Error Handling Module
 * 
 * This module provides a centralized error handling system with:
 * - Error logging
 * - User-friendly error messages
 * - Error reporting
 * - Consistent error UI
 */

const MWPError = (function() {
    // Private variables
    let _errorListeners = [];
    let _errorTypes = {
        AUTHENTICATION: 'auth',
        DATA: 'data',
        VALIDATION: 'validation',
        NETWORK: 'network',
        GENERAL: 'general'
    };
    
    // Map Firebase error codes to user-friendly messages
    const _errorMessages = {
        // Auth errors
        'auth/invalid-email': 'The email address is not valid.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'The password is incorrect.',
        'auth/email-already-in-use': 'This email is already in use.',
        'auth/weak-password': 'The password is too weak.',
        'auth/operation-not-allowed': 'This operation is not allowed.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        
        // Firestore errors
        'permission-denied': 'You don\'t have permission to perform this action.',
        'not-found': 'The requested document was not found.',
        
        // Network errors
        'network-error': 'A network error has occurred. Please check your connection.',
        'server-error': 'A server error has occurred. Please try again later.',
        
        // Default fallback
        'default': 'An unexpected error occurred. Please try again.'
    };
    
    // Private methods
    function _normalizeError(error) {
        // Create a standardized error object
        const errorObj = {
            type: _errorTypes.GENERAL,
            code: 'unknown',
            message: _errorMessages.default,
            originalError: error,
            timestamp: new Date().toISOString()
        };
        
        // Handle different error types
        if (error.code) {
            // Firebase errors have code properties
            errorObj.code = error.code;
            
            // Determine error type from code
            if (error.code.startsWith('auth/')) {
                errorObj.type = _errorTypes.AUTHENTICATION;
            } else {
                errorObj.type = _errorTypes.DATA;
            }
            
            // Get user-friendly message
            errorObj.message = _errorMessages[error.code] || error.message || _errorMessages.default;
        } else if (error.name === 'NetworkError' || error.message?.includes('network')) {
            errorObj.type = _errorTypes.NETWORK;
            errorObj.code = 'network-error';
            errorObj.message = _errorMessages['network-error'];
        } else if (error.name === 'ValidationError') {
            errorObj.type = _errorTypes.VALIDATION;
            errorObj.code = 'validation-error';
            errorObj.message = error.message || 'Please check your input and try again.';
        }
        
        return errorObj;
    }
    
    function _notifyListeners(errorObj) {
        _errorListeners.forEach(listener => {
            try {
                listener(errorObj);
            } catch (e) {
                console.error('Error in error listener:', e);
            }
        });
    }
    
    // Public API
    return {
        // Error type constants
        ErrorTypes: _errorTypes,
        
        /**
         * Handle an error
         * @param {Error} error - The error object
         * @param {Object} options - Options for error handling
         * @returns {Object} Normalized error object
         */
        handleError: function(error, options = {}) {
            // Normalize the error
            const errorObj = _normalizeError(error);
            
            // Log the error
            if (!options.silent) {
                console.error('[MWP Error]', errorObj.type, errorObj.code, errorObj.message, error);
            }
            
            // Notify all listeners
            _notifyListeners(errorObj);
            
            return errorObj;
        },
        
        /**
         * Register an error listener
         * @param {Function} listener - Function to call when an error occurs
         */
        addErrorListener: function(listener) {
            if (typeof listener === 'function') {
                _errorListeners.push(listener);
            }
        },
        
        /**
         * Remove an error listener
         * @param {Function} listener - The listener to remove
         */
        removeErrorListener: function(listener) {
            const index = _errorListeners.indexOf(listener);
            if (index !== -1) {
                _errorListeners.splice(index, 1);
            }
        },
        
        /**
         * Show an error message to the user
         * @param {string|Error} errorOrMessage - Error object or message string
         * @param {Object} options - Display options
         */
        showErrorMessage: function(errorOrMessage, options = {}) {
            let errorObj;
            
            if (typeof errorOrMessage === 'string') {
                errorObj = {
                    type: _errorTypes.GENERAL,
                    code: 'custom',
                    message: errorOrMessage,
                    timestamp: new Date().toISOString()
                };
            } else {
                errorObj = _normalizeError(errorOrMessage);
            }
            
            // Use the UI module to show the error if available
            if (typeof MWPUI !== 'undefined') {
                MWPUI.showNotification({
                    type: 'error',
                    title: options.title || 'Error',
                    message: errorObj.message,
                    duration: options.duration || 5000
                });
            } else {
                // Fallback to alert for very basic scenarios
                alert(errorObj.message);
            }
            
            return errorObj;
        },
        
        /**
         * Create a validation error
         * @param {string} message - The validation error message
         * @returns {Error} Validation error object
         */
        createValidationError: function(message) {
            const error = new Error(message);
            error.name = 'ValidationError';
            return error;
        }
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWPError;
} 