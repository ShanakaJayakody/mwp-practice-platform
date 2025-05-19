/**
 * MedwithPurpose Performance Module
 * 
 * This module provides performance optimization tools including:
 * - Image optimization
 * - Script loading
 * - Network request management
 * - Caching
 * - Performance monitoring
 */

const MWPPerformance = (function() {
    // Private variables
    let _isInitialized = false;
    let _imageObserver = null;
    let _metricsCollectionEnabled = false;
    let _performanceMetrics = {
        pageLoad: 0,
        resourceLoads: [],
        interactions: []
    };

    // Private methods
    function _initLazyLoading() {
        // Create intersection observer for lazy loading
        if ('IntersectionObserver' in window) {
            _imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        if (lazyImage.dataset.src) {
                            lazyImage.src = lazyImage.dataset.src;
                            lazyImage.removeAttribute('data-src');
                        }
                        if (lazyImage.dataset.srcset) {
                            lazyImage.srcset = lazyImage.dataset.srcset;
                            lazyImage.removeAttribute('data-srcset');
                        }
                        observer.unobserve(lazyImage);
                    }
                });
            });
        }
    }

    function _collectPageLoadMetrics() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            
            // Calculate page load time once the page has loaded
            window.addEventListener('load', () => {
                // Wait a bit to ensure all metrics are available
                setTimeout(() => {
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    _performanceMetrics.pageLoad = loadTime;
                    
                    // Log the result if collection is enabled
                    if (_metricsCollectionEnabled) {
                        console.log(`Page load time: ${loadTime}ms`);
                    }
                }, 0);
            });
        }
    }

    function _collectResourceMetrics() {
        if (window.performance && window.performance.getEntriesByType) {
            window.addEventListener('load', () => {
                // Get resource timing entries
                const resources = window.performance.getEntriesByType('resource');
                
                // Process and store resource metrics
                resources.forEach(resource => {
                    _performanceMetrics.resourceLoads.push({
                        name: resource.name,
                        duration: Math.round(resource.duration),
                        type: resource.initiatorType,
                        size: resource.transferSize || 0
                    });
                });
                
                // Log slow resources if collection is enabled
                if (_metricsCollectionEnabled) {
                    const slowResources = _performanceMetrics.resourceLoads
                        .filter(r => r.duration > 500)
                        .sort((a, b) => b.duration - a.duration);
                    
                    if (slowResources.length > 0) {
                        console.log('Slow resources:', slowResources);
                    }
                }
            });
        }
    }

    // Public API
    return {
        /**
         * Initialize performance monitoring and optimizations
         * @param {Object} options - Configuration options
         */
        initialize: function(options = {}) {
            if (_isInitialized) return;
            
            const defaults = {
                lazyLoad: true,
                collectMetrics: false,
                minifyDom: true,
                deferNonEssential: true
            };
            
            const settings = { ...defaults, ...options };
            _metricsCollectionEnabled = settings.collectMetrics;
            
            // Initialize lazy loading
            if (settings.lazyLoad) {
                _initLazyLoading();
            }
            
            // Initialize performance metrics collection
            if (settings.collectMetrics) {
                _collectPageLoadMetrics();
                _collectResourceMetrics();
            }
            
            // Mark scripts as deferred where appropriate
            if (settings.deferNonEssential) {
                this.deferNonEssentialScripts();
            }
            
            // Minify DOM if needed
            if (settings.minifyDom) {
                this.minifyDom();
            }
            
            _isInitialized = true;
        },
        
        /**
         * Enable lazy loading for images
         * @param {string} selector - CSS selector for images to lazy load
         */
        enableLazyLoading: function(selector = 'img[data-src]') {
            if (!_imageObserver) {
                _initLazyLoading();
            }
            
            if (_imageObserver) {
                const lazyImages = document.querySelectorAll(selector);
                lazyImages.forEach(image => {
                    _imageObserver.observe(image);
                });
            }
        },
        
        /**
         * Convert regular images to lazy-loaded images
         * @param {string} selector - CSS selector for images to convert
         */
        convertToLazyImages: function(selector = 'img:not([data-src])') {
            const images = document.querySelectorAll(selector);
            
            images.forEach(img => {
                // Skip already processed or SVG images
                if (img.dataset.src || img.src.endsWith('.svg')) {
                    return;
                }
                
                // Store original src in data attribute
                img.dataset.src = img.src;
                
                // Set a lightweight placeholder
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                
                // Enable lazy loading
                if (_imageObserver) {
                    _imageObserver.observe(img);
                }
            });
        },
        
        /**
         * Defer non-essential scripts to improve page load
         */
        deferNonEssentialScripts: function() {
            // Find scripts without defer or async and add defer attribute
            const scripts = document.querySelectorAll('script:not([defer]):not([async])');
            
            scripts.forEach(script => {
                // Skip inline scripts
                if (!script.src) return;
                
                // Skip critical scripts like the auth module
                const criticalScripts = ['auth.js', 'firebase', 'ui-components.js'];
                const isCritical = criticalScripts.some(name => script.src.includes(name));
                
                if (!isCritical) {
                    script.setAttribute('defer', '');
                }
            });
        },
        
        /**
         * Minify DOM by removing unnecessary whitespace and comments
         */
        minifyDom: function() {
            // Remove comments
            const commentNodeIterator = document.createNodeIterator(
                document.documentElement,
                NodeFilter.SHOW_COMMENT,
                { acceptNode: () => NodeFilter.FILTER_ACCEPT }
            );
            
            let comment;
            while (comment = commentNodeIterator.nextNode()) {
                comment.parentNode.removeChild(comment);
            }
            
            // Normalize whitespace in text nodes
            const textNodeIterator = document.createNodeIterator(
                document.documentElement,
                NodeFilter.SHOW_TEXT,
                { acceptNode: (node) => {
                    // Skip script and style elements
                    if (node.parentNode.nodeName === 'SCRIPT' || 
                        node.parentNode.nodeName === 'STYLE' ||
                        node.parentNode.nodeName === 'PRE' ||
                        node.parentNode.nodeName === 'CODE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }}
            );
            
            let textNode;
            while (textNode = textNodeIterator.nextNode()) {
                const text = textNode.nodeValue;
                // Only process nodes with excess whitespace
                if (/\s{2,}/.test(text)) {
                    textNode.nodeValue = text.replace(/\s+/g, ' ').trim();
                }
            }
        },
        
        /**
         * Get performance metrics
         * @returns {Object} Collected performance metrics
         */
        getPerformanceMetrics: function() {
            return { ..._performanceMetrics };
        },
        
        /**
         * Optimize image for display
         * @param {string} url - Original image URL
         * @param {Object} options - Optimization options
         * @returns {string} Optimized image URL
         */
        optimizeImageUrl: function(url, options = {}) {
            // Check if the URL is from ImageKit
            if (url.includes('imagekit.io')) {
                const defaults = {
                    width: 0,
                    height: 0,
                    quality: 80,
                    format: 'auto'
                };
                
                const settings = { ...defaults, ...options };
                
                // Create transformation parameters
                let params = [];
                
                if (settings.width > 0) {
                    params.push(`w-${settings.width}`);
                }
                
                if (settings.height > 0) {
                    params.push(`h-${settings.height}`);
                }
                
                params.push(`q-${settings.quality}`);
                params.push(`f-${settings.format}`);
                
                // Check if URL already has transformations
                if (url.includes('tr:')) {
                    // Replace existing transformations
                    return url.replace(/tr:[^/]+/, `tr:${params.join(',')}`);
                } else {
                    // Add transformations
                    const urlParts = url.split('/');
                    const lastIndex = urlParts.length - 1;
                    urlParts.splice(lastIndex, 0, `tr:${params.join(',')}`);
                    return urlParts.join('/');
                }
            }
            
            // Return original URL if not from ImageKit
            return url;
        },
        
        /**
         * Cache data in localStorage with expiration
         * @param {string} key - Cache key
         * @param {*} data - Data to cache
         * @param {number} expiration - Expiration time in seconds
         */
        cacheData: function(key, data, expiration = 3600) {
            try {
                const item = {
                    data: data,
                    expires: Date.now() + (expiration * 1000)
                };
                
                localStorage.setItem(`mwp_cache_${key}`, JSON.stringify(item));
                return true;
            } catch (error) {
                console.error('Cache error:', error);
                return false;
            }
        },
        
        /**
         * Get cached data if not expired
         * @param {string} key - Cache key
         * @returns {*} Cached data or null if expired
         */
        getCachedData: function(key) {
            try {
                const item = localStorage.getItem(`mwp_cache_${key}`);
                
                if (!item) return null;
                
                const cachedItem = JSON.parse(item);
                
                // Check if expired
                if (Date.now() > cachedItem.expires) {
                    localStorage.removeItem(`mwp_cache_${key}`);
                    return null;
                }
                
                return cachedItem.data;
            } catch (error) {
                console.error('Cache retrieval error:', error);
                return null;
            }
        },
        
        /**
         * Record user interaction for performance monitoring
         * @param {string} actionName - Name of the user action
         */
        recordInteraction: function(actionName) {
            if (!_metricsCollectionEnabled) return;
            
            const startTime = performance.now();
            
            const endMeasurement = () => {
                const duration = performance.now() - startTime;
                
                _performanceMetrics.interactions.push({
                    action: actionName,
                    time: new Date().toISOString(),
                    duration: Math.round(duration)
                });
                
                if (_metricsCollectionEnabled) {
                    console.log(`Interaction "${actionName}" took ${Math.round(duration)}ms`);
                }
            };
            
            return endMeasurement;
        }
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWPPerformance;
} 