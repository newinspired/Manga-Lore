const fs = require('fs');
const path = require('path');

module.exports = {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs
};

// ---------------- Utils ----------------

function levenshteinDistance(a, b) {
  const matrix = [];
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  for (let i = 0; i <= lenB; i++) matrix[i] = [i];
  for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i-1][j-1];
      else matrix[i][j] = Math.min(matrix[i-1][j]+1, matrix[i][j-1]+1, matrix[i-1][j-1]+1);
    }
  }
  return matrix[lenB][lenA];
}

function normalize(str) {
  return String(str).toLowerCase().replace(/\./g, '').replace(/\s+/g, '').trim();
}

function isFuzzyMatch(input, expectedAnswers, maxDistance = 1) {
  const cleanedInput = normalize(input || '');
  return expectedAnswers.some(expected => {
    const cleanedExpected = normalize(expected || '');
    const distance = levenshteinDistance(cleanedInput, cleanedExpected);
    if (cleanedExpected.length <= 5) return distance === 0;
    return distance <= maxDistance;
  });
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function loadQuestionsFromArcs(arcs) {
  let allQuestions = [];
  for (const arc of arcs) {
    try {
      const arcPath = path.join(__dirname, '../data', `${arc}.json`);
      const data = fs.readFileSync(arcPath, 'utf-8');
      allQuestions = allQuestions.concat(JSON.parse(data));
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${arc}.json :`, error.message);
    }
  }
  return shuffleArray(allQuestions);
}

function clearGameTimer(game) {
  if (game && game.timerInterval) clearInterval(game.timerInterval);
}

// ---------------- Scoring ----------------

const SCORE_TABLE = { easy: 50_000_000, medium: 100_000_000, difficult: 150_000_000 };

function applyScoresForCurrentQuestion(game) {
  const q = game.questions[game.currentQuestionIndex];
  if (!q) return;
  const expectedAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
  const difficulty = (q.difficulty || 'easy').toLowerCase();
  const points = SCORE_TABLE[difficulty] ?? SCORE_TABLE.easy;

  for (const p of game.players) {
    const lastAnswer = game.answers[p.id] ?? '';
    if (!game.scores[p.id]) game.scores[p.id] = 0;
    if (isFuzzyMatch(String(lastAnswer), expectedAnswers)) game.scores[p.id] += points;
  }
}

// ---------------- Handlers ----------------

function handleJoinRoom(io, socket, { roomId, username, avatar }, playersInRooms) {
  if (!playersInRooms[roomId]) playersInRooms[roomId] = [];
  if (playersInRooms[roomId].some(p=>p.id===socket.id)) return;

  const isHost = playersInRooms[roomId].length===0;
  const player = { id: socket.id, username, avatar, isReady: false, isHost };
  playersInRooms[roomId].push(player);
  socket.join(roomId);
  io.to(roomId).emit('playerList', playersInRooms[roomId]);
  socket.emit('hostStatus', isHost);
}

function handleSelectedArcs(io, roomId, arcs, games) {
  if (!games[roomId]) games[roomId]={};
  games[roomId].selectedArcs = arcs;
  io.to(roomId).emit('arcsUpdated', arcs);
}

function handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games) {
  const players = playersInRooms[roomCode];
  if (!players) return;
  const player = players.find(p => p.id === socket.id);
  if (!player) return;
  player.isReady = isReady;
  io.to(roomCode).emit('playerList', players);

  if (games[roomCode]?.inProgress) return;
  if (!players.every(p => p.isReady)) return;

  const selectedArcs = games[roomCode]?.selectedArcs || ['EastBlue'];
  const allQuestions = loadQuestionsFromArcs(selectedArcs).slice(0, 21);

  if (games[roomCode]) clearGameTimer(games[roomCode]);

  games[roomCode] = {
    players,
    questions: allQuestions,
    currentQuestionIndex: 0,
    scores: {},
    answers: {},
    selectedArcs,
    timerInterval: null,
    inProgress: true
  };

  io.to(roomCode).emit('startGame');
  sendNextQuestion(io, roomCode, games, true);
}

function handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games) {
  const game = games[roomCode];
  if (!game || !game.inProgress) return;
  game.answers[socket.id] = answer;
}

function handleDisconnect(io, socket, playersInRooms, games={}) {
  for (const roomId in playersInRooms) {
    const players = playersInRooms[roomId];
    const idx = players.findIndex(p=>p.id===socket.id);
    if (idx!==-1) {
      const wasHost = players[idx].isHost;
      players.splice(idx,1);
      if (wasHost && players.length>0) {
        players[0].isHost = true;
        io.to(players[0].id).emit('hostStatus', true);
      }
      io.to(roomId).emit('playerList', players);
      if (players.length===0 && games[roomId]) {
        clearGameTimer(games[roomId]);
        delete games[roomId];
      }
      break;
    }
  }
}

function sendNextQuestion(io, roomCode, games) {
  const game = games[roomCode];
  if (!game || !game.inProgress) return;

  clearGameTimer(game);

  if (game.currentQuestionIndex >= game.questions.length) {
    endGame(io, roomCode, games);
    return;
  }

  const question = game.questions[game.currentQuestionIndex];

  let timeLeft = game.currentQuestionIndex === 0 ? 3 : 15;

  io.to(roomCode).emit('newQuestion', { question, timeLeft });

  game.timerInterval = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit('timer', timeLeft);

    if (timeLeft <= 0) {
      clearGameTimer(game);

      applyScoresForCurrentQuestion(game);

      game.currentQuestionIndex++;
      sendNextQuestion(io, roomCode, games);
    }
  }, 1000);
}

function endGame(io, roomCode, games){
  const game = games[roomCode];
  if (!game) return;
  game.inProgress = false;
  clearGameTimer(game);

  const playersWithScores = game.players.map(p=>({
    id: p.id,
    username: p.username,
    avatar: p.avatar,
    score: game.scores[p.id]||0
  }));

  io.to(roomCode).emit('gameEnded', { players: playersWithScores });
}
