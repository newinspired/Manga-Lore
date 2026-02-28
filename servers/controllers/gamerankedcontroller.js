const fs = require('fs');
const path = require('path');

module.exports = {
  handleRankedReady,
  handleRankedAnswer
};

// ----------------------------
// Charger les questions ranked
// ----------------------------
function loadRankedQuestions() {
  const filePath = path.join(__dirname, '../data/NameThemAll.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function getRandomQuestions(count = 5) {
  const all = loadRankedQuestions();
  return shuffleArray(all).slice(0, count);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----------------------------
// READY
// ----------------------------
function handleRankedReady(io, socket, roomCode, isReady, playersInRooms, games) {

  const players = playersInRooms[roomCode];
  if (!players) return;

  const player = players.find(p => p.socketId === socket.id);
  if (!player) return;

  player.isReady = isReady;
  io.to(roomCode).emit("playerList", players);

  if (!players.every(p => p.isReady)) return;

  games[roomCode] = {
    mode: "ranked",
    questions: getRandomQuestions(5),
    currentIndex: 0,
    foundAnswers: {},
    rankedScores: {},
    winner: null,
    timerInterval: null,
    startTime: null
  };

  players.forEach(p => {
    games[roomCode].rankedScores[p.playerId] = 0;
  });

  startRankedQuestion(io, roomCode, games);
}

// ----------------------------
// Démarrer une question
// ----------------------------
function startRankedQuestion(io, roomCode, games) {

  const game = games[roomCode];
  const question = game.questions[game.currentIndex];

  game.foundAnswers = {};
  game.winner = null;
  game.startTime = Date.now();

  io.to(roomCode).emit("rankedNewQuestion", {
    question: question.question,
    totalAnswers: question.answers.length
  });

  game.timerInterval = setInterval(() => {

    const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
    io.to(roomCode).emit("rankedTimer", elapsed);

    if (elapsed >= (question.maxTime || 180)) {
      endRankedQuestion(io, roomCode, games);
    }

  }, 1000);
}

// ----------------------------
// Réception réponse
// ----------------------------
function handleRankedAnswer(io, socket, roomCode, input, playersInRooms, games) {

  const game = games[roomCode];
  if (!game) return;

  const players = playersInRooms[roomCode];
  const player = players.find(p => p.socketId === socket.id);
  if (!player) return;

  const question = game.questions[game.currentIndex];
  const normalizedInput = normalize(input);

  let matchedIndex = -1;

  // 🔎 Parcours des réponses + variantes
  for (let i = 0; i < question.answers.length; i++) {

    const variants = question.answers[i].variants;

    for (const variant of variants) {

      if (levenshtein(normalize(variant), normalizedInput) <= 2) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex !== -1) break;
  }

  if (matchedIndex === -1) return;

  // Initialiser set joueur si nécessaire
  if (!game.foundAnswers[player.playerId])
    game.foundAnswers[player.playerId] = new Set();

  const playerSet = game.foundAnswers[player.playerId];

  // Déjà trouvé ?
  if (playerSet.has(matchedIndex)) return;

  // Ajouter réponse trouvée
  playerSet.add(matchedIndex);

  // +50 points par réponse
  game.rankedScores[player.playerId] += 50;

  io.to(socket.id).emit("rankedAnswerValidated", {
    totalFound: playerSet.size,
    totalRequired: question.answers.length
  });

  const totalNeeded = question.answers.length;

  // 🎯 Premier à tout compléter
  if (playerSet.size === totalNeeded && !game.winner) {

    game.winner = player.playerId;

    const elapsed = Math.floor((Date.now() - game.startTime) / 1000);

    game.rankedScores[player.playerId] +=
      1000 + ((question.maxTime || 180) - elapsed) * 5;

    io.to(roomCode).emit("rankedWinner", {
      username: player.username
    });

    // Fin dans 10 secondes
    setTimeout(() => {
      endRankedQuestion(io, roomCode, games);
    }, 10000);
  }
}

// ----------------------------
// Fin question
// ----------------------------
async function endRankedQuestion(io, roomCode, games) {

  const game = games[roomCode];
  if (!game) return;

  clearInterval(game.timerInterval);

  game.currentIndex++;

  if (game.currentIndex >= game.questions.length) {

    const User = require('../models/user');

    try {

      for (const playerId in game.rankedScores) {

        const playerScore = game.rankedScores[playerId];

        await User.findOneAndUpdate(
          { firebaseUid: playerId },   // ✅ IMPORTANT
          { $inc: { rankedScore: playerScore } }
        );
      }

    } catch (err) {
      console.error("❌ Error updating ranked scores:", err);
    }

    io.to(roomCode).emit("rankedGameEnded", {
      scores: game.rankedScores
    });

    delete games[roomCode];
    return;
  }

  startRankedQuestion(io, roomCode, games);
}
// ----------------------------
// Utils
// ----------------------------
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .trim();
}

function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}