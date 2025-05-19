/**
 * MedwithPurpose Form Validation Module
 * 
 * This module provides reusable form validation functionality including:
 * - Input validation
 * - Error messages
 * - Form submission handling
 * - Dynamic form field handling
 */

const MWPForm = (function() {
    // Private variables
    const _validators = {
        required: (value) => value !== undefined && value !== null && value.toString().trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (value, min) => value.length >= min,
        maxLength: (value, max) => value.length <= max,
        numeric: (value) => /^\d+$/.test(value),
        alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),
        match: (value, field) => value === field
    };
    
    // Private methods
    function _createErrorElement(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'form-error-message';
        errorEl.setAttribute('aria-live', 'polite');
        errorEl.textContent = message;
        return errorEl;
    }
    
    function _clearValidationState(input) {
        // Remove any existing error message
        const currentError = input.parentNode.querySelector('.form-error-message');
        if (currentError) {
            currentError.remove();
        }
        
        // Remove validation classes
        input.classList.remove('is-valid', 'is-invalid');
        
        // Remove aria attributes
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
    }
    
    function _showValidationError(input, message) {
        _clearValidationState(input);
        
        // Add error class to input
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        
        // Create error message
        const errorId = `error-${input.id || Math.random().toString(36).substr(2, 9)}`;
        const errorEl = _createErrorElement(message);
        errorEl.id = errorId;
        
        // Associate error with input
        input.setAttribute('aria-describedby', errorId);
        
        // Add error message after input
        input.parentNode.appendChild(errorEl);
        
        // Announce to screen readers if UI module available
        if (typeof MWPUI !== 'undefined') {
            MWPUI.announceToScreenReader(message);
        }
    }
    
    function _showValidationSuccess(input) {
        _clearValidationState(input);
        input.classList.add('is-valid');
    }
    
    // Public API
    return {
        /**
         * Validate a single form field
         * @param {HTMLElement} input - The input element to validate
         * @param {Object} rules - Validation rules to apply
         * @returns {boolean} Whether validation passed
         */
        validateField: function(input, rules = {}) {
            const value = input.value;
            let isValid = true;
            let errorMessage = '';
            
            // Apply each validation rule
            for (const [rule, ruleValue] of Object.entries(rules)) {
                const validator = _validators[rule];
                
                if (validator) {
                    // Skip empty values for non-required fields
                    if (rule !== 'required' && !_validators.required(value)) {
                        continue;
                    }
                    
                    // Apply the validation rule
                    const valid = validator(value, ruleValue);
                    
                    if (!valid) {
                        isValid = false;
                        
                        // Get the error message
                        switch (rule) {
                            case 'required':
                                errorMessage = 'This field is required';
                                break;
                            case 'email':
                                errorMessage = 'Please enter a valid email address';
                                break;
                            case 'minLength':
                                errorMessage = `Please enter at least ${ruleValue} characters`;
                                break;
                            case 'maxLength':
                                errorMessage = `Please enter no more than ${ruleValue} characters`;
                                break;
                            case 'numeric':
                                errorMessage = 'Please enter numbers only';
                                break;
                            case 'alphanumeric':
                                errorMessage = 'Please enter letters and numbers only';
                                break;
                            case 'match':
                                errorMessage = 'Fields do not match';
                                break;
                            default:
                                errorMessage = 'Invalid value';
                        }
                        
                        // Custom error message if provided
                        if (typeof ruleValue === 'object' && ruleValue.message) {
                            errorMessage = ruleValue.message;
                        }
                        
                        break; // Stop at first error
                    }
                }
            }
            
            // Show validation state
            if (isValid) {
                _showValidationSuccess(input);
            } else {
                _showValidationError(input, errorMessage);
            }
            
            return isValid;
        },
        
        /**
         * Validate an entire form
         * @param {HTMLFormElement} form - The form to validate
         * @param {Object} schema - Validation schema for form fields
         * @returns {boolean} Whether all validations passed
         */
        validateForm: function(form, schema = {}) {
            let isValid = true;
            
            // Validate each field in the schema
            for (const [fieldName, rules] of Object.entries(schema)) {
                const input = form.elements[fieldName];
                
                if (input) {
                    const fieldValid = this.validateField(input, rules);
                    isValid = isValid && fieldValid;
                }
            }
            
            return isValid;
        },
        
        /**
         * Initialize form validation
         * @param {HTMLFormElement} form - The form to initialize
         * @param {Object} schema - Validation schema
         * @param {Object} options - Additional options
         */
        initFormValidation: function(form, schema = {}, options = {}) {
            if (!form) return;
            
            const validateOnInput = options.validateOnInput !== false;
            const validateOnSubmit = options.validateOnSubmit !== false;
            
            // Add input event listeners for real-time validation
            if (validateOnInput) {
                for (const [fieldName, rules] of Object.entries(schema)) {
                    const input = form.elements[fieldName];
                    
                    if (input) {
                        input.addEventListener('blur', () => {
                            this.validateField(input, rules);
                        });
                        
                        input.addEventListener('input', () => {
                            // Clear validation state when user types
                            _clearValidationState(input);
                        });
                    }
                }
            }
            
            // Add submit handler
            if (validateOnSubmit) {
                form.addEventListener('submit', (e) => {
                    const formValid = this.validateForm(form, schema);
                    
                    if (!formValid) {
                        e.preventDefault();
                        
                        // Focus first invalid field
                        const firstInvalid = form.querySelector('.is-invalid');
                        if (firstInvalid) {
                            firstInvalid.focus();
                        }
                        
                        // Show form error if UI module available
                        if (typeof MWPUI !== 'undefined') {
                            MWPUI.showNotification({
                                type: 'error',
                                title: 'Form Error',
                                message: 'Please correct the errors in the form',
                                duration: 5000
                            });
                        }
                        
                        // Custom error handler
                        if (options.onError && typeof options.onError === 'function') {
                            options.onError();
                        }
                    } else {
                        // Call success handler if provided
                        if (options.onSuccess && typeof options.onSuccess === 'function') {
                            const formData = new FormData(form);
                            const formDataObj = Object.fromEntries(formData.entries());
                            
                            // Allow the handler to decide whether to prevent default
                            const result = options.onSuccess(formDataObj, e);
                            if (result === false) {
                                e.preventDefault();
                            }
                        }
                    }
                });
            }
        },
        
        /**
         * Get form data as an object
         * @param {HTMLFormElement} form - The form to extract data from
         * @returns {Object} Form data as key-value pairs
         */
        getFormData: function(form) {
            const formData = new FormData(form);
            return Object.fromEntries(formData.entries());
        }
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWPForm;
} 