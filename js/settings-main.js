<script>
// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyASKsaFFTZ-finv2d5egR9K_mZNstEwdns",
  authDomain: "mwp-qr-test-page.firebaseapp.com",
  projectId: "mwp-qr-test-page",
  storageBucket: "mwp-qr-test-page.appspot.com",
  messagingSenderId: "309084045110",
  appId: "1:309084045110:web:b09ca0fdff84b094963d97",
  measurementId: "G-4M3ED641M9"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const studentDisplayNameHeader = document.getElementById('student-display-name');
const dashboardWrapper = document.getElementById('dashboard-wrapper');
const authRedirectMessage = document.getElementById('auth-redirect-message');
const logoutButton = document.getElementById('logout-button');

const settingsNameInput = document.getElementById('settings-name');
const settingsEmailInput = document.getElementById('settings-email');
const saveProfileButton = document.getElementById('save-profile-button');
const profileSpinner = document.getElementById('profile-spinner');
const profileMessage = document.getElementById('profile-message');

const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const changePasswordButton = document.getElementById('change-password-button');
const passwordSpinner = document.getElementById('password-spinner');
const passwordMessage = document.getElementById('password-message');

const settingsExamDateInput = document.getElementById('settings-exam-date');
const daysRemainingDisplay = document.getElementById('days-remaining-display');
const saveExamDateButton = document.getElementById('save-exam-date-button');
const examDateSpinner = document.getElementById('exam-date-spinner');
const examDateMessage = document.getElementById('exam-date-message');


// UI Helper Functions
function setButtonLoading(button, spinner, isLoading) {
    if (!button || !spinner) return;
    button.disabled = isLoading;
    spinner.classList.toggle('hidden', !isLoading);
    button.classList.toggle('opacity-70', isLoading); 
}

function showMessageElement(element, text, type = 'success') {
    if (!element) return;
    element.innerHTML = ''; 
    
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('material-symbols-outlined');
    iconSpan.style.marginRight = 'var(--md-sys-spacing-xs)';
    iconSpan.style.fontSize = '1.25rem'; // Match button icon size

    if (type === 'success') {
        iconSpan.textContent = 'check_circle';
        iconSpan.style.color = 'var(--md-sys-color-on-success-container)'; // Icon color consistent with text
    } else {
        iconSpan.textContent = 'error';
        iconSpan.style.color = 'var(--md-sys-color-on-error-container)';
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    element.appendChild(iconSpan);
    element.appendChild(textSpan);
    
    element.className = 'message'; 
    element.classList.add(type);
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}


auth.onAuthStateChanged(user => {
    if (user) {
        dashboardWrapper.classList.remove('hidden');
        if (authRedirectMessage) authRedirectMessage.classList.add('hidden');
        
        const displayName = user.displayName || user.email || 'Student';
        if (studentDisplayNameHeader) studentDisplayNameHeader.textContent = displayName;
        
        if (settingsNameInput) settingsNameInput.value = user.displayName || '';
        if (settingsEmailInput) settingsEmailInput.value = user.email || '';
        
        loadExamDate(user);

    } else {
        dashboardWrapper.classList.add('hidden');
        if (authRedirectMessage) authRedirectMessage.classList.remove('hidden');
        // Consider redirecting to login if this page strictly requires auth
        // window.location.href = 'student_dashboard.html'; 
    }
});

if(logoutButton){
    logoutButton.addEventListener('click', () => {
        if(confirm("Are you sure you want to log out?")){
            auth.signOut().then(() => {
                window.location.href = 'student_dashboard.html'; // Redirect to login
            }).catch(error => {
                console.error("Logout error:", error);
                showMessageElement(profileMessage, 'Error logging out: ' + error.message, 'error');
            });
        }
    });
}

// Profile Settings
if(saveProfileButton) {
    saveProfileButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        const newName = settingsNameInput.value.trim();
        
        if (!newName) {
            showMessageElement(profileMessage, 'Name cannot be empty.', 'error');
            return;
        }
        
        setButtonLoading(saveProfileButton, profileSpinner, true);
        
        try {
            if (user.displayName !== newName) {
                await user.updateProfile({ displayName: newName });
            }
            // Update Firestore record if you store display name there too
            await db.collection('users').doc(user.uid).set({
                displayName: newName,
            }, { merge: true });

            showMessageElement(profileMessage, 'Profile updated successfully!', 'success');
            if (studentDisplayNameHeader) studentDisplayNameHeader.textContent = newName; // Update header immediately

        } catch (error) {
            console.error("Error updating profile:", error);
            showMessageElement(profileMessage, 'Error updating profile: ' + error.message, 'error');
        } finally {
            setButtonLoading(saveProfileButton, profileSpinner, false);
        }
    });
}

// Password Settings
if(changePasswordButton){
    changePasswordButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!currentPassword) {
            showMessageElement(passwordMessage, 'Please enter your current password.', 'error'); return;
        }
        if (newPassword.length < 6) {
            showMessageElement(passwordMessage, 'New password must be at least 6 characters.', 'error'); return;
        }
        if (newPassword !== confirmPassword) {
            showMessageElement(passwordMessage, 'New passwords do not match.', 'error'); return;
        }

        setButtonLoading(changePasswordButton, passwordSpinner, true);

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            
            showMessageElement(passwordMessage, 'Password changed successfully!', 'success');
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';

        } catch (error) {
            console.error("Error changing password:", error);
            let friendlyMessage = 'Error changing password. Please check your current password and try again.';
            if(error.code === 'auth/wrong-password'){
                 friendlyMessage = 'Incorrect current password. Please try again.';
            }
            showMessageElement(passwordMessage, friendlyMessage, 'error');
        } finally {
            setButtonLoading(changePasswordButton, passwordSpinner, false);
        }
    });
}

// Exam Date Settings
async function loadExamDate(user) {
    if (!user || !db || !settingsExamDateInput || !daysRemainingDisplay) return;
    try {
        const docRef = db.collection('userPreferences').doc(user.uid);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            const preferences = docSnap.data();
            if (preferences.examDate) {
                settingsExamDateInput.value = preferences.examDate;
                updateDaysRemainingDisplay(preferences.examDate);
            } else {
                updateDaysRemainingDisplay(null);
            }
        } else {
             updateDaysRemainingDisplay(null); // No preference document yet
        }
    } catch (error) {
        console.error("Error loading exam date:", error);
        showMessageElement(examDateMessage, 'Could not load exam date.', 'error');
        updateDaysRemainingDisplay(null);
    }
}

function updateDaysRemainingDisplay(examDateStr) {
    if (!daysRemainingDisplay) return;
    if (!examDateStr) {
        daysRemainingDisplay.value = 'Not set';
        daysRemainingDisplay.style.color = 'var(--md-sys-color-on-surface-variant)';
        return;
    }
    const examDate = new Date(examDateStr + "T00:00:00"); // Treat as local date
    const today = new Date();
    today.setHours(0,0,0,0); 

    if (examDate < today) {
        daysRemainingDisplay.value = 'Date has passed';
        daysRemainingDisplay.style.color = 'var(--md-sys-color-error)';
    } else {
        const diffTime = examDate.getTime() - today.getTime(); 
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemainingDisplay.value = `${diffDays} day(s) remaining`;
        daysRemainingDisplay.style.color = 'var(--md-sys-color-primary)';
    }
}

if(settingsExamDateInput){
    settingsExamDateInput.addEventListener('change', () => {
        updateDaysRemainingDisplay(settingsExamDateInput.value);
    });
}

if(saveExamDateButton){
    saveExamDateButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user || !db) return;

        const examDate = settingsExamDateInput.value;
        if (!examDate) {
             try {
                await db.collection('userPreferences').doc(user.uid).update({ examDate: firebase.firestore.FieldValue.delete() });
                showMessageElement(examDateMessage, 'Exam date cleared.', 'success');
                updateDaysRemainingDisplay(null);
            } catch (error) {
                console.error("Error clearing exam date:", error);
                showMessageElement(examDateMessage, 'Error clearing exam date.', 'error');
            }
            return;
        }
        
        setButtonLoading(saveExamDateButton, examDateSpinner, true);

        try {
            await db.collection('userPreferences').doc(user.uid).set({
                examDate: examDate
            }, { merge: true });
            showMessageElement(examDateMessage, 'Exam date saved successfully!', 'success');
            updateDaysRemainingDisplay(examDate);
        } catch (error) {
            console.error("Error saving exam date:", error);
            showMessageElement(examDateMessage, 'Error saving exam date: ' + error.message, 'error');
        } finally {
             setButtonLoading(saveExamDateButton, examDateSpinner, false);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.main-nav .nav-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    // No specific tab is "active" on the settings page itself by default.
});

</script>