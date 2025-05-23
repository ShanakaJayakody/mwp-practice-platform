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
        // This check ensures Firebase is initialized only once.
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else if (typeof firebase === 'undefined') {
            // This case should ideally not happen if SDKs are loaded correctly via defer
            console.error("Firebase SDK not loaded. Ensure Firebase scripts are in <head> with defer attribute.");
        }
        
        // It's safer to only define db and auth if firebase is available
        let db, auth;
        if (typeof firebase !== 'undefined') {
            db = firebase.firestore();
            auth = firebase.auth();
        } else {
            // Fallback or error handling if Firebase isn't loaded
            console.error("Firebase object not available. Firebase features will not work.");
        }
        
        // DOM Elements
        const studentDisplayNameSpan = document.getElementById('student-display-name');
        const homeStudentFirstNameDisplay = document.getElementById('home-student-first-name');
        const userNameInput = document.getElementById('user-name');
        const examDateInput = document.getElementById('exam-date');
        const daysRemainingSpan = document.getElementById('days-remaining');
        const consistencyScoreP = document.getElementById('consistency-score');
        const logoutButton = document.getElementById('logout-button');
        const homeContentDiv = document.getElementById('home-content');
        const dashboardWrapper = document.getElementById('dashboard-wrapper');
        const authRedirectMessage = document.getElementById('auth-redirect-message');
        const animatedWelcomeText = document.querySelector('#home-content .animated-welcome-text');

        const prevMonthBtn = document.getElementById('prev-month-btn');
        const nextMonthBtn = document.getElementById('next-month-btn');
        const currentMonthYearSpan = document.getElementById('current-month-year');
        const currentMonthGrid = document.getElementById('current-month-grid');
        const nextMonthGrid = document.getElementById('next-month-grid');
        const currentMonthLabel = document.getElementById('current-month-label');
        const nextMonthLabel = document.getElementById('next-month-label');

        let currentCalendarDate = new Date();
        let performanceData = []; // Store all fetched performance data


        if (auth) { // Only set up auth listener if auth object is available
            auth.onAuthStateChanged(async user => {
                if (user) {
                    const displayName = user.displayName || user.email || 'Student';
                    const firstName = displayName.split(' ')[0];

                    studentDisplayNameSpan.textContent = displayName;
                    if (homeStudentFirstNameDisplay) homeStudentFirstNameDisplay.textContent = firstName;
                    if (userNameInput) userNameInput.value = displayName;
                    
                    if(authRedirectMessage) authRedirectMessage.classList.add('hidden');
                    dashboardWrapper.classList.remove('hidden');
                    homeContentDiv.classList.remove('hidden');

                    if (animatedWelcomeText) {
                        animatedWelcomeText.style.animation = 'none';
                        animatedWelcomeText.offsetHeight; 
                        animatedWelcomeText.style.animation = null; 
                        animatedWelcomeText.style.animation = 'slideInFromLeft 0.6s var(--md-sys-motion-easing-standard) forwards';
                    }

                    await loadUserPreferences(user);
                    await loadPerformanceData(user); 
                    updateHomeStats(); 
                    updateConsistencyScore();
                    renderCalendars();

                } else {
                    // User is signed out
                    dashboardWrapper.classList.add('hidden');
                    homeContentDiv.classList.add('hidden');
                    if (authRedirectMessage) authRedirectMessage.classList.remove('hidden');
                    // Optional: redirect to login page explicitly
                    // window.location.href = "student_dashboard.html";
                }
            });
        }


        if(logoutButton && auth) {
            logoutButton.addEventListener('click', () => {
                if (confirm("Are you sure you want to log out?")) {
                    auth.signOut().then(() => {
                        window.location.href = "student_dashboard.html"; // Redirect to login after logout
                    }).catch((error) => {
                        console.error("Logout error:", error);
                        alert("There was an error logging out. Please try again.");
                    });
                }
            });
        }

        async function loadUserPreferences(currentUser) {
            if (!currentUser || !db) return;
            const userPrefRef = db.collection('userPreferences').doc(currentUser.uid);
            try {
                const doc = await userPrefRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.examDate && examDateInput) {
                        examDateInput.value = data.examDate;
                        updateDaysRemaining(data.examDate);
                    } else {
                         updateDaysRemaining(); // If no date, show "Not set"
                    }
                } else {
                    updateDaysRemaining(); // No preferences doc, show "Not set"
                }
            } catch (error) {
                console.error("Error loading user preferences:", error);
                updateDaysRemaining(); // On error, show "Not set"
            }
        }
        
        if(examDateInput && db){ // Check for db as well
            examDateInput.addEventListener('change', async () => {
                const currentUser = auth ? auth.currentUser : null;
                if (!currentUser || !db) return;

                const selectedDate = examDateInput.value;
                try {
                    if (selectedDate) {
                        await db.collection('userPreferences').doc(currentUser.uid).set({ examDate: selectedDate }, { merge: true });
                        updateDaysRemaining(selectedDate);
                    } else {
                        // If date is cleared, remove it from preferences
                        await db.collection('userPreferences').doc(currentUser.uid).update({ examDate: firebase.firestore.FieldValue.delete() });
                        updateDaysRemaining(); // Update display to "Not set"
                    }
                } catch (error) {
                    console.error("Error saving exam date:", error);
                }
            });
        }


        function updateDaysRemaining(selectedDateStr) {
            if (!daysRemainingSpan) return;
            if (selectedDateStr) {
                const examDate = new Date(selectedDateStr + "T00:00:00"); 
                const today = new Date();
                today.setHours(0,0,0,0); 

                if (examDate < today) {
                    daysRemainingSpan.textContent = "Date has passed";
                    daysRemainingSpan.style.color = "var(--md-sys-color-error)";
                    return;
                }
                const diffTime = examDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysRemainingSpan.textContent = `${diffDays} day(s)`;
                daysRemainingSpan.style.color = "var(--md-sys-color-primary)";
            } else {
                daysRemainingSpan.textContent = "Not set";
                daysRemainingSpan.style.color = "var(--md-sys-color-on-surface-variant)";
            }
        }

        async function loadPerformanceData(currentUser) {
            if (!currentUser || !db) {
                 performanceData = [];
                 return;
            }
            performanceData = []; 
            const userId = currentUser.uid;
            try {
                const querySnapshot = await db.collection("performanceSubmissions")
                                          .where("userId", "==", userId) 
                                          .get();
                
                querySnapshot.forEach(doc => {
                    performanceData.push({ id: doc.id, ...doc.data() });
                });
            } catch (error) {
                console.error("Error loading performance data for home page:", error);
                performanceData = []; 
            }
        }

        function updateConsistencyScore() {
            if (!consistencyScoreP) return;
            if (performanceData.length === 0) {
                consistencyScoreP.textContent = '0 Days Completed';
                return;
            }
            const practiceDays = new Set();
            performanceData.forEach(result => {
                if (result.submissionTimestamp) {
                    let dateStr;
                    if (result.submissionTimestamp.toDate) { 
                        dateStr = result.submissionTimestamp.toDate().toLocaleDateString();
                    } else if (typeof result.submissionTimestamp === 'string') { 
                        dateStr = new Date(result.submissionTimestamp).toLocaleDateString();
                    } else if (typeof result.submissionTimestamp === 'number') { 
                        dateStr = new Date(result.submissionTimestamp).toLocaleDateString();
                    }
                    if (dateStr) practiceDays.add(dateStr);
                }
            });
            consistencyScoreP.textContent = `${practiceDays.size} Day(s) Completed`;
        }

        function updateHomeStats() {
            const homeTotalActivities = document.getElementById('home-total-activities');
            const homeAverageScore = document.getElementById('home-average-score');
            const homeTimePracticed = document.getElementById('home-time-practiced');
            
            if (!homeTotalActivities || !homeAverageScore || !homeTimePracticed) return;

            homeTotalActivities.textContent = '0';
            homeAverageScore.textContent = '0%';
            homeTimePracticed.textContent = '0h 0m';

            if (performanceData.length > 0) {
                homeTotalActivities.textContent = performanceData.length;
                let totalScoreSum = 0;
                let validScoresCount = 0;
                let totalMinutesPracticed = 0;

                performanceData.forEach(result => {
                    const score = parseFloat(result.score);
                    const totalPossible = parseFloat(result.totalPossibleScore || result.totalQuestions); 
                    
                    if (!isNaN(score) && !isNaN(totalPossible) && totalPossible > 0) {
                        totalScoreSum += (score / totalPossible) * 100;
                        validScoresCount++;
                    }
                    const timeTaken = result.timeTaken; 
                    if (timeTaken && typeof timeTaken === 'string') {
                        let minutes = 0;
                        const hourMatch = timeTaken.match(/(\d+)\s*h/);
                        const minMatch = timeTaken.match(/(\d+)\s*min/);
                        if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
                        if (minMatch) minutes += parseInt(minMatch[1]);
                        totalMinutesPracticed += minutes;
                    }
                });

                if (validScoresCount > 0) {
                    homeAverageScore.textContent = (totalScoreSum / validScoresCount).toFixed(1) + '%';
                }
                const hours = Math.floor(totalMinutesPracticed / 60);
                const minutes = totalMinutesPracticed % 60;
                homeTimePracticed.textContent = `${hours}h ${minutes}m`;
            }
        }

        function renderCalendars() {
            if(!currentMonthGrid || !nextMonthGrid || !currentMonthLabel || !nextMonthLabel || !currentMonthYearSpan) return;

            renderMonth(currentCalendarDate, currentMonthGrid, currentMonthLabel);
            
            let nextMonthDate = new Date(currentCalendarDate);
            nextMonthDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderMonth(nextMonthDate, nextMonthGrid, nextMonthLabel);

            currentMonthYearSpan.textContent = currentCalendarDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
        }

        function renderMonth(dateToRender, gridElement, labelElement) {
            gridElement.innerHTML = ''; 
            const month = dateToRender.getMonth();
            const year = dateToRender.getFullYear();

            labelElement.textContent = dateToRender.toLocaleDateString('default', { month: 'long' });

            const firstDayOfMonth = new Date(year, month, 1).getDay(); 
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            dayHeaders.forEach(header => {
                const dayLabelEl = document.createElement('div');
                dayLabelEl.className = 'calendar-day-label';
                dayLabelEl.textContent = header;
                gridElement.appendChild(dayLabelEl);
            });

            const startOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

            for (let i = 0; i < startOffset; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day empty';
                gridElement.appendChild(emptyCell);
            }

            const today = new Date();
            today.setHours(0,0,0,0);

            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = day;
                const cellDate = new Date(year, month, day);
                cellDate.setHours(0,0,0,0);

                if (cellDate.getTime() === today.getTime()) {
                    dayCell.classList.add('today');
                }

                const activityCount = getActivityCountForDate(cellDate);
                if (activityCount > 0) {
                    if (activityCount >= 2) { 
                        dayCell.classList.add('practice-lots');
                    } else { 
                        dayCell.classList.add('practice-some');
                    }
                }
                gridElement.appendChild(dayCell);
            }
        }
        
        function getActivityCountForDate(date) {
            let count = 0;
            const dateString = date.toLocaleDateString(); 
            performanceData.forEach(result => {
                if (result.submissionTimestamp) {
                    let submissionDateStr;
                     if (result.submissionTimestamp.toDate) { 
                        submissionDateStr = result.submissionTimestamp.toDate().toLocaleDateString();
                    } else if (typeof result.submissionTimestamp === 'string') { 
                        submissionDateStr = new Date(result.submissionTimestamp).toLocaleDateString();
                    } else if (typeof result.submissionTimestamp === 'number') { 
                         submissionDateStr = new Date(result.submissionTimestamp).toLocaleDateString();
                    }
                    if (submissionDateStr === dateString) {
                        count++;
                    }
                }
            });
            return count;
        }


        if(prevMonthBtn) prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendars();
        });
        if(nextMonthBtn) nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendars();
        });
        
        const viewAllTestsBtn = document.getElementById('home-view-all-tests-btn');
        if(viewAllTestsBtn) { 
            viewAllTestsBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                window.location.href = "practice.html"; 
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const navHome = document.getElementById('nav-home');
            if (navHome) {
                document.querySelectorAll('.main-nav .nav-tab').forEach(tab => tab.classList.remove('active'));
                navHome.classList.add('active');
                navHome.setAttribute('aria-selected', 'true');
            }
            // Initial auth check handled by onAuthStateChanged
            if (typeof firebase === 'undefined') {
                console.error("Firebase was not loaded by DOMContentLoaded. Check SDK script tags in <head>.");
                // Potentially show a more prominent error on the page
                if(authRedirectMessage) {
                    authRedirectMessage.innerHTML = `
                        <div class="auth-container bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center" style="background-color: var(--md-sys-color-surface); border-radius: var(--md-sys-shape-corner-large);">
                            <h2 style="font-family: var(--md-sys-typescale-headline-small-font-family-name); color: var(--md-sys-color-error); margin-bottom:var(--md-sys-spacing-s);">Initialization Error</h2>
                            <p class="mb-6" style="color: var(--md-sys-color-on-surface-variant);">Could not connect to services. Please try refreshing the page or contact support if the issue persists.</p>
                        </div>`;
                    authRedirectMessage.classList.remove('hidden');
                    if(dashboardWrapper) dashboardWrapper.classList.add('hidden');
                    if(homeContentDiv) homeContentDiv.classList.add('hidden');
                }
            } else if (!auth || !auth.currentUser) { // If firebase loaded but user not logged in, onAuthStateChanged will handle it.
                 if(dashboardWrapper) dashboardWrapper.classList.add('hidden');
                 if(homeContentDiv) homeContentDiv.classList.add('hidden');
                 if (authRedirectMessage) authRedirectMessage.classList.remove('hidden');
            }
        });
    </script>