// Elements
const textInput = document.getElementById('textInput');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const paraCountEl = document.getElementById('paraCount');
const readTimeEl = document.getElementById('readTime');
const typingSpeedEl = document.getElementById('typingSpeed');
const typingStreakEl = document.getElementById('typingStreak');
const comboStreakEl = document.getElementById('comboStreak');
const progressBar = document.getElementById('progressBar');
const wordCloudContainer = document.getElementById('wordCloud');

const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');
const soundSelect = document.getElementById('soundSelect');
const soundIcon = document.getElementById('soundIcon');
const scrollTopBtn = document.getElementById('scrollTopBtn');

const footerQuote = document.getElementById('footerQuote');
const quoteText = document.getElementById('quoteText');

const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');

let typingSound = new Audio();
typingSound.volume = 0.12;

let soundEnabled = true;

soundIcon.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundIcon.textContent = '🔈';
    soundIcon.classList.remove('muted');
  } else {
    soundIcon.textContent = '🔇';
    soundIcon.classList.add('muted');
  }
});

// Sound options
const sounds = {
  none: null,
  click1: 'https://www.soundjay.com/mechanical/sounds/mechanical-keyboard-1.mp3',
  click2: 'https://www.soundjay.com/mechanical/sounds/mechanical-keyboard-2.mp3',
  typewriter: 'https://www.soundjay.com/typewriter/sounds/typewriter-key-1.mp3'
};

// Typing tracking
let startTime = null;
let lastInputTime = null;
let typingStreak = 0;
let comboStreak = 0;
let lastTypedTime = 0;
let lastWordCount = 0;

// Floating colorful animation on keypress
function getRandomColor() {
  const colors = ['#00ccff', '#0099ff', '#00ffff', '#66ccff', '#3399ff', '#33ccff', '#00dfff', '#33e0ff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createFloatingChar(char, x, y) {
  const span = document.createElement('span');
  span.textContent = char;
  span.className = 'floating-char';
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  span.style.color = getRandomColor();
  span.style.textShadow = `0 0 12px ${span.style.color}`;
  document.body.appendChild(span);
  setTimeout(() => span.remove(), 1600);
}

// Cursor trailing particles
document.body.addEventListener('mousemove', e => {
  const span = document.createElement('span');
  span.textContent = '✨';
  span.className = 'cursor-trail';
  span.style.left = e.pageX + 'px';
  span.style.top = e.pageY + 'px';
  document.body.appendChild(span);
  setTimeout(() => span.remove(), 1400);
});

// Update stats and UI
function updateStats() {
  const text = textInput.value;

  // Words count
  const wordsArray = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = wordsArray.length;
  wordCountEl.textContent = wordCount;

  // Characters count
  charCountEl.textContent = text.length;

  // Paragraphs count
  const paraCount = text.split(/\n+/).filter(p => p.trim().length > 0).length;
  paraCountEl.textContent = paraCount;

  // Read time (200 wpm average)
  const readTime = wordCount / 200;
  readTimeEl.textContent = readTime < 0.01 ? '0' : readTime.toFixed(2);

  // Typing speed
  if (!startTime) {
    typingSpeedEl.textContent = '0';
  } else {
    const now = new Date();
    const elapsedMinutes = (now - startTime) / 60000;
    const wpm = elapsedMinutes > 0 ? Math.round(wordCount / elapsedMinutes) : 0;
    typingSpeedEl.textContent = wpm > 999 ? '999+' : wpm;
    if (wpm < 10 && wordCount > 3) showTypeFasterPopup();
    else hideTypeFasterPopup();
  }

  // Progress bar
  const MAX_WORD_GOAL = 500;
  let progressPercent = Math.min((wordCount / MAX_WORD_GOAL) * 100, 100);
  progressBar.style.width = progressPercent + '%';

  // Word cloud update
  updateWordCloud(wordsArray);

  // Combo streak update
  updateComboStreak(wordCount);

  lastWordCount = wordCount;
}

// Word cloud with frequency
function updateWordCloud(words) {
  const freqMap = {};
  words.forEach(word => {
    const lower = word.toLowerCase();
    if (lower.length <= 2) return;
    freqMap[lower] = (freqMap[lower] || 0) + 1;
  });

  const sortedWords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  wordCloudContainer.innerHTML = '';
  sortedWords.forEach(([word, freq]) => {
    const span = document.createElement('span');
    span.textContent = `${word} (${freq})`;
    const size = 0.9 + Math.min(freq / 10, 1) * 0.9;
    span.style.fontSize = size + 'em';
    wordCloudContainer.appendChild(span);
  });
}

// Typing streak logic
function updateTypingStreak() {
  if (!startTime) return;
  const now = new Date();

  if (!lastInputTime) lastInputTime = now;

  const diffSec = (now - lastInputTime) / 1000;

  if (diffSec < 5) {
    typingStreak += diffSec;
  } else {
    typingStreak = 0;
    startTime = now;
  }
  lastInputTime = now;
  typingStreakEl.textContent = Math.floor(typingStreak);
}

// Combo streak logic - based on words typed continuously
function updateComboStreak(currentWordCount) {
  const now = Date.now();

  if (!lastTypedTime) lastTypedTime = now;

  if (currentWordCount > lastWordCount) {
    // If typed within 4 seconds of last input, increase combo
    if ((now - lastTypedTime) < 4000) {
      comboStreak++;
    } else {
      comboStreak = 1;
    }
    comboStreakEl.textContent = comboStreak;
    lastTypedTime = now;

    // Flash combo streak color on big combos
    if (comboStreak % 5 === 0) {
      comboStreakEl.classList.add('combo-flash');
      setTimeout(() => comboStreakEl.classList.remove('combo-flash'), 700);

      // Flash background for a moment
      flashBackground();
    }
  } else if (currentWordCount < lastWordCount) {
    comboStreak = 0;
    comboStreakEl.textContent = '0';
  }
}

// Flash background briefly
function flashBackground() {
  const body = document.body;
  body.style.transition = 'background 0.4s ease';
  body.style.background = 'linear-gradient(135deg, #ff00cc, #ff5500)';
  setTimeout(() => {
    body.style.background = 'linear-gradient(135deg, #12121f, #0f0c29, #302b63, #24243e)';
  }, 400);
}

// Play typing sound
function playTypingSound() {
  if (!soundEnabled) return;

  const selected = soundSelect.value;
  if (!selected || selected === 'none') return;

  typingSound.src = sounds[selected];
  typingSound.currentTime = 0;
  typingSound.play().catch(() => {});
}

// Copy text
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(textInput.value).then(() => {
    copyBtn.classList.add('copied');
    playConfetti();
    setTimeout(() => copyBtn.classList.remove('copied'), 1500);
  });
});

// Clear text
clearBtn.addEventListener('click', () => {
  textInput.value = '';
  updateStats();
  typingStreak = 0;
  comboStreak = 0;
  typingStreakEl.textContent = '0';
  comboStreakEl.textContent = '0';
});

// Save text as .txt
saveBtn.addEventListener('click', () => {
  const text = textInput.value;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SmartTextPro_Export_' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  saveBtn.classList.add('saved');
  playConfetti();
  setTimeout(() => saveBtn.classList.remove('saved'), 1500);
});

// Mode toggle
modeToggle.addEventListener('change', () => {
  if (modeToggle.checked) {
    document.body.classList.add('dark-mode');
    modeLabel.textContent = 'Dark Mode';
  } else {
    document.body.classList.remove('dark-mode');
    modeLabel.textContent = 'Light Mode';
  }
});

// Scroll to top button
window.addEventListener('scroll', () => {
  if (window.scrollY > 120) scrollTopBtn.classList.add('visible');
  else scrollTopBtn.classList.remove('visible');
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({top: 0, behavior: 'smooth'});
});

// Floating char on keypress
textInput.addEventListener('keypress', (e) => {
  if (!e.key || e.key.length > 1) return; // ignore non-char keys

  const rect = textInput.getBoundingClientRect();
  const x = rect.left + (Math.random() * rect.width);
  const y = rect.top + (Math.random() * rect.height / 3);

  createFloatingChar(e.key, x, y);

  playTypingSound();
});

// Update stats on input
textInput.addEventListener('input', () => {
  if (!startTime) startTime = new Date();

  updateStats();
  updateTypingStreak();
});

// Insert emoji on emoji button click
document.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.textContent;
    insertAtCursor(textInput, emoji);
    textInput.focus();
    updateStats();
  });
});

// Insert text at cursor position helper
function insertAtCursor(el, text) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const value = el.value;
  el.value = value.slice(0, start) + text + value.slice(end);
  el.selectionStart = el.selectionEnd = start + text.length;
}

// Typing "type faster" popup
const typeFasterPopup = document.createElement('div');
typeFasterPopup.id = 'typeFasterPopup';
typeFasterPopup.textContent = '⚡ Type Faster! ⚡';
document.body.appendChild(typeFasterPopup);

let typeFasterTimeout = null;

function showTypeFasterPopup() {
  if (typeFasterTimeout) return;
  typeFasterPopup.style.opacity = '1';
  typeFasterPopup.style.pointerEvents = 'auto';
  typeFasterTimeout = setTimeout(() => {
    hideTypeFasterPopup();
  }, 2000);
}

function hideTypeFasterPopup() {
  if (!typeFasterTimeout) return;
  typeFasterPopup.style.opacity = '0';
  typeFasterPopup.style.pointerEvents = 'none';
  clearTimeout(typeFasterTimeout);
  typeFasterTimeout = null;
}

// Confetti system

const confettiParticles = [];
const confettiColors = ['#00ffff', '#0099ff', '#00ccff', '#66ccff', '#33ccff', '#33e0ff', '#00dfff', '#33aaff'];

class ConfettiParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 10 + 8;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.speedX = (Math.random() - 0.5) * 7;
    this.speedY = Math.random() * -7 - 4;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.opacity = 1;
    this.gravity = 0.3;
  }
  update() {
    this.speedY += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    this.opacity -= 0.02;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size/3);
    ctx.restore();
  }
}

function playConfetti() {
  confettiCanvas.style.display = 'block';
  const rect = confettiCanvas.getBoundingClientRect();
  for (let i = 0; i < 80; i++) {
    confettiParticles.push(new ConfettiParticle(rect.width / 2, rect.height / 2));
  }
  if (!confettiRunning) {
    confettiRunning = true;
    requestAnimationFrame(runConfetti);
  }
}

let confettiRunning = false;

function runConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.update();
    p.draw(ctx);

    if (p.opacity <= 0) {
      confettiParticles.splice(i, 1);
    }
  }

  if (confettiParticles.length > 0) {
    requestAnimationFrame(runConfetti);
  } else {
    confettiCanvas.style.display = 'none';
    confettiRunning = false;
  }
}

// Resize confetti canvas on window resize
function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Random quotes for footer
const quotes = [
  "“Keep typing, keep shining!”",
  "“Every word counts, keep going!”",
  "“Your fingers create magic!”",
  "“Typing is a dance of thoughts.”",
  "“Turn ideas into words!”",
  "“The best stories start here.”",
  "“Words are power, wield them well.”",
];

function updateQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteText.textContent = quotes[randomIndex];
}

setInterval(updateQuote, 10000);
updateQuote();

// Initial update
updateStats();

