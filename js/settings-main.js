// js/settings-main.js

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
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  } else if (typeof firebase === 'undefined') {
      console.error("Firebase SDKs not loaded before settings-main.js was executed.");
      // Display error to user if critical
      const authRedirectMsg = document.getElementById('auth-redirect-message');
      if (authRedirectMsg) {
          authRedirectMsg.innerHTML = `<div class="auth-container"><p style="color:var(--md-sys-color-error);">Error: Could not load essential services. Please refresh.</p></div>`;
          authRedirectMsg.classList.remove('hidden');
          const dashboardWrapperEl = document.getElementById('dashboard-wrapper');
          if (dashboardWrapperEl) dashboardWrapperEl.classList.add('hidden');
      }
  }
  
  let db, auth;
  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      db = firebase.firestore();
      auth = firebase.auth();
  } else {
      console.error("Firebase not initialized in settings-main.js. Features will be affected.");
  }
  
  // DOM Elements
  const studentDisplayNameHeader = document.getElementById('student-display-name');
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const authRedirectMessage = document.getElementById('auth-redirect-message'); // Declared again for clarity, ensure only one effective instance
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
      const btnEl = document.getElementById(button); // Get element by ID
      const spinnerEl = document.getElementById(spinner); // Get element by ID
      if (!btnEl || !spinnerEl) return;
      btnEl.disabled = isLoading;
      spinnerEl.classList.toggle('hidden', !isLoading);
      btnEl.classList.toggle('opacity-70', isLoading); 
  }
  
  function showMessageElement(elementId, text, type = 'success') {
      const element = document.getElementById(elementId);
      if (!element) return;
      element.innerHTML = ''; 
      
      const iconSpan = document.createElement('span');
      iconSpan.classList.add('material-symbols-outlined');
      iconSpan.style.marginRight = 'var(--md-sys-spacing-xs)';
      iconSpan.style.fontSize = '1.25rem'; 
  
      if (type === 'success') {
          iconSpan.textContent = 'check_circle';
          iconSpan.style.color = 'var(--md-sys-color-on-success-container)'; 
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
  
  if (auth) {
      auth.onAuthStateChanged(user => {
          if (user) {
              if (dashboardWrapper) dashboardWrapper.classList.remove('hidden');
              if (authRedirectMessage) authRedirectMessage.classList.add('hidden');
              
              const displayName = user.displayName || user.email || 'Student';
              if (studentDisplayNameHeader) studentDisplayNameHeader.textContent = displayName;
              
              if (settingsNameInput) settingsNameInput.value = user.displayName || '';
              if (settingsEmailInput) settingsEmailInput.value = user.email || '';
              
              loadExamDate(user);
  
          } else {
              if (dashboardWrapper) dashboardWrapper.classList.add('hidden');
              if (authRedirectMessage) authRedirectMessage.classList.remove('hidden');
          }
      });
  }
  
  
  if(logoutButton && auth){
      logoutButton.addEventListener('click', () => {
          if(confirm("Are you sure you want to log out?")){
              auth.signOut().then(() => {
                  window.location.href = 'student_dashboard.html'; 
              }).catch(error => {
                  console.error("Logout error:", error);
                  showMessageElement('profile-message', 'Error logging out: ' + error.message, 'error');
              });
          }
      });
  }
  
  // Profile Settings
  if(saveProfileButton && auth && db) {
      saveProfileButton.addEventListener('click', async () => {
          const user = auth.currentUser;
          if (!user) return;
  
          const newName = settingsNameInput.value.trim();
          
          if (!newName) {
              showMessageElement('profile-message', 'Name cannot be empty.', 'error');
              return;
          }
          
          setButtonLoading('save-profile-button', 'profile-spinner', true);
          
          try {
              if (user.displayName !== newName) {
                  await user.updateProfile({ displayName: newName });
              }
              await db.collection('users').doc(user.uid).set({
                  displayName: newName,
              }, { merge: true });
  
              showMessageElement('profile-message', 'Profile updated successfully!', 'success');
              if (studentDisplayNameHeader) studentDisplayNameHeader.textContent = newName; 
  
          } catch (error) {
              console.error("Error updating profile:", error);
              showMessageElement('profile-message', 'Error updating profile: ' + error.message, 'error');
          } finally {
              setButtonLoading('save-profile-button', 'profile-spinner', false);
          }
      });
  }
  
  // Password Settings
  if(changePasswordButton && auth){
      changePasswordButton.addEventListener('click', async () => {
          const user = auth.currentUser;
          if (!user) return;
  
          const currentPassword = currentPasswordInput.value;
          const newPassword = newPasswordInput.value;
          const confirmPassword = confirmPasswordInput.value;
  
          if (!currentPassword) {
              showMessageElement('password-message', 'Please enter your current password.', 'error'); return;
          }
          if (newPassword.length < 6) {
              showMessageElement('password-message', 'New password must be at least 6 characters.', 'error'); return;
          }
          if (newPassword !== confirmPassword) {
              showMessageElement('password-message', 'New passwords do not match.', 'error'); return;
          }
  
          setButtonLoading('change-password-button', 'password-spinner', true);
  
          try {
              const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
              await user.reauthenticateWithCredential(credential);
              await user.updatePassword(newPassword);
              
              showMessageElement('password-message', 'Password changed successfully!', 'success');
              currentPasswordInput.value = '';
              newPasswordInput.value = '';
              confirmPasswordInput.value = '';
  
          } catch (error) {
              console.error("Error changing password:", error);
              let friendlyMessage = 'Error changing password. Please check your current password and try again.';
              if(error.code === 'auth/wrong-password'){
                   friendlyMessage = 'Incorrect current password. Please try again.';
              }
              showMessageElement('password-message', friendlyMessage, 'error');
          } finally {
              setButtonLoading('change-password-button', 'password-spinner', false);
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
               updateDaysRemainingDisplay(null); 
          }
      } catch (error) {
          console.error("Error loading exam date:", error);
          showMessageElement('exam-date-message', 'Could not load exam date.', 'error');
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
      const examDate = new Date(examDateStr + "T00:00:00"); 
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
  
  if(saveExamDateButton && auth && db){
      saveExamDateButton.addEventListener('click', async () => {
          const user = auth.currentUser;
          if (!user || !db) return;
  
          const examDate = settingsExamDateInput.value;
          if (!examDate) {
               try {
                  await db.collection('userPreferences').doc(user.uid).update({ examDate: firebase.firestore.FieldValue.delete() });
                  showMessageElement('exam-date-message', 'Exam date cleared.', 'success');
                  updateDaysRemainingDisplay(null);
              } catch (error) {
                  console.error("Error clearing exam date:", error);
                  showMessageElement('exam-date-message', 'Error clearing exam date.', 'error');
              }
              return;
          }
          
          setButtonLoading('save-exam-date-button', 'exam-date-spinner', true);
  
          try {
              await db.collection('userPreferences').doc(user.uid).set({
                  examDate: examDate
              }, { merge: true });
              showMessageElement('exam-date-message', 'Exam date saved successfully!', 'success');
              updateDaysRemainingDisplay(examDate);
          } catch (error) {
              console.error("Error saving exam date:", error);
              showMessageElement('exam-date-message', 'Error saving exam date: ' + error.message, 'error');
          } finally {
               setButtonLoading('save-exam-date-button', 'exam-date-spinner', false);
          }
      });
  }
  
  // Initial setup on DOMContentLoaded (or if script is at end of body, can run directly)
  // However, with defer, it's good practice to ensure critical initializations depending on Firebase
  // are also within the auth state listener or similar checks.
  document.addEventListener('DOMContentLoaded', () => {
      // Ensure no tab is wrongly active on the settings page itself
      document.querySelectorAll('.main-nav .nav-tab').forEach(tab => {
          tab.classList.remove('active');
          tab.setAttribute('aria-selected', 'false');
      });
  
      // Fallback if Firebase didn't initialize correctly via the deferred script load
      if (typeof firebase === 'undefined' || !firebase.apps.length) {
          console.error("DOM Content Loaded, but Firebase still not initialized properly in settings-main.js.");
          const authRedirectMsg = document.getElementById('auth-redirect-message');
          if (authRedirectMsg) {
              authRedirectMsg.innerHTML = `<div class="auth-container"><p style="color:var(--md-sys-color-error);">Error: Critical services failed to load. Please refresh the page.</p></div>`;
              authRedirectMsg.classList.remove('hidden');
              const dashboardWrapperEl = document.getElementById('dashboard-wrapper');
               if (dashboardWrapperEl) dashboardWrapperEl.classList.add('hidden');
          }
      }
  });