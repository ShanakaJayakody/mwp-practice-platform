/**
 * MedwithPurpose Authentication Module
 * 
 * This module handles all Firebase authentication related functionality
 * including login, logout, and auth state changes.
 */

const MWPAuth = (function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyASKsaFFTZ-finv2d5egR9K_mZNstEwdns",
        authDomain: "mwp-qr-test-page.firebaseapp.com",
        projectId: "mwp-qr-test-page",
        storageBucket: "mwp-qr-test-page.appspot.com", 
        messagingSenderId: "309084045110",
        appId: "1:309084045110:web:b09ca0fdff84b094963d97",
        measurementId: "G-4M3ED641M9"
    };

    // Private variables
    let _isInitialized = false;
    let _currentUser = null;
    let _authStateListeners = [];
    let firebaseApp = null; // Store the initialized Firebase App
    let authInstance = null; // Store the Firebase Auth instance

    // Private methods
    async function _initializeFirebase() {
        if (_isInitialized) return true;

        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not loaded prior to MWPAuth.initialize()!");
            return false;
        }

        try {
            // Check if a default app already exists to prevent re-initialization errors
            if (firebase.apps.length === 0) {
                firebaseApp = firebase.initializeApp(firebaseConfig);
                console.log("Firebase App initialized successfully by MWPAuth.");
            } else {
                firebaseApp = firebase.app(); // Get default app if already initialized
                console.log("Firebase App already initialized, MWPAuth using existing app.");
            }
            
            authInstance = firebase.auth(); // Get auth instance from the initialized app
            authInstance.onAuthStateChanged(_handleAuthStateChange);
            _isInitialized = true;
            console.log("MWPAuth module initialized with Firebase Auth services.");
            return true;
        } catch (error) {
            console.error("Firebase initialization error in MWPAuth:", error);
            _isInitialized = false; // Ensure we can retry if it's a recoverable error
            return false;
        }
    }

    function _handleAuthStateChange(user) {
        _currentUser = user;
        _authStateListeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    // Public API
    return {
        initialize: async function() {
            return await _initializeFirebase();
        },
        
        getAuthInstance: function() {
            if (!_isInitialized || !authInstance) {
                // console.error("MWPAuth not initialized or auth instance not available. Call initialize() first.");
                // Attempt to initialize if not already, this can help in some out-of-order calls
                // but the main initializeApp function in HTML should handle the primary call.
                // if (!_isInitialized) {
                //     console.warn("Attempting late initialization of MWPAuth from getAuthInstance");
                //     _initializeFirebase(); // This won't be awaited here, prefer explicit init
                // }
                // For now, let's just log error if not initialized, as main script should handle it.
                if(!authInstance) console.error("Auth instance is not available in MWPAuth.");
                return authInstance; // May return null if not initialized
            }
            return authInstance;
        },

        signInWithGoogle: async function() {
            if (!_isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return Promise.reject(new Error('MWPAuth failed to initialize for Google Sign-In'));
            }
            if (!authInstance) return Promise.reject(new Error('Firebase Auth not ready for Google Sign-In'));
            
            const provider = new firebase.auth.GoogleAuthProvider();
            return authInstance.signInWithPopup(provider);
        },
        
        signInWithEmail: async function(email, password) {
            if (!_isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return Promise.reject(new Error('MWPAuth failed to initialize for Email Sign-In'));
            }
            if (!authInstance) return Promise.reject(new Error('Firebase Auth not ready for Email Sign-In'));
            
            return authInstance.signInWithEmailAndPassword(email, password);
        },
        
        signOut: async function() {
            if (!_isInitialized) {
                // It's unlikely signOut would be called if not initialized, but good to check
                console.warn('MWPAuth.signOut called before initialization.');
                return Promise.reject(new Error('Firebase not initialized for Sign Out'));
            }
            if (!authInstance) return Promise.reject(new Error('Firebase Auth not ready for Sign Out'));
            
            return authInstance.signOut();
        },
        
        getCurrentUser: function() {
            // _currentUser is updated by onAuthStateChanged, so it's safe to return directly
            // It doesn't strictly need _isInitialized check for this specific variable,
            // but auth operations based on this user would.
            return _currentUser;
        },
        
        onAuthStateChanged: function(listener) {
            if (typeof listener === 'function') {
                _authStateListeners.push(listener);
                // If MWPAuth is already initialized and we have a current user state,
                // immediately notify the new listener.
                if (_isInitialized) {
                    listener(_currentUser);
                }
            }
        },
        
        removeAuthStateListener: function(listener) {
            const index = _authStateListeners.indexOf(listener);
            if (index !== -1) {
                _authStateListeners.splice(index, 1);
            }
        },
        
        isAuthenticated: function() {
            return _currentUser !== null;
        },
        
        isAdmin: async function() {
            if (!_isInitialized || !_currentUser) {
                return Promise.resolve(false);
            }
            if (!authInstance) return Promise.resolve(false); // Should not happen if _isInitialized is true

            // Ensure Firestore is available (depends on data-service.js being initialized)
            if (typeof MWPData === 'undefined' || !MWPData.getFirestoreInstance) {
                console.warn("MWPData or getFirestoreInstance not available for isAdmin check.");
                return Promise.resolve(false); 
            }
            const db = MWPData.getFirestoreInstance();
            if (!db) {
                console.warn("Firestore instance not available for isAdmin check via MWPData.");
                return Promise.resolve(false);
            }
            
            return db.collection('users').doc(_currentUser.uid).get()
                .then(doc => {
                    return doc.exists && doc.data().role === 'admin';
                })
                .catch(error => {
                    console.error('Error checking admin status:', error);
                    return false;
                });
        }
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWPAuth;
} 