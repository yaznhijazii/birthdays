const questions = [
    {
        question: "How old will Nisreen be in a year?",
        options: ["31 years old", "32 years old", "33 years old", "34 years old"],
        correctIndex: 2,
        funFact: "33 and thriving! Every year she gets wiser, funnier, and more amazing. 🎂"
    },
    {
        question: "What was Nisreen's major in university?",
        options: ["Architecture", "Civil Engineering", "Mechanical Engineering", "Interior Design"],
        correctIndex: 1,
        funFact: "Civil Engineering! She literally has the skills to build the world. 🏗️"
    },
    {
        question: "What is Nisreen's favorite food?",
        options: ["Mansaf", "Maqluba", "Okra (Bamya)", "Grilled Chicken"],
        correctIndex: 2,
        funFact: "Okra (الباميا) is her absolute comfort food — a true classic with amazing taste! 🍲"
    },
    {
        question: "What is Nisreen's favorite drink?",
        options: ["Iced Latte", "Fresh Juice", "Water", "Green Tea"],
        correctIndex: 2,
        funFact: "Pure, refreshing water — she stays hydrated and healthy every single day! 💧"
    },
    {
        question: "Which country does she dream of visiting the most?",
        options: ["France", "Italy", "Spain", "Greece"],
        correctIndex: 1,
        funFact: "Italy all the way! Pizza, pasta, history, and romance — what's not to love? 🇮🇹"
    },
    {
        question: "What is Nisreen's biggest fear?",
        options: ["Spiders", "Cats", "Heights", "The Dark"],
        correctIndex: 1,
        funFact: "Cats! Yep, even the cutest fluffy ones send her running the other way! 🐱😱"
    },
    {
        question: "What is her dream car?",
        options: ["Range Rover", "Mercedes G-Wagon", "Sports Car", "Tesla Model S"],
        correctIndex: 2,
        funFact: "Fast, stylish, and powerful — she wants a sports car that matches her energy! 🏎️"
    },
    {
        question: "What is Nisreen's favorite hobby?",
        options: ["Reading", "Painting", "Tennis", "Swimming"],
        correctIndex: 2,
        funFact: "Tennis! She's got the moves, the focus, and the competitive spirit to match! 🎾"
    },
    {
        question: "What is Nisreen's favorite color?",
        options: ["Blue", "Pink", "Black", "White"],
        correctIndex: 3,
        funFact: "White — clean, elegant, and timeless. Just like her style! 🤍"
    },
    {
        question: "What is her absolute favorite emoji?",
        options: ["😂 (Laugh-Cry)", "🥺 (Pleading Face)", "🤍 (White Heart)", "🤣 (ROFL)"],
        correctIndex: 3,
        funFact: "🤣 — she laughs so hard she rolls on the floor! Pure joy and good vibes all day!"
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
const BLOCK_SCREENS = new Set(['score-screen', 'dashboard-screen', 'message-screen']);
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
        
        // Parse font_style metadata: "font-ruqaa|flower-1,flower-3"
        let fontClass = 'font-ruqaa';
        let flowers = [];
        if (msg.font_style) {
            const parts = msg.font_style.split('|');
            fontClass = parts[0] || 'font-ruqaa';
            if (parts[1]) {
                flowers = parts[1].split(',').filter(Boolean);
            }
        }

        let miniFlowerHtml = '';
        if (flowers.length > 0) {
            const firstFlowerId = flowers[0];
            const flower = LN_FLOWERS.find(f => f.id === firstFlowerId);
            if (flower) {
                miniFlowerHtml = `<img src="${flower.url}" class="dash-note-mini-flower" alt="" />`;
            }
        }

        const card = document.createElement('div');
        card.className = 'dash-note-card';
        card.innerHTML = `
            <div class="dash-note-mini-envelope">
                <img src="love_notes/card-base.png" alt="Envelope" />
                ${miniFlowerHtml}
            </div>
            <div class="dash-note-body">
                <div class="dash-note-meta">
                    <span class="dash-note-sender">${escapeHtml(msg.player_name)}</span>
                    <span class="dash-note-time">${time}</span>
                </div>
                <p class="dash-note-text ${fontClass}">${escapeHtml(msg.message)}</p>
            </div>
            <button class="dash-note-delete-btn" onclick="deleteMessage(${msg.id})" title="Delete message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
        card.onclick = (e) => {
            if (e.target.closest('.dash-note-delete-btn')) return;
            openLetterModal(msg);
        };
        container.appendChild(card);
    });
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const { error } = await client
        .from('quiz_messages')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Failed to delete message.');
        console.error(error);
    } else {
        showToast('Message deleted.');
        await fetchDashboardMessages();
    }
}
window.deleteMessage = deleteMessage;

let activeRoomChannels = {};
function cleanupDashboardRooms() {
    Object.keys(activeRoomChannels).forEach(code => {
        activeRoomChannels[code].unsubscribe();
    });
    activeRoomChannels = {};
}

function renderDashboardLivePlayers(roomCode, presenceState) {
    const container = document.getElementById(`live-players-${roomCode}`);
    if (!container) return;

    const players = Object.values(presenceState).map(arr => arr[arr.length - 1]);
    container.innerHTML = '';

    if (players.length === 0) {
        container.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">No players in room.</span>`;
        return;
    }

    players.forEach(p => {
        let statusText = p.status;
        if (p.status === 'answering') statusText = `Thinking on Q${p.questionNumber || 1}`;
        else if (p.status === 'answered') statusText = `Answered Q${p.questionNumber || 1}`;
        else if (p.status === 'lobby') statusText = 'In Lobby';

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.fontSize = '12px';
        row.style.padding = '4px 0';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';

        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="player-dot" style="background-color: ${p.status === 'lobby' ? 'var(--text-muted)' : 'var(--success)'}; box-shadow: none; width:6px; height:6px;"></span>
                <span style="font-weight:700;">${escapeHtml(p.name)}</span>
                <span style="font-size:10px; opacity:0.6; background:rgba(255,255,255,0.06); padding:1px 4px; border-radius:4px;">${statusText}</span>
            </div>
            <span style="font-weight:800; color:var(--primary);">${p.score}/10</span>
        `;
        container.appendChild(row);
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

    // Clean up channels that are no longer in our live rooms list
    const currentRoomCodes = new Set(rooms.map(r => r.room_code));
    Object.keys(activeRoomChannels).forEach(code => {
        if (!currentRoomCodes.has(code)) {
            activeRoomChannels[code].unsubscribe();
            delete activeRoomChannels[code];
        }
    });

    for (const room of rooms) {
        const row = document.createElement('div');
        row.className = 'dashboard-room-row';

        let contentHtml = '';

        if (room.status === 'lobby' || room.status === 'playing') {
            // Live Room: Subscribe to presence
            if (!activeRoomChannels[room.room_code]) {
                const chan = client.channel(`room_${room.room_code}`);
                chan.on('presence', { event: 'sync' }, () => {
                    renderDashboardLivePlayers(room.room_code, chan.presenceState());
                }).subscribe(status => {
                    if (status === 'SUBSCRIBED') {
                        renderDashboardLivePlayers(room.room_code, chan.presenceState());
                    }
                });
                activeRoomChannels[room.room_code] = chan;
            }

            contentHtml = `
                <div style="margin-top:8px; background:rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius:12px; padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:11px; font-weight:800; color:#34d399; display:flex; align-items:center; gap:6px;">
                            <span class="pulse-dot" style="background-color:#34d399; box-shadow: 0 0 8px #34d399; width:6px; height:6px;"></span>
                            LIVE SCOREBOARD
                        </span>
                    </div>
                    <div id="live-players-${room.room_code}" style="display:flex; flex-direction:column; gap:4px;">
                        Connecting to live room...
                    </div>
                </div>
            `;
        } else {
            // Finished Room: Fetch static scoreboard
            if (activeRoomChannels[room.room_code]) {
                activeRoomChannels[room.room_code].unsubscribe();
                delete activeRoomChannels[room.room_code];
            }

            const { data: scores } = await client
                .from('quiz_scores')
                .select('player_name, score')
                .eq('room_code', room.room_code)
                .order('score', { ascending: false });

            const scoresHtml = scores && scores.length > 0
                ? scores.map((s, i) => `
                    <div style="display:flex; justify-content: space-between; font-size:13px; font-weight:600; color:var(--text-secondary); padding: 4px 0; border-bottom: 1px solid var(--border-color);">
                        <span>${i + 1}. ${escapeHtml(s.player_name)}</span>
                        <span style="color:var(--primary);">${s.score}/${questions.length}</span>
                    </div>
                `).join('')
                : `<p style="color:var(--text-muted); font-size:12px;">No scores recorded yet.</p>`;

            contentHtml = `<div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">${scoresHtml}</div>`;
        }

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:800; font-size:18px; letter-spacing:1px;">${room.room_code}</span>
                <span class="room-status-badge ${room.status}">${room.status}</span>
            </div>
            ${contentHtml}
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
    cleanupDashboardRooms();
}

// ─── Love Notes Card System ──────────────────────────────────────────────────
const LN_FLOWERS = [
    { id: 'flower-1', url: 'love_notes/flower-1.png' },
    { id: 'flower-2', url: 'love_notes/flower-2.png' },
    { id: 'flower-3', url: 'love_notes/flower-3.png' },
    { id: 'flower-4', url: 'love_notes/flower-4.png' },
    { id: 'flower-5', url: 'love_notes/flower-5.png' },
    { id: 'flower-6', url: 'love_notes/flower-6.png' },
    { id: 'flower-7', url: 'love_notes/flower-7.png' },
];

const LN_FLOWER_SLOTS = [
    { x: '-5%',  y: '30%', rotate: 0,   scale: 1.25 },
    { x: '-18%', y: '32%', rotate: -12, scale: 1.1  },
    { x: '10%',  y: '35%', rotate: 10,  scale: 1.15 },
    { x: '25%',  y: '42%', rotate: 22,  scale: 1.0  },
    { x: '-28%', y: '40%', rotate: -22, scale: 1.0  },
];

let selectedFlowers = [];
let selectedFont = 'font-ruqaa';

// Build flower picker grid on load
function initLoveNotes() {
    const grid = document.getElementById('ln-flower-grid');
    if (!grid) return;
    grid.innerHTML = '';
    LN_FLOWERS.forEach(flower => {
        const btn = document.createElement('button');
        btn.className = 'ln-flower-pick';
        btn.dataset.flowerId = flower.id;
        btn.innerHTML = `<img src="${flower.url}" alt="" />`;
        btn.onclick = () => toggleFlower(flower.id, btn);
        grid.appendChild(btn);
    });
}

function toggleFlower(id, btn) {
    if (selectedFlowers.includes(id)) {
        selectedFlowers = selectedFlowers.filter(f => f !== id);
        btn.classList.remove('selected');
    } else if (selectedFlowers.length < 5) {
        selectedFlowers.push(id);
        btn.classList.add('selected');
    }
    document.getElementById('ln-flower-count').textContent = `${selectedFlowers.length} / 5`;
    renderCardFlowers();
}

function renderCardFlowers() {
    const layer = document.getElementById('ln-flowers-layer');
    layer.innerHTML = '';
    selectedFlowers.forEach((fid, idx) => {
        const flower = LN_FLOWERS.find(f => f.id === fid);
        if (!flower) return;
        const slot = LN_FLOWER_SLOTS[idx % LN_FLOWER_SLOTS.length];
        const div = document.createElement('div');
        div.className = 'ln-flower-item';
        div.style.left = '50%';
        div.style.top = slot.y;
        div.style.marginLeft = slot.x;
        div.style.transform = `scale(${slot.scale}) rotate(${slot.rotate}deg)`;
        div.innerHTML = `<img src="${flower.url}" alt="" />`;
        layer.appendChild(div);
    });
}

function selectFont(btnEl) {
    selectedFont = btnEl.dataset.font;
    document.querySelectorAll('.ln-font-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    // Update preview font
    const previewText   = document.getElementById('ln-preview-text');
    const previewSender = document.getElementById('ln-preview-sender');
    const toText        = document.getElementById('ln-to-text');
    previewText.className   = `ln-preview-text ${selectedFont}`;
    previewSender.className = `ln-preview-sender ${selectedFont}`;
    toText.className        = selectedFont;
    // Update to-label text
    toText.textContent = selectedFont === 'font-ruqaa' ? 'إلى: Nisreen' : 'To: Nisreen';
}

// Live preview bindings
function setupLivePreview() {
    const nameInput = document.getElementById('msg-sender-name');
    const bodyInput = document.getElementById('msg-body');
    if (!nameInput || !bodyInput) return;

    bodyInput.addEventListener('input', () => {
        const text = bodyInput.value.trim();
        document.getElementById('ln-preview-text').textContent = text || (selectedFont === 'font-ruqaa' ? 'اكتب رسالتك هنا...' : 'Write your message...');
    });

    nameInput.addEventListener('input', () => {
        const name = nameInput.value.trim();
        document.getElementById('ln-preview-sender').textContent = name ? `— ${name}` : (selectedFont === 'font-ruqaa' ? '— اسمك' : '— Your name');
    });
}

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

    // Build font_style metadata: "font-ruqaa|flower-1,flower-3"
    const fontStyle = `${selectedFont}|${selectedFlowers.join(',')}`;

    const { error } = await client
        .from('quiz_messages')
        .insert([{ room_code: 'message', player_name: name, message: msg, font_style: fontStyle }]);

    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Send Letter`;

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

// Initialize love notes on page load
initLoveNotes();
setupLivePreview();

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
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ name: playerName, isHost, score: 0, status: 'lobby', questionNumber: 0 });
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

    channel?.track({ name: playerName, isHost, score, status: 'answering', questionNumber: currentQuestionIndex + 1 });
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
        channel?.track({ name: playerName, isHost, score, status: 'answered', questionNumber: currentQuestionIndex + 1 });
    }
    revealAnswers();
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

    nextBtn.classList.remove('hidden');
    waitingNext.classList.add('hidden');
}

// ─── Next Question ────────────────────────────────────────────────────────────
function handleNext() {
    currentQuestionIndex++;
    updateProgress();
    if (currentQuestionIndex < questions.length) renderQuestion();
    else showScore();
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

// ─── Letter Viewer Modal ──────────────────────────────────────────────────────
function openLetterModal(msg) {
    const modal = document.getElementById('letter-modal');
    const textEl = document.getElementById('modal-ln-text');
    const senderEl = document.getElementById('modal-ln-sender');
    const toEl = document.getElementById('modal-ln-to');
    const flowersLayer = document.getElementById('modal-ln-flowers-layer');

    // Parse font_style: "font-ruqaa|flower-1,flower-3"
    let fontClass = 'font-ruqaa';
    let flowers = [];
    if (msg.font_style) {
        const parts = msg.font_style.split('|');
        fontClass = parts[0] || 'font-ruqaa';
        if (parts[1]) {
            flowers = parts[1].split(',').filter(Boolean);
        }
    }

    // Set font styles
    textEl.className = `ln-preview-text ${fontClass}`;
    senderEl.className = `ln-preview-sender ${fontClass}`;
    toEl.className = fontClass;
    toEl.textContent = fontClass === 'font-ruqaa' ? 'إلى: Nisreen' : 'To: Nisreen';

    // Set content
    textEl.textContent = msg.message;
    senderEl.textContent = `— ${msg.player_name}`;

    // Render flowers
    flowersLayer.innerHTML = '';
    flowers.forEach((fid, idx) => {
        const flower = LN_FLOWERS.find(f => f.id === fid);
        if (!flower) return;
        const slot = LN_FLOWER_SLOTS[idx % LN_FLOWER_SLOTS.length];
        const div = document.createElement('div');
        div.className = 'ln-flower-item';
        div.style.left = '50%';
        div.style.top = slot.y;
        div.style.marginLeft = slot.x;
        div.style.transform = `scale(${slot.scale}) rotate(${slot.rotate}deg)`;
        div.innerHTML = `<img src="${flower.url}" alt="" />`;
        flowersLayer.appendChild(div);
    });

    modal.classList.add('active');
}

function closeLetterModal() {
    document.getElementById('letter-modal').classList.remove('active');
}

// Close modal when clicking outside modal-content
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('letter-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLetterModal();
            }
        });
    }
});

window.openLetterModal = openLetterModal;
window.closeLetterModal = closeLetterModal;

