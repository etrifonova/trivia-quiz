import { questionsData, categoryIcons } from './questions.js';

// App state
let currentCategory = "";
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let totalQuestions = 0;
let shuffledQuestions = []; // Store shuffled questions for current game
let autoAdvanceTimer = null; // Timer for auto-advancement
let hintUsed = false; // Track if hint was used for current question

// DOM elements
const categoryScreen = document.getElementById("categoryScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const categoryGrid = document.getElementById("categoryGrid");
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const feedback = document.getElementById("feedback");
const correctAnswer = document.getElementById("correctAnswer");
const currentQuestionNumber = document.getElementById("currentQuestionNumber");
const totalQuestionsElement = document.getElementById("totalQuestions");
const totalQuestionsElement2 = document.getElementById("totalQuestions2");
const scoreElement = document.getElementById("score");
const progressFill = document.getElementById("progressFill");
const currentCategoryName = document.getElementById("currentCategoryName");
const categoryIcon = document.getElementById("categoryIcon");
const homeButton = document.getElementById("homeButton");
const submitButton = document.getElementById("submitButton");
const finalScore = document.getElementById("finalScore");
const resultMessage = document.getElementById("resultMessage");
const restartButton = document.getElementById("restartButton");
const resultHomeButton = document.getElementById("resultHomeButton");
const hintButton = document.getElementById("hintButton");
const hintText = document.getElementById("hintText");

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Clear auto-advance timer
function clearAutoAdvanceTimer() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

// Initialize categories
function initCategories() {
  categoryGrid.innerHTML = "";

  Object.keys(questionsData).forEach((category) => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.innerHTML = `
                    <i class="${categoryIcons[category]}"></i>
                    <h3>${category}</h3>
                    <p>${questionsData[category].length} вопросов</p>
                `;

    card.addEventListener("click", () => startQuiz(category));
    categoryGrid.appendChild(card);
  });
}

// Start quiz with selected category
function startQuiz(category) {
  currentCategory = category;
  currentQuestionIndex = 0;
  userAnswers = [];
  score = 0;

  // Shuffle questions for this game
  shuffledQuestions = shuffleArray(questionsData[category]);
  totalQuestions = shuffledQuestions.length;

  // Update UI
  categoryScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  currentCategoryName.textContent = category;
  categoryIcon.className = categoryIcon.className.split(" ")[0] + " " + categoryIcons[category];
  totalQuestionsElement.textContent = totalQuestions;
  totalQuestionsElement2.textContent = totalQuestions;

  loadQuestion();
}

// Load current question
function loadQuestion() {
  // Clear any pending auto-advance timer
  clearAutoAdvanceTimer();

  const question = shuffledQuestions[currentQuestionIndex];

  questionText.textContent = question.question;
  answerInput.value = userAnswers[currentQuestionIndex] || "";
  answerInput.className = "answer-input";
  answerInput.disabled = false;
  answerInput.focus();

  feedback.className = "feedback";
  feedback.textContent = "";
  correctAnswer.textContent = "";

  // Reset hint
  hintUsed = false;
  hintText.textContent = "";
  hintText.classList.remove("visible");
  hintButton.disabled = false;
  hintButton.innerHTML = '<i class="fas fa-lightbulb"></i> Показать подсказку';

  currentQuestionNumber.textContent = currentQuestionIndex + 1;
  scoreElement.textContent = score;

  // Update progress bar
  const progressPercent = (currentQuestionIndex / totalQuestions) * 100;
  progressFill.style.width = `${progressPercent}%`;

  // Enable submit button
  submitButton.disabled = false;
}

// Show hint for current question
function showHint() {
  if (!hintUsed) {
    const question = shuffledQuestions[currentQuestionIndex];
    if (question.hint) {
      hintText.textContent = question.hint;
      hintText.classList.add("visible");
      hintButton.disabled = true;
      hintButton.innerHTML = '<i class="fas fa-lightbulb"></i> Подсказка использована';
      hintUsed = true;
    } else {
      hintText.textContent = "Для этого вопроса нет подсказки";
      hintText.classList.add("visible");
      setTimeout(() => {
        hintText.classList.remove("visible");
      }, 2000);
    }
  }
}

// Normalize answer for comparison
function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

// Check if answer is correct
function checkAnswer(userAnswer) {
  const correctAnswerText = shuffledQuestions[currentQuestionIndex].answer;
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswerText);

  return normalizedUserAnswer === normalizedCorrectAnswer;
}

// Show answer result
function showAnswerResult() {
  const userAnswer = userAnswers[currentQuestionIndex];
  const correctAnswerText = shuffledQuestions[currentQuestionIndex].answer;
  const isCorrect = checkAnswer(userAnswer);

  if (isCorrect) {
    answerInput.className = "answer-input correct";
    feedback.className = "feedback correct";
    feedback.textContent = "Правильно! ✓";
  } else {
    answerInput.className = "answer-input wrong";
    feedback.className = "feedback wrong";
    feedback.textContent = "Неправильно! ✗";
    correctAnswer.innerHTML = `Правильный ответ: <strong>${correctAnswerText}</strong>`;
  }
}

// Auto-advance to next question
function autoAdvance() {
  clearAutoAdvanceTimer();

  if (currentQuestionIndex < totalQuestions - 1) {
    // Move to next question
    currentQuestionIndex++;
    loadQuestion();
  } else {
    // Finish the quiz
    finishQuiz();
  }
}

// Submit answer
function submitAnswer() {
  const userAnswer = answerInput.value.trim();

  if (!userAnswer) {
    feedback.className = "feedback wrong";
    feedback.textContent = "Пожалуйста, введите ответ";
    feedback.style.display = "block";
    return;
  }

  // Store answer
  userAnswers[currentQuestionIndex] = userAnswer;

  // Check if correct and update score
  const isCorrect = checkAnswer(userAnswer);
  if (isCorrect && !shuffledQuestions[currentQuestionIndex].answered) {
    score++;
    shuffledQuestions[currentQuestionIndex].answered = true;
  }

  // Show result
  showAnswerResult();

  // Update UI
  answerInput.disabled = true;
  submitButton.disabled = true;
  hintButton.disabled = true; // Disable hint button after answer is submitted

  // Update score display
  scoreElement.textContent = score;

  // Set timer for auto-advancement (2 seconds)
  clearAutoAdvanceTimer();
  autoAdvanceTimer = setTimeout(() => autoAdvance(), 2000);
}

// Finish quiz and show results
function finishQuiz() {
  clearAutoAdvanceTimer();

  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  finalScore.textContent = `${score}/${totalQuestions}`;

  // Calculate percentage
  const percentage = (score / totalQuestions) * 100;

  // Set result message based on score
  if (percentage >= 90) {
    resultMessage.textContent =
      "Отличный результат! Вы настоящий эксперт в этой теме!";
  } else if (percentage >= 70) {
    resultMessage.textContent =
      "Хороший результат! Вы хорошо разбираетесь в этой теме.";
  } else if (percentage >= 50) {
    resultMessage.textContent = "Неплохой результат! Есть куда стремиться.";
  } else {
    resultMessage.textContent =
      "Попробуйте ещё раз! Вы обязательно улучшите свой результат.";
  }
}

// Restart quiz
function restartQuiz() {
  clearAutoAdvanceTimer();

  // Reset answered flags in shuffled questions
  shuffledQuestions.forEach((q) => (q.answered = false));

  resultScreen.classList.add("hidden");

  // Start a new game with the same category but reshuffled questions
  startQuiz(currentCategory);
}

// Return to homepage
function homePage() {
  clearAutoAdvanceTimer();

  // Reset answered flags in shuffled questions
  if (shuffledQuestions.length > 0) {
    shuffledQuestions.forEach((q) => (q.answered = false));
  }

  resultScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  categoryScreen.classList.remove("hidden");

  // Reset input
  answerInput.value = "";
  answerInput.className = "answer-input";
  answerInput.disabled = false;
  submitButton.disabled = false;

  // Clear shuffled questions
  shuffledQuestions = [];
}

// Event listeners
homeButton.addEventListener("click", homePage);
if (resultHomeButton) {
  resultHomeButton.addEventListener("click", homePage);
}
submitButton.addEventListener("click", submitAnswer);
restartButton.addEventListener("click", restartQuiz);
if (hintButton) {
  hintButton.addEventListener("click", showHint);
}

// Enter key to submit answer
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !answerInput.disabled) {
    submitAnswer();
  }
});

// Initialize the app
initCategories();