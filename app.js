// ============================================
// Interactive Quiz App — Tugas Rutin 6
// DOM Selection, DOM Manipulation, Event Delegation, LocalStorage
// ============================================

// ---------- Data Soal (minimal 5 pertanyaan) ----------
const quizData = [
  {
    question: 'Apa kepanjangan dari DOM?',
    options: [
      'Document Object Model',
      'Data Object Management',
      'Document Oriented Markup',
      'Digital Object Model'
    ],
    correct: 0
  },
  {
    question: 'Method mana yang termasuk cara "modern" untuk memilih elemen dengan CSS selector?',
    options: [
      'getElementById()',
      'getElementsByClassName()',
      'querySelector()',
      'getElementsByTagName()'
    ],
    correct: 2
  },
  {
    question: 'Mengapa textContent lebih aman daripada innerHTML untuk menampilkan input dari user?',
    options: [
      'textContent lebih cepat diketik',
      'textContent mencegah eksekusi script (XSS)',
      'textContent otomatis menambahkan CSS',
      'Tidak ada bedanya, keduanya sama aman'
    ],
    correct: 1
  },
  {
    question: 'Apa keuntungan utama menggunakan event delegation?',
    options: [
      'Kode menjadi lebih panjang',
      'Setiap elemen wajib punya listener sendiri',
      'Hemat memory dan otomatis menangani elemen baru (dynamic)',
      'Hanya bekerja untuk event submit'
    ],
    correct: 2
  },
  {
    question: 'Method mana yang digunakan untuk membuat elemen HTML baru secara dinamis?',
    options: [
      'document.createElement()',
      'document.newElement()',
      'document.addElement()',
      'document.makeElement()'
    ],
    correct: 0
  },
  {
    question: 'Data seperti apa yang bisa langsung disimpan di LocalStorage tanpa konversi?',
    options: [
      'Object',
      'Array',
      'String',
      'Function'
    ],
    correct: 2
  },
  {
    question: 'Apa fungsi e.preventDefault() pada event submit form?',
    options: [
      'Menghapus form dari DOM',
      'Mencegah reload/refresh halaman default',
      'Mengirim data form dua kali',
      'Membatalkan seluruh JavaScript'
    ],
    correct: 1
  }
];

// ---------- State ----------
let currentQuestion = 0;
let score = 0;
let timer = null;
let timeLeft = 60;
const TIME_PER_QUESTION = 60; // 1 menit per soal
let playerName = '';
let playerNim = '';

// ---------- DOM Elements (DOM Selection) ----------
const startScreenEl = document.querySelector('#startScreen');
const playerNameInput = document.querySelector('#playerName');
const playerNimInput = document.querySelector('#playerNim');
const startBtn = document.querySelector('#startBtn');
const startErrorEl = document.querySelector('#startError');
const quizWrapperEl = document.querySelector('#quizWrapper');

const questionEl = document.querySelector('#question');
const optionsEl = document.querySelector('#options');
const nextBtn = document.querySelector('#nextBtn');
const progressEl = document.querySelector('#progress');
const progressBarEl = document.querySelector('#progressBar');
const timerEl = document.querySelector('#timer');
const resultEl = document.querySelector('#result');
const resultNameEl = document.querySelector('#resultName');
const scoreEl = document.querySelector('#score');
const highScoreEl = document.querySelector('#highScore');
const restartBtn = document.querySelector('#restartBtn');
const historyListEl = document.querySelector('#historyList');
const darkModeBtn = document.querySelector('#darkModeBtn');

const MAX_HISTORY = 10; // simpan 10 riwayat terbaru

// ============================================
// DATA DIRI — Layar awal sebelum quiz dimulai
// ============================================
startBtn.addEventListener('click', () => {
  const nameValue = playerNameInput.value.trim();

  if (nameValue === '') {
    startErrorEl.classList.remove('hidden');
    playerNameInput.focus();
    return;
  }

  startErrorEl.classList.add('hidden');
  playerName = nameValue;
  playerNim = playerNimInput.value.trim();

  // Reset state setiap mulai quiz baru
  currentQuestion = 0;
  score = 0;

  startScreenEl.classList.add('hidden');
  quizWrapperEl.classList.remove('hidden');
  resultEl.classList.add('hidden');

  renderQuestion();
});

// Bisa juga tekan Enter di kolom NIM untuk langsung mulai
playerNimInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startBtn.click();
});

// ============================================
// RENDER SOAL — DOM Manipulation (createElement + textContent)
// ============================================
function renderQuestion() {
  const q = quizData[currentQuestion];

  // Update progress text & progress bar (bonus fitur)
  progressEl.textContent = `Soal ${currentQuestion + 1}/${quizData.length}`;
  progressBarEl.style.width = `${((currentQuestion + 1) / quizData.length) * 100}%`;

  // textContent -> aman dari XSS, bukan innerHTML
  questionEl.textContent = q.question;

  // Kosongkan opsi lama, lalu buat elemen baru satu per satu
  optionsEl.innerHTML = '';
  q.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.textContent = option;               // textContent, bukan innerHTML
    btn.classList.add('option-btn');
    btn.dataset.index = index;               // dipakai untuk event delegation
    optionsEl.append(btn);
  });

  nextBtn.classList.add('hidden');
  startTimer();
}

// ============================================
// EVENT DELEGATION — satu listener untuk semua tombol jawaban
// ============================================
optionsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;                 // klik bukan di tombol jawaban -> abaikan

  handleAnswer(btn);
});

function handleAnswer(selectedBtn) {
  stopTimer();

  const allBtns = optionsEl.querySelectorAll('.option-btn');
  const selectedIndex = parseInt(selectedBtn.dataset.index, 10);
  const correctIndex = quizData[currentQuestion].correct;

  // Nonaktifkan semua tombol setelah dijawab
  allBtns.forEach((b) => (b.disabled = true));

  if (selectedIndex === correctIndex) {
    selectedBtn.classList.add('correct');   // Feedback visual: hijau
    score++;
  } else {
    selectedBtn.classList.add('wrong');     // Feedback visual: merah
    // Tunjukkan juga jawaban yang benar
    allBtns[correctIndex].classList.add('correct');
  }

  nextBtn.classList.remove('hidden');
}

// ============================================
// NAVIGASI SPA (tanpa reload halaman)
// ============================================
nextBtn.addEventListener('click', () => {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

// ============================================
// TIMER PER SOAL (bonus)
// ============================================
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
  timeLeft = TIME_PER_QUESTION;
  timerEl.textContent = `⏱️ ${formatTime(timeLeft)}`;
  timerEl.classList.remove('warning');

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏱️ ${formatTime(timeLeft)}`;

    if (timeLeft <= 10) {
      timerEl.classList.add('warning');
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoSkip();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function autoSkip() {
  // Waktu habis: tandai semua salah, tampilkan jawaban benar, lanjut otomatis
  const allBtns = optionsEl.querySelectorAll('.option-btn');
  const correctIndex = quizData[currentQuestion].correct;
  allBtns.forEach((b) => (b.disabled = true));
  if (allBtns[correctIndex]) allBtns[correctIndex].classList.add('correct');
  nextBtn.classList.remove('hidden');
}

// ============================================
// HASIL & LOCALSTORAGE — High Score
// ============================================
function showResult() {
  stopTimer();

  const total = quizData.length;
  const percentage = Math.round((score / total) * 100);

  resultNameEl.textContent = playerNim ? `${playerName} (${playerNim})` : playerName;
  scoreEl.textContent = `${score}/${total} (${percentage}%)`;

  // Baca high score lama dari LocalStorage (data hanya string -> parseInt)
  const savedHighScore = parseInt(localStorage.getItem('quizHighScore'), 10) || 0;

  if (percentage > savedHighScore) {
    localStorage.setItem('quizHighScore', percentage);
    highScoreEl.textContent = `${percentage}% 🎉 Rekor Baru!`;
  } else {
    highScoreEl.textContent = `${savedHighScore}%`;
  }

  saveHistory(percentage, total);
  renderHistory();

  quizWrapperEl.classList.add('hidden');
  resultEl.classList.remove('hidden');
}

// ============================================
// RIWAYAT PERCOBAAN — disimpan di LocalStorage (object → JSON string)
// ============================================
function saveHistory(percentage, total) {
  const history = JSON.parse(localStorage.getItem('quizHistory')) || [];

  const entry = {
    name: playerName,
    nim: playerNim,
    score: score,
    total: total,
    percentage: percentage,
    date: new Date().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  };

  // Riwayat terbaru ditaruh paling atas, batasi maksimal MAX_HISTORY
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

  localStorage.setItem('quizHistory', JSON.stringify(history));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('quizHistory')) || [];

  historyListEl.innerHTML = '';

  if (history.length === 0) {
    const emptyEl = document.createElement('li');
    emptyEl.classList.add('history-empty');
    emptyEl.textContent = 'Belum ada riwayat percobaan.';
    historyListEl.append(emptyEl);
    return;
  }

  history.forEach((entry, index) => {
    const item = document.createElement('li');
    item.classList.add('history-item');
    if (index === 0) item.classList.add('is-latest');

    const infoWrap = document.createElement('div');

    const nameEl = document.createElement('div');
    nameEl.classList.add('history-name');
    nameEl.textContent = entry.nim ? `${entry.name} (${entry.nim})` : entry.name;

    const metaEl = document.createElement('div');
    metaEl.classList.add('history-meta');
    metaEl.textContent = entry.date;

    infoWrap.append(nameEl, metaEl);

    const scoreWrap = document.createElement('div');
    scoreWrap.classList.add('history-score');
    scoreWrap.textContent = `${entry.score}/${entry.total} (${entry.percentage}%)`;

    item.append(infoWrap, scoreWrap);
    historyListEl.append(item);
  });
}

// ============================================
// RESTART QUIZ — kembali ke layar data diri
// ============================================
restartBtn.addEventListener('click', () => {
  currentQuestion = 0;
  score = 0;

  resultEl.classList.add('hidden');
  quizWrapperEl.classList.add('hidden');
  startScreenEl.classList.remove('hidden');

  // Nama & NIM tetap terisi biar gampang kalau mau ulang sebagai orang yang sama
  playerNameInput.value = playerName;
  playerNimInput.value = playerNim;
  startErrorEl.classList.add('hidden');
  playerNameInput.focus();
});

// ============================================
// DARK MODE TOGGLE (bonus)
// ============================================
darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  darkModeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// ============================================
// INISIALISASI
// ============================================
// Quiz baru dimulai setelah user mengisi Data Diri (lihat listener startBtn di atas).
// Tidak ada renderQuestion() otomatis di sini.