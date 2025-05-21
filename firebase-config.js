async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.statusText}`);
    }
    const firebaseConfig = await response.json();

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully from remote config");

    // Make firebase services available globally or through a dedicated module
    window.auth = firebase.auth();
    window.db = firebase.firestore();

  } catch (error) {
    console.error("Error initializing Firebase:", error);
    // Display a user-friendly message on the page
    const body = document.querySelector('body');
    if (body) {
      const errorDiv = document.createElement('div');
      errorDiv.textContent = 'Could not load app configuration. Please try again later.';
      errorDiv.style.color = 'red';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.padding = '20px';
      body.insertBefore(errorDiv, body.firstChild);
    }
  }
}

initializeFirebase(); 