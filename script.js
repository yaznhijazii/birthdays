const questions = [
    {
        question: "What is Nisreen's absolute favorite way to start the day?",
        options: ["A strong cup of coffee", "Yoga and meditation", "Hitting the snooze button 5 times", "A brisk morning run"],
        correctIndex: 0,
        funFact: "She literally cannot function without her morning coffee. It's science."
    },
    {
        question: "If Nisreen could only eat one food for the rest of her life, what would it be?",
        options: ["Pizza", "Sushi", "Pasta", "Tacos"],
        correctIndex: 1,
        funFact: "Sushi is life. She knows all the best spots in town."
    },
    {
        question: "What's her go-to karaoke song?",
        options: ["Bohemian Rhapsody", "I Will Survive", "Wannabe by Spice Girls", "She refuses to do karaoke"],
        correctIndex: 3,
        funFact: "You will never catch her on stage with a mic. Ever."
    },
    {
        question: "How does Nisreen usually spend her weekends?",
        options: ["Binge-watching Netflix", "Hiking in nature", "Trying new restaurants", "Reading a good book"],
        correctIndex: 2,
        funFact: "She's an undercover food critic. Always finding the best hidden gems."
    },
    {
        question: "What's her biggest pet peeve?",
        options: ["Loud chewers", "People being late", "Slow Wi-Fi", "Typos in emails"],
        correctIndex: 1,
        funFact: "Time is money! Being 5 minutes late is basically a crime in her book."
    },
    {
        question: "If Nisreen won the lottery, what's the first thing she'd buy?",
        options: ["A private island", "A luxury car", "First-class tickets around the world", "A lifetime supply of coffee"],
        correctIndex: 2,
        funFact: "She has a travel bucket list a mile long. Next stop: everywhere."
    },
    {
        question: "What was her dream job as a kid?",
        options: ["Astronaut", "Veterinarian", "Pop star", "Teacher"],
        correctIndex: 1,
        funFact: "She used to try and rescue every stray animal she saw."
    },
    {
        question: "Which of these perfectly describes her working style?",
        options: ["Organized chaos", "To-do lists for everything", "Last-minute panic", "Zen and focused"],
        correctIndex: 1,
        funFact: "Her planner has a planner. The color-coding system is legendary."
    },
    {
        question: "What is her secret hidden talent?",
        options: ["Juggling", "Speaking a 3rd language", "Baking incredible cakes", "Remembering movie quotes"],
        correctIndex: 3,
        funFact: "She can recite entire movies word-for-word. It's slightly terrifying."
    },
    {
        question: "Finally, how does she feel about celebrating her birthday?",
        options: ["Hates the attention", "Loves a massive party", "Prefers a quiet dinner", "Expects a week-long festival"],
        correctIndex: 3,
        funFact: "It's not just a birth-day, it's a birth-week!"
    }
];

// ─── Supabase Configuration ───────────────────────────────────────────────────
const SUPABASE_URL = "https://cumnxlwdmxsstklxitqq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bW54bHdkbXhzc3RrbHhpdHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDM3MjMsImV4cCI6MjA5Nzc3OTcyM30.kKkJ7TSnqhzLCnP-ri9AebIvt68o7H59_a9DfVWYg6w";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Admin Credentials (client-side only — not real auth) ────────────────────
const ADMIN_EMAIL    = "nisreen@birthday.com";
const ADMIN_PASSWORD = "123456";

// ─── Game State ───────────────────────────────────────────────────────────────
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let isMultiplayer = false;
let isHost = false;
let roomCode = "";
let playerName = "";
let playersList = [];
let channel = null;
let leaderboardChannel = null;
let dashboardChannel = null;
let isGameActive = false;
let hasSelectedOption = false;
let lastSelectedOptionIndex = -1;
let hasRevealedCurrentQuestion = false;

let timerInterval = null;
let timeLeft = 30;
const TIMER_LIMIT = 30;

// ─── DOM References ───────────────────────────────────────────────────────────
const startScreen    = document.getElementById('start-screen');
const loginScreen    = document.getElementById('login-screen');
const dashboardScreen= document.getElementById('dashboard-screen');
const lobbyScreen    = document.getElementById('lobby-screen');
const questionScreen = document.getElementById('question-screen');
const scoreScreen    = document.getElementById('score-screen');

// ─── Event Listeners ──────────────────────────────────────────────────────────
// Home Screen
document.getElementById('go-message-btn').addEventListener('click', () => showScreen('message-screen'));
document.getElementById('go-quiz-btn').addEventListener('click', () => showScreen('start-screen'));

// Message Screen
document.getElementById('send-standalone-message-btn').addEventListener('click', sendStandaloneMessage);

// Quiz flow
document.getElementById('create-room-btn').addEventListener('click', createRoom);
document.getElementById('join-room-btn').addEventListener('click', joinRoom);
document.getElementById('lobby-start-btn').addEventListener('click', lobbyStartGame);
document.getElementById('next-btn').addEventListener('click', handleNext);
document.getElementById('replay-btn').addEventListener('click', restartQuiz);
document.getElementById('share-btn').addEventListener('click', copyResult);

// Admin / Login
document.getElementById('go-to-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('login-screen');
});
document.getElementById('do-login-btn').addEventListener('click', doLogin);
document.getElementById('cancel-login-btn').addEventListener('click', () => showScreen('home-screen'));
document.getElementById('logout-btn').addEventListener('click', () => {
    cleanupDashboard();
    showScreen('home-screen');
});

// Birthday Card Flip
const birthdayCard = document.getElementById('birthday-card');
if (birthdayCard) {
    birthdayCard.addEventListener('click', () => birthdayCard.classList.toggle('flipped'));
}

// ─── Screen Navigation ──────────────────────────────────────────────────────────
const BLOCK_SCREENS = new Set(['score-screen', 'dashboard-screen']);
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
        s.style.display = '';
    });
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    el.classList.add('active');
    if (BLOCK_SCREENS.has(id)) el.style.display = 'block';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.querySelector('span').textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
function doLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass  = document.getElementById('login-password').value;
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
        showScreen('dashboard-screen');
        loadDashboard();
    } else {
        showToast("Wrong email or password!");
    }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
    await fetchDashboardMessages();
    await fetchDashboardRooms();
    subscribeDashboard();
}

async function fetchDashboardMessages() {
    const { data, error } = await client
        .from('quiz_messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error && data) renderDashboardMessages(data);
}

function renderDashboardMessages(messages) {
    const container = document.getElementById('dashboard-messages-list');
    const countEl   = document.getElementById('dashboard-message-count');
    container.innerHTML = '';
    countEl.textContent = messages.length;

    if (messages.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; font-weight:600;">No messages yet...</p>`;
        return;
    }

    messages.forEach(msg => {
        const time = new Date(msg.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
        const card = document.createElement('div');
        card.className = 'message-card';
        card.innerHTML = `
            <div class="message-card-header">
                <span class="msg-sender" style="color: #a5b4fc;">${escapeHtml(msg.player_name)}</span>
                <span class="msg-room" style="color: var(--text-muted);">Room: ${msg.room_code} · ${time}</span>
            </div>
            <p class="msg-text">${escapeHtml(msg.message)}</p>
        `;
        container.appendChild(card);
    });
}

async function fetchDashboardRooms() {
    const { data: rooms, error } = await client
        .from('quiz_rooms')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !rooms) return;

    const container = document.getElementById('dashboard-rooms-list');
    container.innerHTML = '';

    if (rooms.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; font-weight:600;">No rooms created yet.</p>`;
        return;
    }

    for (const room of rooms) {
        // Fetch scores for this room
        const { data: scores } = await client
            .from('quiz_scores')
            .select('player_name, score')
            .eq('room_code', room.room_code)
            .order('score', { ascending: false });

        const row = document.createElement('div');
        row.className = 'dashboard-room-row';

        const scoresHtml = scores && scores.length > 0
            ? scores.map((s, i) => `
                <div style="display:flex; justify-content: space-between; font-size:13px; font-weight:600; color:var(--text-secondary); padding: 4px 0; border-bottom: 1px solid var(--border-color);">
                    <span>${i + 1}. ${escapeHtml(s.player_name)}</span>
                    <span style="color:var(--primary);">${s.score}/${questions.length}</span>
                </div>
            `).join('')
            : `<p style="color:var(--text-muted); font-size:12px;">No scores recorded yet.</p>`;

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:800; font-size:18px; letter-spacing:1px;">${room.room_code}</span>
                <span class="room-status-badge ${room.status}">${room.status}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">${scoresHtml}</div>
        `;
        container.appendChild(row);
    }
}

function subscribeDashboard() {
    cleanupDashboard();

    dashboardChannel = client.channel('dashboard_live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_messages' }, async () => {
            await fetchDashboardMessages();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_scores' }, async () => {
            await fetchDashboardRooms();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_rooms' }, async () => {
            await fetchDashboardRooms();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_rooms' }, async () => {
            await fetchDashboardRooms();
        })
        .subscribe();
}

function cleanupDashboard() {
    if (dashboardChannel) {
        dashboardChannel.unsubscribe();
        dashboardChannel = null;
    }
}

// ─── Standalone Message (Message Screen) ─────────────────────────────────────
async function sendStandaloneMessage() {
    const nameInput = document.getElementById('msg-sender-name');
    const bodyInput = document.getElementById('msg-body');
    const name = nameInput.value.trim();
    const msg  = bodyInput.value.trim();

    if (!name) { showToast('Please enter your name!'); return; }
    if (!msg)  { showToast('Please write a message!'); return; }

    const btn = document.getElementById('send-standalone-message-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const { error } = await client
        .from('quiz_messages')
        .insert([{ room_code: 'message', player_name: name, message: msg }]);

    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Send Message`;

    if (error) {
        showToast('Failed to send. Try again.');
        console.error(error);
        return;
    }

    btn.classList.add('hidden');
    document.getElementById('message-sent-success').classList.remove('hidden');
    bodyInput.value = '';
    nameInput.value = '';
}

// ─── Room Utilities ───────────────────────────────────────────────────────────
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Create Room ──────────────────────────────────────────────────────────────
async function createRoom() {
    playerName = document.getElementById('player-name-input').value.trim();
    if (!playerName) { showToast("Please enter your name first!"); return; }

    isHost      = true;
    isMultiplayer = true;
    roomCode    = generateRoomCode();

    const { error } = await client.from('quiz_rooms').insert([{ room_code: roomCode, status: 'lobby' }]);
    if (error) { showToast("Failed to create room. Please try again."); console.error(error); return; }

    document.getElementById('lobby-code-display').textContent = roomCode;
    document.getElementById('host-controls').classList.remove('hidden');
    document.getElementById('player-waiting-msg').classList.add('hidden');

    showScreen('lobby-screen');
    await connectToRoom(roomCode);
}

// ─── Join Room ────────────────────────────────────────────────────────────────
async function joinRoom() {
    playerName = document.getElementById('player-name-input').value.trim();
    const code = document.getElementById('room-code-input').value.trim().toUpperCase();

    if (!playerName) { showToast("Please enter your name first!"); return; }
    if (code.length !== 4) { showToast("Please enter a valid 4-letter room code!"); return; }

    const { data, error } = await client.from('quiz_rooms').select('*').eq('room_code', code).single();
    if (error || !data) { showToast("Room not found!"); return; }
    if (data.status !== 'lobby') { showToast("Game has already started in this room!"); return; }

    isHost        = false;
    isMultiplayer = true;
    roomCode      = code;

    document.getElementById('lobby-code-display').textContent = roomCode;
    document.getElementById('host-controls').classList.add('hidden');
    document.getElementById('player-waiting-msg').classList.remove('hidden');

    showScreen('lobby-screen');
    await connectToRoom(roomCode);
}

// ─── Supabase Channel ─────────────────────────────────────────────────────────
async function connectToRoom(code) {
    channel = client.channel(`room_${code}`, { config: { presence: { key: playerName } } });

    channel
        .on('presence', { event: 'sync' }, () => updatePlayersFromPresence(channel.presenceState()))
        .on('broadcast', { event: 'game_start' },  () => startGameLocal())
        .on('broadcast', { event: 'next_question' }, ({ payload }) => {
            currentQuestionIndex = payload.index;
            renderQuestion();
        })
        .on('broadcast', { event: 'show_answers' }, () => revealAnswers())
        .on('broadcast', { event: 'game_over' },  () => showScore())
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ name: playerName, isHost, score: 0, status: 'lobby' });
            } else if (status === 'CHANNEL_ERROR') {
                showToast("Failed to connect to room.");
            }
        });
}

function updatePlayersFromPresence(presenceState) {
    playersList = Object.values(presenceState).map(arr => arr[arr.length - 1]);

    const listEl = document.getElementById('lobby-players-list');
    if (listEl) {
        listEl.innerHTML = '';
        playersList.forEach(player => {
            const row = document.createElement('div');
            row.className = 'player-row';
            row.innerHTML = `
                <div class="player-name-wrapper">
                    <span class="player-dot"></span>
                    <span style="font-weight:700;">${escapeHtml(player.name)}</span>
                </div>
                ${player.isHost ? '<span class="host-badge">Host</span>' : ''}
            `;
            listEl.appendChild(row);
        });
        document.getElementById('player-count-badge').textContent = playersList.length;
    }

    if (isHost && isGameActive && !hasRevealedCurrentQuestion) {
        const stillAnswering = playersList.filter(p => p.status === 'answering');
        if (stillAnswering.length === 0 && playersList.length > 0) {
            channel.send({ type: 'broadcast', event: 'show_answers' });
            revealAnswers();
        }
    }
}

// ─── Start Game ───────────────────────────────────────────────────────────────
async function lobbyStartGame() {
    await client.from('quiz_rooms').update({ status: 'playing' }).eq('room_code', roomCode);
    channel?.send({ type: 'broadcast', event: 'game_start' });
    startGameLocal();
}

function startGameLocal() {
    showScreen('question-screen');
    currentQuestionIndex = 0;
    score      = 0;
    userAnswers = [];
    document.getElementById('score-val').textContent = '0';
    isGameActive = true;
    updateProgress();
    renderQuestion();
}

// ─── Render Question ──────────────────────────────────────────────────────────
function renderQuestion() {
    hasSelectedOption          = false;
    lastSelectedOptionIndex    = -1;
    hasRevealedCurrentQuestion = false;

    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;

    const container = document.getElementById('options-container');
    container.innerHTML = '';
    container.style.pointerEvents = 'auto';

    document.getElementById('waiting-for-others').classList.add('hidden');
    document.getElementById('feedback-box').classList.add('hidden');

    ['A','B','C','D'].forEach((letter, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-indicator">${letter}</span><span class="option-text">${q.options[idx]}</span>`;
        btn.onclick = () => handleAnswer(idx);
        container.appendChild(btn);
    });

    channel?.track({ name: playerName, isHost, score, status: 'answering' });
    startTimer();
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function startTimer() {
    timeLeft = TIMER_LIMIT;
    document.getElementById('timer-bar').style.width = '100%';
    document.getElementById('timer-val').textContent = timeLeft;
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-val').textContent = timeLeft;
        document.getElementById('timer-bar').style.width = `${(timeLeft / TIMER_LIMIT) * 100}%`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!hasSelectedOption) handleAnswer(-1);
        }
    }, 1000);
}

// ─── Handle Answer ────────────────────────────────────────────────────────────
function handleAnswer(selectedIndex) {
    if (hasSelectedOption) return;
    hasSelectedOption       = true;
    lastSelectedOptionIndex = selectedIndex;

    const q         = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.correctIndex;

    if (isCorrect) score++;
    document.getElementById('score-val').textContent = score;

    userAnswers.push({
        question:       q.question,
        selectedAnswer: selectedIndex === -1 ? "No Answer" : q.options[selectedIndex],
        correctAnswer:  q.options[q.correctIndex],
        isCorrect
    });

    document.querySelectorAll('.option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === selectedIndex) btn.classList.add(isCorrect ? 'correct' : 'wrong');
    });
    document.getElementById('options-container').style.pointerEvents = 'none';

    if (isMultiplayer) {
        document.getElementById('waiting-for-others').classList.remove('hidden');
        channel?.track({ name: playerName, isHost, score, status: 'answered' });
    } else {
        revealAnswers();
    }
}

// ─── Reveal Answers ───────────────────────────────────────────────────────────
function revealAnswers() {
    if (hasRevealedCurrentQuestion) return;
    hasRevealedCurrentQuestion = true;
    clearInterval(timerInterval);
    document.getElementById('waiting-for-others').classList.add('hidden');

    const q = questions[currentQuestionIndex];
    document.querySelectorAll('.option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.correctIndex) btn.classList.add('correct');
        else if (idx === lastSelectedOptionIndex) btn.classList.add('wrong');
    });

    const indicator  = document.getElementById('feedback-indicator');
    const titleEl    = document.getElementById('feedback-title');
    const isCorrect  = lastSelectedOptionIndex === q.correctIndex;

    indicator.className = `status-indicator ${isCorrect ? 'correct' : 'wrong'}`;
    titleEl.className   = isCorrect ? 'correct' : 'wrong';
    titleEl.textContent = lastSelectedOptionIndex === -1 ? 'Time Expired!' : (isCorrect ? 'Correct!' : 'Incorrect');
    document.getElementById('feedback-text').textContent = q.funFact;
    document.getElementById('feedback-box').classList.remove('hidden');

    const nextBtn       = document.getElementById('next-btn');
    const waitingNext   = document.getElementById('player-waiting-next');

    if (!isMultiplayer || isHost) {
        nextBtn.classList.remove('hidden');
        waitingNext.classList.add('hidden');
    } else {
        nextBtn.classList.add('hidden');
        waitingNext.classList.remove('hidden');
    }
}

// ─── Next Question ────────────────────────────────────────────────────────────
function handleNext() {
    if (isMultiplayer && isHost) {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            channel.send({ type: 'broadcast', event: 'next_question', payload: { index: nextIndex } });
            currentQuestionIndex = nextIndex;
            updateProgress();
            renderQuestion();
        } else {
            channel.send({ type: 'broadcast', event: 'game_over' });
            showScore();
        }
    } else if (!isMultiplayer) {
        currentQuestionIndex++;
        updateProgress();
        if (currentQuestionIndex < questions.length) renderQuestion();
        else showScore();
    }
}

function updateProgress() {
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
}

// ─── Show Score ───────────────────────────────────────────────────────────────
function showScore() {
    clearInterval(timerInterval);
    isGameActive = false;

    showScreen('score-screen');
    // score screen uses block layout for scrollability
    document.getElementById('score-screen').style.display = 'block';
    document.getElementById('final-score').textContent = score;
    document.getElementById('share-text').textContent  = `I scored ${score}/10 on Nisreen's Birthday Quiz!`;

    const titles = {
        perfect: "Perfect Score!",
        great:   "Great job! You know her well",
        okay:    "Not bad! You know some stuff",
        low:     "Oops! Get to know Nisreen better"
    };
    const verdict = score === 10 ? titles.perfect : score >= 7 ? titles.great : score >= 4 ? titles.okay : titles.low;
    document.getElementById('score-title').textContent = verdict;

    renderReview();

    const leaderboardCard = document.querySelector('.leaderboard-card');
    if (isMultiplayer) {
        leaderboardCard.style.display = 'block';
        if (isHost) client.from('quiz_rooms').update({ status: 'finished' }).eq('room_code', roomCode).then();
        saveScoreToSupabase();
    } else {
        leaderboardCard.style.display = 'none';
    }
}


// ─── Render Review ────────────────────────────────────────────────────────────
function renderReview() {
    const list = document.getElementById('review-list');
    list.innerHTML = '';
    userAnswers.forEach((ans, idx) => {
        const card      = document.createElement('div');
        card.className  = 'review-card';
        const isCorrect = ans.isCorrect;
        const iconSvg   = isCorrect
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        card.innerHTML = `
            <div class="review-status-icon ${isCorrect ? 'correct' : 'wrong'}">${iconSvg}</div>
            <div class="review-body">
                <div class="review-question">${idx + 1}. ${ans.question}</div>
                <div class="review-answers">
                    <span class="user-pick">You answered: ${ans.selectedAnswer}</span>
                    ${!isCorrect ? `<span class="correct-pick">Correct: ${ans.correctAnswer}</span>` : ''}
                </div>
            </div>`;
        list.appendChild(card);
    });
}

// ─── Supabase Score Saving & Leaderboard ──────────────────────────────────────
async function saveScoreToSupabase() {
    const { error } = await client.from('quiz_scores').insert([{
        room_code: roomCode, player_name: playerName, score, total_questions: questions.length
    }]);
    if (error) console.error("Error saving score:", error);
    fetchLeaderboard();
    subscribeToLeaderboard();
}

function subscribeToLeaderboard() {
    if (leaderboardChannel) leaderboardChannel.unsubscribe();
    leaderboardChannel = client.channel('leaderboard_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_scores', filter: `room_code=eq.${roomCode}` }, fetchLeaderboard)
        .subscribe();
}

async function fetchLeaderboard() {
    const { data, error } = await client.from('quiz_scores').select('player_name, score')
        .eq('room_code', roomCode).order('score', { ascending: false });
    if (!error && data) renderLeaderboard(data);
}

function renderLeaderboard(scores) {
    const container = document.getElementById('multiplayer-leaderboard');
    if (!container) return;
    container.innerHTML = '';
    scores.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
        row.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span class="leaderboard-rank ${rankClass}">${idx + 1}</span>
                <span class="leaderboard-name">${escapeHtml(item.player_name)}</span>
            </div>
            <span class="leaderboard-score">${item.score}/${questions.length}</span>`;
        container.appendChild(row);
    });
}

// ─── Restart Quiz ─────────────────────────────────────────────────────────────
function restartQuiz() {
    document.getElementById('birthday-card')?.classList.remove('flipped');
    channel?.unsubscribe();
    leaderboardChannel?.unsubscribe();
    isMultiplayer = false;
    isHost        = false;
    roomCode      = "";
    playersList   = [];
    isGameActive  = false;
    showScreen('start-screen');
}

// ─── Copy Result ──────────────────────────────────────────────────────────────
function copyResult() {
    navigator.clipboard.writeText(`I scored ${score}/${questions.length} on Nisreen's Birthday Quiz!\nThink you know her better?`)
        .then(() => showToast("Copied to clipboard!"))
        .catch(err => console.error(err));
}

// ─── XSS Safety ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
