// === CONFIGURATION ===
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycby_Ary-TOCuTtRMSyPeAC7jcvsX8lY3tCY5QCNXFAPMfMN4TEPpLcqv5EMolYL8t4o/exec';

// === APP STATE ===
let questionsData = {};
let categoryIcons = {};
let dataLoaded = false;
let currentCategory = "";
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let totalQuestions = 0;
let shuffledQuestions = [];
let autoAdvanceTimer = null;
let hintUsed = false;

// === DOM ELEMENTS ===
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

// === UTILITY FUNCTIONS ===
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

// Normalize answer for comparison
function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

// === DATA FETCHING FUNCTIONS ===
async function fetchQuestionsFromSheet() {
  try {
    const response = await fetch(SHEET_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data from Google Sheet:', error);
    return null;
  }
}

function convertSheetDataToFormat(sheetData) {
  const categories = {};
  const icons = {};

  sheetData.forEach(item => {
    const category = item.category || item.Category;
    if (!categories[category]) {
      categories[category] = [];
      if (item.icon || item.Icon) {
        icons[category] = item.icon || item.Icon;
      }
    }
    categories[category].push({
      question: item.question || item.Question,
      answer: item.answer || item.Answer,
      hint: item.hint || item.Hint || ""
    });
  });

  const defaultIcons = {
    "Папы римские": "fas fa-church",
    "Герои мифологии": "fas fa-scroll",
    "Мировая литература": "fas fa-book-open",
    "Русская литература": "fas fa-book",
    "Американские президенты": "fas fa-flag-usa",
    "Русские правители": "fa-regular fa-chess-king",
    "Европейские правители": "fas fa-crown",
    "ОСД": "fas fa-book-skull",
    "Сложно для запоминания": "fa-brands fa-cloudversify",
    "Исторические личности": "fas fa-user-tie"
  };

  Object.keys(categories).forEach(cat => {
    if (!icons[cat] && defaultIcons[cat]) {
      icons[cat] = defaultIcons[cat];
    }
  });

  return { categories, icons };
}

// === QUIZ FUNCTIONS ===
function initCategories() {
  categoryGrid.innerHTML = "";

  if (!questionsData || Object.keys(questionsData).length === 0) {
    categoryGrid.innerHTML = '<div class="error">Нет доступных категорий</div>';
    return;
  }

  Object.keys(questionsData).forEach((category) => {
    const card = document.createElement("div");
    card.className = "category-card";
    const iconClass = categoryIcons[category] || "fas fa-question-circle";
    card.innerHTML = `
      <i class="${iconClass}"></i>
      <h3>${category}</h3>
      <p>${questionsData[category].length} вопросов</p>
    `;

    card.addEventListener("click", () => startQuiz(category));
    categoryGrid.appendChild(card);
  });
}

function startQuiz(category) {
  currentCategory = category;
  userAnswers = [];
  score = 0;

  shuffledQuestions = shuffleArray(questionsData[category]);
  totalQuestions = shuffledQuestions.length;
  currentQuestionIndex = 0;

  categoryScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  currentCategoryName.textContent = category;
  categoryIcon.className = categoryIcon.className.split(" ")[0] + " " + categoryIcons[category];
  totalQuestionsElement.textContent = totalQuestions;
  totalQuestionsElement2.textContent = totalQuestions;

  loadQuestion();
}

function loadQuestion() {
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

  hintUsed = false;
  hintText.textContent = "";
  hintText.classList.remove("visible");
  hintButton.disabled = false;
  hintButton.innerHTML = '<i class="fas fa-lightbulb"></i> Показать подсказку';

  currentQuestionNumber.textContent = currentQuestionIndex + 1;
  scoreElement.textContent = score;

  const progressPercent = (currentQuestionIndex / totalQuestions) * 100;
  progressFill.style.width = `${progressPercent}%`;

  submitButton.disabled = false;
}

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

function checkAnswer(userAnswer) {
  const correctAnswerText = shuffledQuestions[currentQuestionIndex].answer;
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswerText);
  return normalizedUserAnswer === normalizedCorrectAnswer;
}

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

function autoAdvance() {
  clearAutoAdvanceTimer();

  if (currentQuestionIndex < totalQuestions - 1) {
    currentQuestionIndex++;
    loadQuestion();
  } else {
    finishQuiz();
  }
}

function submitAnswer() {
  const userAnswer = answerInput.value.trim();

  if (!userAnswer) {
    feedback.className = "feedback wrong";
    feedback.textContent = "Пожалуйста, введите ответ";
    feedback.style.display = "block";
    return;
  }

  userAnswers[currentQuestionIndex] = userAnswer;

  const isCorrect = checkAnswer(userAnswer);
  if (isCorrect && !shuffledQuestions[currentQuestionIndex].answered) {
    score++;
    shuffledQuestions[currentQuestionIndex].answered = true;
  }

  showAnswerResult();

  answerInput.disabled = true;
  submitButton.disabled = true;
  hintButton.disabled = true;

  scoreElement.textContent = score;

  // Auto-advance after 2 seconds
  clearAutoAdvanceTimer();
  autoAdvanceTimer = setTimeout(() => autoAdvance(), 2000);
}

function finishQuiz() {
  clearAutoAdvanceTimer();

  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  finalScore.textContent = `${score}/${totalQuestions}`;

  const percentage = (score / totalQuestions) * 100;

  if (percentage >= 90) {
    resultMessage.textContent = "Отличный результат! Вы настоящий эксперт в этой теме!";
  } else if (percentage >= 70) {
    resultMessage.textContent = "Хороший результат! Вы хорошо разбираетесь в этой теме.";
  } else if (percentage >= 50) {
    resultMessage.textContent = "Неплохой результат! Есть куда стремиться.";
  } else {
    resultMessage.textContent = "Попробуйте ещё раз! Вы обязательно улучшите свой результат.";
  }
}

function restartQuiz() {
  clearAutoAdvanceTimer();
  shuffledQuestions.forEach((q) => (q.answered = false));
  resultScreen.classList.add("hidden");
  startQuiz(currentCategory);
}

function homePage() {
  clearAutoAdvanceTimer();

  if (shuffledQuestions.length > 0) {
    shuffledQuestions.forEach((q) => (q.answered = false));
  }

  resultScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  categoryScreen.classList.remove("hidden");

  answerInput.value = "";
  answerInput.className = "answer-input";
  answerInput.disabled = false;
  submitButton.disabled = false;

  shuffledQuestions = [];
}

// === INITIALIZATION ===
async function initializeApp() {
  categoryGrid.innerHTML = '<div class="loading">Загрузка вопросов...</div>';

  const sheetData = await fetchQuestionsFromSheet();

  if (sheetData && Array.isArray(sheetData) && sheetData.length > 0) {
    const converted = convertSheetDataToFormat(sheetData);
    questionsData = converted.categories;
    categoryIcons = converted.icons;
    dataLoaded = true;
    console.log('✅ Data loaded from Google Sheet');
    console.log(`📚 Loaded ${Object.keys(questionsData).length} categories with ${Object.values(questionsData).reduce((sum, q) => sum + q.length, 0)} total questions`);
  } else {
    try {
      const localData = await import('./questions.js');
      questionsData = localData.questionsData;
      categoryIcons = localData.categoryIcons;
      dataLoaded = true;
      console.log('⚠️ Using local questions.js as fallback');
    } catch (importError) {
      console.error('❌ Failed to load local questions:', importError);
      categoryGrid.innerHTML = '<div class="error">Не удалось загрузить вопросы. Пожалуйста, обновите страницу.</div>';
      return;
    }
  }

  initCategories();
}

// === EVENT LISTENERS ===
homeButton.addEventListener("click", homePage);
if (resultHomeButton) {
  resultHomeButton.addEventListener("click", homePage);
}
submitButton.addEventListener("click", submitAnswer);
restartButton.addEventListener("click", restartQuiz);
if (hintButton) {
  hintButton.addEventListener("click", showHint);
}

answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !answerInput.disabled) {
    submitAnswer();
  }
});

// === START THE APP ===
initializeApp();