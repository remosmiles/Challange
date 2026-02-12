// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDLFkWGvGxakLSoX8Vqh8qCunuzpwMOCfk",
  authDomain: "challenge-e77d2.firebaseapp.com",
  projectId: "challenge-e77d2",
  storageBucket: "challenge-e77d2.firebasestorage.app",
  messagingSenderId: "1059790573258",
  appId: "1:1059790573258:web:00d1976d024c549406ee33",
  measurementId: "G-PTHYL8KDSJ"
};

// Variablen deklarieren
let db;
let score = 0;
let timeLeft = 1.0;
let maxTime = 1.0;
let timerInterval;
let playerName = "";

// Firebase sicher initialisieren
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase erfolgreich verbunden!");
} catch (e) {
    console.error("Firebase Fehler: Hast du die Scripte in den Settings hinzugefügt?", e);
}

// Rangliste laden
document.addEventListener('DOMContentLoaded', updateGlobalLeaderboard);

// --- 2. SPIEL-LOGIK ---

function startGame() {
    const nameInput = document.getElementById('player-name');
    playerName = nameInput ? nameInput.value.trim() : "Anonym";
    if (playerName === "") playerName = "Anonym";

    document.getElementById('start-screen').style.display = "none";
    document.getElementById('game-screen').style.display = "block";
    
    score = 0;
    maxTime = 1.0;
    spawnTarget();
}

function spawnTarget() {
    const area = document.getElementById('game-area');
    const target = document.getElementById('target');
    if (!area || !target) return;

    let size = Math.max(15, 55 - (score * 1.8));
    target.style.width = size + "px";
    target.style.height = size + "px";
    target.style.left = Math.random() * (area.clientWidth - size) + "px";
    target.style.top = Math.random() * (area.clientHeight - size) + "px";
    
    maxTime = Math.max(0.30, 1.0 - (score * 0.04));
    timeLeft = maxTime;
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.01;
        document.getElementById('level-count').innerText = score;
        document.getElementById('timer-text').innerText = Math.max(0, timeLeft).toFixed(2) + "s";
        document.getElementById('timer-bar').style.width = (timeLeft / maxTime) * 100 + "%";
        if (timeLeft <= 0) gameOver("ZEIT ABGELAUFEN");
    }, 10);
}

function hitTarget(event) {
    event.stopPropagation();
    score++;
    spawnTarget();
}

function gameOver(reason) {
    clearInterval(timerInterval);
    alert(`GAME OVER: ${reason}\nScore: ${score}`);
    saveScore(playerName, score);
    document.getElementById('game-screen').style.display = "none";
    document.getElementById('start-screen').style.display = "block";
}

// --- 3. DATENBANK-LOGIK ---

async function saveScore(name, finalScore) {
    if (!db) return;
    try {
        const userRef = db.collection("leaderboard").where("name", "==", name);
        const snapshot = await userRef.get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            if (finalScore > doc.data().score) {
                await db.collection("leaderboard").doc(doc.id).update({
                    score: finalScore, date: firebase.firestore.Timestamp.now()
                });
            }
        } else {
            await db.collection("leaderboard").add({
                name: name, score: finalScore, date: firebase.firestore.Timestamp.now()
            });
        }
    } catch (err) { console.error("Speicherfehler:", err); }
}

function updateGlobalLeaderboard() {
    if (!db) return;
    db.collection("leaderboard").orderBy("score", "desc").limit(10).onSnapshot(snap => {
        const body = document.getElementById('leaderboard-body');
        if (!body) return;
        body.innerHTML = snap.docs.map(doc => {
            const d = doc.data();
            return `<tr><td>${d.name}</td><td>${d.score}</td><td>${d.date?.toDate().toLocaleDateString('de-DE') || ''}</td></tr>`;
        }).join('');
    });
}
