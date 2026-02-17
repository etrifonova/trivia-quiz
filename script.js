import { questionsData, categoryIcons } from './questions.js';

// App state
let currentCategory = "";
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let totalQuestions = 0;

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
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const finalScore = document.getElementById("finalScore");
const resultMessage = document.getElementById("resultMessage");
const restartButton = document.getElementById("restartButton");

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
  totalQuestions = questionsData[category].length;

  // Update UI
  categoryScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  currentCategoryName.textContent = category;
  categoryIcon.className =
    categoryIcon.className.split(" ")[0] + " " + categoryIcons[category];
  totalQuestionsElement.textContent = totalQuestions;
  totalQuestionsElement2.textContent = totalQuestions;

  loadQuestion();
}

// Load current question
function loadQuestion() {
  const question = questionsData[currentCategory][currentQuestionIndex];

  questionText.textContent = question.question;
  answerInput.value = userAnswers[currentQuestionIndex] || "";
  answerInput.className = "answer-input";
  answerInput.disabled = userAnswers[currentQuestionIndex] !== undefined;
  answerInput.focus();

  feedback.className = "feedback";
  feedback.textContent = "";
  correctAnswer.textContent = "";

  currentQuestionNumber.textContent = currentQuestionIndex + 1;
  scoreElement.textContent = score;

  // Update progress bar
  const progressPercent = (currentQuestionIndex / totalQuestions) * 100;
  progressFill.style.width = `${progressPercent}%`;

  // Update navigation buttons
  prevButton.disabled = currentQuestionIndex === 0;

  // Show/hide submit/next buttons
  if (userAnswers[currentQuestionIndex] !== undefined) {
    submitButton.classList.add("hidden");
    nextButton.classList.remove("hidden");
    showAnswerResult();
  } else {
    submitButton.classList.remove("hidden");
    nextButton.classList.add("hidden");
  }

  // Hide next button on last question
  if (
    currentQuestionIndex === totalQuestions - 1 &&
    userAnswers[currentQuestionIndex] !== undefined
  ) {
    nextButton.textContent = "Завершить";
  } else {
    nextButton.textContent = "Следующий";
  }
}

// Normalize answer for comparison
function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

// Check if answer is correct
function checkAnswer(userAnswer) {
  const correctAnswerText =
    questionsData[currentCategory][currentQuestionIndex].answer;
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswerText);

  return normalizedUserAnswer === normalizedCorrectAnswer;
}

// Show answer result
function showAnswerResult() {
  const userAnswer = userAnswers[currentQuestionIndex];
  const correctAnswerText =
    questionsData[currentCategory][currentQuestionIndex].answer;
  const isCorrect = checkAnswer(userAnswer);

  if (isCorrect) {
    answerInput.className = "answer-input correct";
    feedback.className = "feedback correct";
    feedback.textContent = "Правильно!";
  } else {
    answerInput.className = "answer-input wrong";
    feedback.className = "feedback wrong";
    feedback.textContent = "Неправильно!";
    correctAnswer.innerHTML = `Правильный ответ: <strong>${correctAnswerText}</strong>`;
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
  if (
    isCorrect &&
    !questionsData[currentCategory][currentQuestionIndex].answered
  ) {
    score++;
    questionsData[currentCategory][currentQuestionIndex].answered = true;
  }

  // Show result
  showAnswerResult();

  // Update UI
  answerInput.disabled = true;
  submitButton.classList.add("hidden");

  // Show next button or finish button
  if (currentQuestionIndex === totalQuestions - 1) {
    nextButton.textContent = "Завершить";
  }
  nextButton.classList.remove("hidden");
}

// Go to next question
function nextQuestion() {
  if (currentQuestionIndex < totalQuestions - 1) {
    currentQuestionIndex++;
    loadQuestion();
  } else {
    finishQuiz();
  }
}

// Go to previous question
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
}

// Finish quiz and show results
function finishQuiz() {
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
  // Reset answered flags
  questionsData[currentCategory].forEach((q) => (q.answered = false));

  resultScreen.classList.add("hidden");
  categoryScreen.classList.remove("hidden");

  // Reset input
  answerInput.value = "";
  answerInput.className = "answer-input";
  answerInput.disabled = false;
}

// Restart quiz
function homePage() {
  // Reset answered flags
  questionsData[currentCategory].forEach((q) => (q.answered = false));

  resultScreen.classList.add("hidden");
  categoryScreen.classList.remove("hidden");
  quizScreen.classList.add("hidden");

  // Reset input
  answerInput.value = "";
  answerInput.className = "answer-input";
  answerInput.disabled = false;
}

// Event listeners
homeButton.addEventListener("click", homePage);
submitButton.addEventListener("click", submitAnswer);
prevButton.addEventListener("click", prevQuestion);
nextButton.addEventListener("click", nextQuestion);
restartButton.addEventListener("click", restartQuiz);

// Enter key to submit answer
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !answerInput.disabled) {
    submitAnswer();
  }
});

// Initialize the app
initCategories();
