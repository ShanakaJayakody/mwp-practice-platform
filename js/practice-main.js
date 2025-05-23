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
  
  // Initialize Firebase (This will only run if firebase is defined by the SDKs loaded via defer)
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  } else if (typeof firebase === 'undefined') {
      console.error("Firebase SDKs not loaded before practice-main.js was executed. Check script tags in <head>.");
      // Optionally, display a user-facing error message here if Firebase is critical.
      const authRedirectMessageEl = document.getElementById('auth-redirect-message');
      if (authRedirectMessageEl) {
          authRedirectMessageEl.innerHTML = `
              <div class="p-8 rounded-lg shadow-xl max-w-md w-full text-center" style="background-color: var(--md-sys-color-surface); border-radius: var(--md-sys-shape-corner-large);">
                  <h2 style="font-family: var(--md-sys-typescale-headline-small-font-family-name); color: var(--md-sys-color-error); margin-bottom:var(--md-sys-spacing-s);">Application Error</h2>
                  <p class="mb-6" style="color: var(--md-sys-color-on-surface-variant);">A required service (Firebase) could not be loaded. Please try refreshing the page. If the problem persists, contact support.</p>
              </div>`;
          authRedirectMessageEl.classList.remove('hidden');
          const dashboardWrapperEl = document.getElementById('dashboard-wrapper');
          if(dashboardWrapperEl) dashboardWrapperEl.classList.add('hidden');
      }
  }
  
  // Define db and auth only if firebase has been initialized
  let db, auth;
  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      db = firebase.firestore();
      auth = firebase.auth();
  } else {
      console.error("Firebase not initialized. DB and Auth objects will be undefined.");
      // Prevent further execution or handle gracefully if Firebase is essential.
  }
          
  // DOM Elements
  const studentDisplayNameSpan = document.getElementById('student-display-name');
  const logoutButton = document.getElementById('logout-button');
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const authRedirectMessage = document.getElementById('auth-redirect-message'); // Already declared
  
  if (auth) { // Only set up auth listener if auth object is defined
      auth.onAuthStateChanged(user => {
          if (user) {
              if(studentDisplayNameSpan) studentDisplayNameSpan.textContent = user.displayName || user.email || 'Student';
              if(dashboardWrapper) dashboardWrapper.classList.remove('hidden');
              if(authRedirectMessage) authRedirectMessage.classList.add('hidden');
          } else {
              if(dashboardWrapper) dashboardWrapper.classList.add('hidden');
              if(authRedirectMessage) authRedirectMessage.classList.remove('hidden');
              // Optional: Redirect to login if strict auth needed for this page
              // window.location.href = 'student_dashboard.html'; 
          }
      });
  }
  
  
  if(logoutButton && auth) {
      logoutButton.addEventListener('click', () => {
          if (confirm("Are you sure you want to log out?")) {
              auth.signOut().then(() => {
                  window.location.href = 'student_dashboard.html';
              }).catch(error => console.error("Logout error:", error));
          }
      });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
      // Fallback check if Firebase didn't initialize due to SDK load issues before this script ran
      if (typeof firebase === 'undefined' || !firebase.apps.length) {
          console.error("DOM Content Loaded, but Firebase still not initialized properly in practice-main.js.");
          // If authRedirectMessage exists and is hidden, show it.
          const authRedirectMessageEl = document.getElementById('auth-redirect-message');
          const dashboardWrapperEl = document.getElementById('dashboard-wrapper');
          if (authRedirectMessageEl && authRedirectMessageEl.classList.contains('hidden')) {
               authRedirectMessageEl.innerHTML = `
                  <div class="p-8 rounded-lg shadow-xl max-w-md w-full text-center" style="background-color: var(--md-sys-color-surface); border-radius: var(--md-sys-shape-corner-large);">
                      <h2 style="font-family: var(--md-sys-typescale-headline-small-font-family-name); color: var(--md-sys-color-error); margin-bottom:var(--md-sys-spacing-s);">Application Error</h2>
                      <p class="mb-6" style="color: var(--md-sys-color-on-surface-variant);">A critical service failed to load. Please refresh. If the issue continues, contact support.</p>
                  </div>`;
              authRedirectMessageEl.classList.remove('hidden');
              if(dashboardWrapperEl) dashboardWrapperEl.classList.add('hidden');
          }
          return; // Stop further execution if Firebase isn't ready
      }
  
  
      const leftNavTabs = document.querySelectorAll('.left-nav-menu .left-nav-tab');
      const sectionContents = document.querySelectorAll('.practice-main-content .section-content');
      const navPracticeMain = document.getElementById('nav-practice-main');
  
      if(navPracticeMain) {
              document.querySelectorAll('.main-nav .nav-tab').forEach(tab => tab.classList.remove('active'));
              navPracticeMain.classList.add('active');
              navPracticeMain.setAttribute('aria-selected', 'true');
      }
  
      function showSection(targetId) {
          sectionContents.forEach(content => content.classList.remove('active'));
          leftNavTabs.forEach(tab => tab.classList.remove('active'));
  
          const targetContent = document.getElementById(targetId);
          const activeTab = document.querySelector(`.left-nav-tab[data-target="${targetId}"]`);
  
          if (targetContent) targetContent.classList.add('active');
          if (activeTab) activeTab.classList.add('active');
      }
  
      leftNavTabs.forEach(tab => {
          tab.addEventListener('click', (e) => {
              e.preventDefault();
              const targetId = tab.dataset.target;
              showSection(targetId);
              window.location.hash = targetId; // Update URL hash for direct linking
          });
      });
  
      // Handle hash linking on page load
      const currentHash = window.location.hash.substring(1);
      if (currentHash && document.getElementById(currentHash)) {
          showSection(currentHash);
      } else if (leftNavTabs.length > 0) {
          showSection(leftNavTabs[0].dataset.target); // Show the first section by default
      }
  
      // Focus Groups Section Logic
      const selectVRCardFg = document.getElementById('select-vr-fg');
      // Ensure other FG cards are selected if they exist, e.g., selectDMFg, selectQRFg
      const practiceSetsContainerFg = document.getElementById('practice-sets-container-fg');
      const currentSectionTitleSpanFg = document.getElementById('current-section-title-fg');
      const practiceSetsGridFg = document.getElementById('practice-sets-grid-fg');
      const allSectionCardsFg = document.querySelectorAll('.section-card-fg');
  
      function displayPracticeSetsFg(sectionName, sectionShortName, sets) {
          if (!currentSectionTitleSpanFg || !practiceSetsGridFg || !practiceSetsContainerFg) return;
          currentSectionTitleSpanFg.textContent = sectionName;
          practiceSetsGridFg.innerHTML = ''; 
  
          sets.forEach(set => {
              const setLink = document.createElement('a');
              setLink.href = set.link;
              setLink.classList.add('practice-set-link-fg');
              setLink.textContent = `${sectionShortName} Set ${set.number}`;
              if (set.disabled) {
                  setLink.classList.add('disabled');
                  setLink.href = '#'; // Make unclickable
                  setLink.setAttribute('aria-disabled', 'true');
              }
              practiceSetsGridFg.appendChild(setLink);
          });
          practiceSetsContainerFg.classList.remove('hidden');
      }
      
      function setActiveSectionCardFg(selectedCard) {
          allSectionCardsFg.forEach(card => card.classList.remove('active'));
          if (selectedCard) selectedCard.classList.add('active');
      }
  
      allSectionCardsFg.forEach(card => {
          const button = card.querySelector('.btn-select-section-fg');
          if (button && !card.classList.contains('disabled')) {
              button.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const section = card.dataset.section;
                  let sets = [];
                  let sectionFullName = '';
  
                  if (section === 'VR') {
                      sectionFullName = 'Verbal Reasoning';
                      sets.push({ number: 16, link: "VR focus group16.html", disabled: false });
                      for(let i = 1; i <= 20; i++) {
                          if (i !== 16) sets.push({ number: i, link: "#", disabled: true});
                      }
                      sets.sort((a,b) => a.number - b.number);
                  } else if (section === 'DM') {
                      // Define DM sets if/when available
                  } else if (section === 'QR') {
                      // Define QR sets if/when available
                  }
                  displayPracticeSetsFg(sectionFullName, section, sets);
                  setActiveSectionCardFg(card);
              });
          }
      });
      
      // DM Class Worksheets Logic
      const dmSelectTopicBtn = document.getElementById('dm-select-topic-btn');
      const dmSubtopicSelectionDiv = document.getElementById('dm-subtopic-selection');
      const dmWorksheetDisplayDiv = document.getElementById('dm-worksheet-display');
      const dmWorksheetListTitle = document.getElementById('dm-worksheet-list-title');
      const dmWorksheetsGrid = document.getElementById('dm-worksheets-grid');
      const dmBackToTopicsBtn = document.getElementById('dm-back-to-topics-btn');
      const dmSubtopicItems = document.querySelectorAll('.dm-subtopic-item');
  
      if (dmSelectTopicBtn) {
          dmSelectTopicBtn.addEventListener('click', () => {
              dmSubtopicSelectionDiv.classList.remove('hidden');
              dmSelectTopicBtn.classList.add('hidden'); 
          });
      }
  
      dmSubtopicItems.forEach(item => {
          item.addEventListener('click', (e) => {
              e.preventDefault();
              if (item.classList.contains('disabled')) return;
              dmSubtopicItems.forEach(i => i.classList.remove('active'));
              item.classList.add('active');
              const subtopicName = item.textContent.replace(/<span.*<\/span>/, '').trim();
              if(dmWorksheetListTitle) dmWorksheetListTitle.textContent = `${subtopicName} Worksheets:`;
              populateDmWorksheets(subtopicName);
              if(dmSubtopicSelectionDiv) dmSubtopicSelectionDiv.classList.add('hidden');
              if(dmWorksheetDisplayDiv) dmWorksheetDisplayDiv.classList.remove('hidden');
          });
      });
  
      if (dmBackToTopicsBtn) {
          dmBackToTopicsBtn.addEventListener('click', () => {
              if(dmWorksheetDisplayDiv) dmWorksheetDisplayDiv.classList.add('hidden');
              if(dmSubtopicSelectionDiv) dmSubtopicSelectionDiv.classList.remove('hidden');
          });
      }
  
      function populateDmWorksheets(subtopicName) {
          if (!dmWorksheetsGrid) return;
          dmWorksheetsGrid.innerHTML = '';
          
          if (subtopicName.toLowerCase() === "syllogisms") {
              const syllogismFiles = ["DM sylls 1.html", "DM sylls 2.html", "DM sylls 3.html", "DM sylls 4.html", "DM sylls 5.html"];
              syllogismFiles.forEach((file, i) => {
                  const worksheetLink = document.createElement('a');
                  worksheetLink.href = file;
                  worksheetLink.classList.add('dm-worksheet-link');
                  worksheetLink.textContent = `${subtopicName} Worksheet ${i + 1}`;
                  dmWorksheetsGrid.appendChild(worksheetLink);
              });
          } else {
              const placeholderText = document.createElement('p');
              placeholderText.textContent = `Worksheets for ${subtopicName} are coming soon.`;
              placeholderText.classList.add('text-sm', 'col-span-full');
              placeholderText.style.color = 'var(--md-sys-color-on-surface-variant)';
              dmWorksheetsGrid.appendChild(placeholderText);
          }
      }
  });