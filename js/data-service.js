/**
 * MedwithPurpose Data Service Module
 * 
 * This module provides a unified API for data fetching, storing and
 * managing results across the platform using Firebase Firestore.
 */

const MWPData = (function() {
    // Private variables
    let dbInstance = null; // Store the Firestore instance
    let _isInitialized = false;
    
    // Private methods
    async function _initializeFirestore() {
        if (_isInitialized) return true;

        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not loaded prior to MWPData.initialize()!");
            return false;
        }
        
        // Ensure Firebase App itself is initialized (handled by MWPAuth)
        if (firebase.apps.length === 0) {
            console.error("Firebase App not initialized. MWPData expects MWPAuth.initialize() to have been called first and succeeded.");
            // Do NOT attempt to initialize MWPAuth from here; it creates circular dependencies or race conditions.
            // The main script in HTML is responsible for the correct initialization order.
            return false; 
        }

        try {
            dbInstance = firebase.firestore(); // Get Firestore from the already initialized app
            _isInitialized = true;
            console.log("MWPData module initialized with Firestore services.");
            return true;
        } catch (error) {
            console.error("Firestore (MWPData) initialization error:", error);
            _isInitialized = false;
            return false;
        }
    }
    
    function _getCurrentUserIdFromAuth() { 
        if (typeof MWPAuth !== 'undefined' && MWPAuth.getCurrentUser) {
            const user = MWPAuth.getCurrentUser();
            return user ? user.uid : null;
        }
        console.warn("MWPAuth not available to get current user ID in MWPData.");
        return null;
    }
    
    // Public API
    return {
        initialize: async function() {
            return await _initializeFirestore();
        },

        getFirestoreInstance: function() {
            if (!_isInitialized || !dbInstance) {
                // console.error("MWPData not initialized or Firestore instance not available. Call initialize() first.");
                // Avoid logging an error here if the main init sequence handles it, to reduce console noise.
                // The functions below will reject promises if dbInstance is not ready.
            }
            return dbInstance; // May return null if not initialized
        },
        
        saveTestResult: async function(testId, resultData) {
            if (!_isInitialized) { // Attempt late initialization if not done
                const initialized = await this.initialize();
                if (!initialized) return Promise.reject(new Error('MWPData lazy init failed for saveTestResult'));
            }
            const db = this.getFirestoreInstance();
            if (!db) return Promise.reject(new Error('Firestore not ready for saveTestResult'));

            const userId = _getCurrentUserIdFromAuth();
            if (!userId) return Promise.reject(new Error('User not authenticated for saveTestResult'));
            
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const resultDoc = {
                userId: userId,
                testId: testId,
                timestamp: timestamp,
                completedAt: new Date().toISOString(),
                ...resultData
            };
            
            return db.collection('results').add(resultDoc)
                .then(docRef => {
                    console.log('Result saved with ID:', docRef.id);
                    return docRef;
                })
                .catch(error => {
                    console.error('Error saving result:', error);
                    throw error; 
                });
        },
        
        getUserResults: async function(options = {}) { 
            if (!_isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return Promise.reject(new Error('MWPData lazy init failed for getUserResults'));
            }
            const db = this.getFirestoreInstance();
            if (!db) return Promise.reject(new Error('Firestore not ready for getUserResults'));

            const userId = options.userId || _getCurrentUserIdFromAuth();
            if (!userId) return Promise.reject(new Error('User ID not provided or user not authenticated for getUserResults'));
            
            let query = db.collection('results').where('userId', '==', userId);
            
            if (options.orderBy) {
                query = query.orderBy(options.orderBy, options.orderDir || 'desc');
            } else {
                query = query.orderBy('timestamp', 'desc'); // Default ordering
            }
            if (options.limit) query = query.limit(options.limit);
            if (options.testId) query = query.where('testId', '==', options.testId);
            
            return query.get()
                .then(snapshot => {
                    const results = [];
                    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
                    return results;
                })
                .catch(error => {
                    console.error('Error getting user results:', error);
                    throw error;
                });
        },

        getFilteredResults: async function(filters = {}, limit = 20, startAfterDocId = null) {
            if (!_isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return Promise.reject(new Error('MWPData lazy init failed for getFilteredResults'));
            }
            const db = this.getFirestoreInstance();
            if (!db) return Promise.reject(new Error('Firestore not ready for getFilteredResults'));

            let query = db.collection('results');
            
            if (filters.userId) query = query.where('userId', '==', filters.userId);
            if (filters.testId) query = query.where('testId', '==', filters.testId);
            if (filters.startDate) query = query.where('timestamp', '>=', filters.startDate);
            if (filters.endDate) query = query.where('timestamp', '<=', filters.endDate);
            if (filters.minScore) query = query.where('score', '>=', filters.minScore);
            if (filters.maxScore) query = query.where('score', '<=', filters.maxScore);

            query = query.orderBy(filters.orderBy || 'timestamp', filters.orderDir || 'desc');
            query = query.limit(limit);

            if (startAfterDocId) {
                const startAfterDocSnapshot = await db.collection('results').doc(startAfterDocId).get();
                if (startAfterDocSnapshot.exists) {
                    query = query.startAfter(startAfterDocSnapshot);
                } else {
                    console.warn('Pagination document for startAfter not found:', startAfterDocId);
                }
            }

            return query.get()
                .then(snapshot => {
                    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
                    return {
                        results: results,
                        lastDocId: lastDoc ? lastDoc.id : null,
                        hasMore: results.length === limit && snapshot.docs.length > 0 
                    };
                })
                .catch(error => {
                    console.error('Error in getFilteredResults:', error);
                    throw error;
                });
        },

        getUserStatsEfficient: async function(userId) {
            if (!_isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return Promise.reject(new Error('MWPData lazy init failed for getUserStatsEfficient'));
            }
            const db = this.getFirestoreInstance();
            if (!db) return Promise.reject(new Error('Firestore not ready for getUserStatsEfficient'));
            if (!userId) return Promise.reject(new Error('User ID required for getUserStatsEfficient'));

            const recentQuery = db.collection('results')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(5)
                .select('testId', 'score', 'timestamp', 'completedAt');
            
            const statsQuery = db.collection('results')
                .where('userId', '==', userId)
                .select('score')
                .limit(100); // Example limit
            
            return Promise.all([recentQuery.get(), statsQuery.get()])
                .then(([recentSnapshot, statsSnapshot]) => {
                    const recentTests = [];
                    recentSnapshot.forEach(doc => recentTests.push({ id: doc.id, ...doc.data() }));
                    
                    let totalScore = 0;
                    let highestScore = 0;
                    let count = 0;
                    statsSnapshot.forEach(doc => {
                        const score = doc.data().score || 0;
                        totalScore += score;
                        highestScore = Math.max(highestScore, score);
                        count++;
                    });
                    
                    return {
                        totalTests: count,
                        averageScore: count > 0 ? Math.round(totalScore / count) : 0,
                        highestScore: highestScore,
                        recentTests: recentTests
                    };
                })
                .catch(error => {
                    console.error('Error in getUserStatsEfficient:', error);
                    throw error;
                });
        }
        // Add other data methods (getResult, deleteResult, etc.) here,
        // following the same pattern of checking _isInitialized and using this.getFirestoreInstance()
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWPData;
} 