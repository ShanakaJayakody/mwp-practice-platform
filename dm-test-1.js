// Extracted JavaScript from DM Test 1.html
// This script should be linked in DM Test 1.html with <script type="module" src="dm-test-1.js"></script>

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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

const urlParams = new URLSearchParams(window.location.search);
const reviewParam = urlParams.get("review");

auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user.displayName, user.email);
    } else {
        console.log("No user is logged in");
    }
});

window.startTest = function() {
    if (auth.currentUser) {
        userName = auth.currentUser.displayName || auth.currentUser.email || "";
        userEmail = auth.currentUser.email || "";
    } else {
        userName = "";
        userEmail = "";
    }
    userGoal = document.getElementById("goal").value.trim();
    userFocusArea = document.getElementById("focus-area").value.trim();
    timeLeft = 17 * 60;
    userAnswers = new Array(passageTexts.length).fill(null).map(() => new Array(5).fill(null));
    questionTimes = new Array(passageTexts.length).fill(0);
    flaggedQuestions = new Array(passageTexts.length).fill(false);
    questionStartTime = null;
    currentQuestionIndex = 0;
    isReviewingFromResults = false;
    isFilteringFlagged = false;
    practiceSessionEndTime = null;
    showPracticeSessionScreen();
    startTimer();
    loadQuestion(0);
    populateNavigator();
};

let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let timeLeft = 17 * 60;
let practiceSessionStartTime;
let practiceSessionEndTime;
let userName = "";
let userEmail = "";
let userGoal = "";
let userFocusArea = "";
let isReviewingFromResults = false;
let questionStartTime = null;
let questionTimes = [];
let flaggedQuestions = [];
let isFilteringFlagged = false;
const score = 0;
const maxScore = 32;

const calcCurrentInput = "0";
const calcPreviousInput = "";
const calcOperator = null;
const calcMemory = 0;
const calcShouldResetDisplay = false;
const calcMrcPressedOnce = false;
const isDraggingCalculator = false;
let calculatorOffsetX, calculatorOffsetY;
const isSubmittingReflection = false;

const appContainer = document.getElementById("app-container");
const setupScreen = document.getElementById("setup-screen");
const practiceSessionScreen = document.getElementById("practice-session-screen");
const reviewScreen = document.getElementById("review-screen");
const resultsScreen = document.getElementById("results-screen");
const navigatorModal = document.getElementById("navigator-modal");
const startButton = document.getElementById("start-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const navigatorButton = document.getElementById("navigator-button");
const closeModalButton = document.getElementById("close-modal-button");
const endPracticeSessionButton = document.getElementById("end-practice-session-button");
const endPracticeSessionButtonFooter = document.getElementById("end-practice-session-button-footer");
const backToResultsButton = document.getElementById("back-to-results-button");
const flagButton = document.getElementById("flag-button");
const questionNumberInfoEl = document.getElementById("question-number-info");
const timerEl = document.getElementById("timer");
const reviewGrid = document.getElementById("review-grid");
const navigatorGrid = document.getElementById("navigator-grid");
const scoreEl = document.getElementById("score");
const totalQuestionsResultsEl = document.getElementById("total-questions-results");
const timeTakenEl = document.getElementById("time-taken");
const resultsDetailsGrid = document.getElementById("results-details-grid");
const goalInput = document.getElementById("goal");
const focusAreaInput = document.getElementById("focus-area");
const practiceSessionTitleEl = document.getElementById("practice-session-title");
const filterFlaggedButton = document.getElementById("filter-flagged-button");
const setupQuestionCountEl = document.getElementById("setup-question-count");
const setupTimeLimitEl = document.getElementById("setup-time-limit");
const reflectionText = document.getElementById("reflection-text");
const downloadPdfButton = document.getElementById("download-pdf-button");
const focusRatingInput = document.getElementById("focus-rating");
const calculatorToggleButton = document.getElementById("calculator-toggle-button");
const calculatorUI = document.getElementById("calculator-ui");
const calcDisplay = document.getElementById("calc-display");
const calcButtons = document.querySelectorAll(".calc-button");
const closeCalculatorButton = document.getElementById("close-calculator-button");
const calculatorDragHeader = document.getElementById("calculator-drag-header");
const setupMaxScoreEl = document.getElementById("setup-max-score");

// ... (rest of the code from <script> in DM Test 1.html should be appended here)
