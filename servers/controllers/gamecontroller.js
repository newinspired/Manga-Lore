const fs = require('fs');
const path = require('path');

module.exports = {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs,
  handleCorrectionEvents,
};

// ---------------- Utils ----------------

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function handleCorrectionEvents(io, socket, playersInRooms) {
  // ✅ Seul le host peut corriger
  socket.on("applyCorrection", ({ room, playerId, questionIndex, isCorrect }) => {
    const players = playersInRooms[room];
    if (!players) return;

    const host = players.find(p => p.isHost);
    if (!host || host.id !== socket.id) {
      console.log("❌ Tentative de correction par un non-host !");
      return;
    }

    const player = players.find(p => p.id === playerId);
    if (player) {
      if (isCorrect) player.score = (player.score || 0) + 1000;
    }
    io.to(room).emit("playerList", players);
  });

  // ✅ Le host avance la correction, tous les joueurs suivent
  socket.on("correctionUpdate", ({ room, questionIndex, playerIndex }) => {
    const players = playersInRooms[room];
    if (!players) return;

    const host = players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return;

    io.to(room).emit("correctionUpdate", { questionIndex, playerIndex });
  });
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

// ---------------- Handlers ----------------

function handleJoinRoom(io, socket, { roomId, username, avatar }, playersInRooms) {
  if (!playersInRooms[roomId]) playersInRooms[roomId] = [];
  if (playersInRooms[roomId].some(p => p.id === socket.id)) return;

  const isHost = playersInRooms[roomId].length === 0;
  const player = { id: socket.id, username, avatar, isReady: false, isHost, score: 0 };
  playersInRooms[roomId].push(player);

  socket.join(roomId);
  io.to(roomId).emit('playerList', playersInRooms[roomId]);
  socket.emit('hostStatus', isHost);
}

function handleSelectedArcs(io, roomId, arcs, games) {
  if (!games[roomId]) games[roomId] = {};
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
  const allQuestions = loadQuestionsFromArcs(selectedArcs).slice(0, 15);

  if (games[roomCode]) clearGameTimer(games[roomCode]);

  games[roomCode] = {
    players,
    questions: allQuestions,
    currentQuestionIndex: 0,
    answers: {}, // { playerId: "réponse" }
    answersHistory: [], // ✅ pour stocker toutes les réponses question par question
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

  const playerId = socket.id;
  game.answers[playerId] = answer;
}

function handleDisconnect(io, socket, playersInRooms, games = {}) {
  for (const roomId in playersInRooms) {
    const players = playersInRooms[roomId];
    const idx = players.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const wasHost = players[idx].isHost;
      players.splice(idx, 1);

      if (wasHost && players.length > 0) {
        players[0].isHost = true;
        io.to(players[0].id).emit('hostStatus', true);
      }

      io.to(roomId).emit('playerList', players);

      if (players.length === 0 && games[roomId]) {
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

  // 🔹 Sauvegarder les réponses précédentes avant de passer à la suivante
  if (game.currentQuestionIndex > 0) {
    const prevQuestion = game.questions[game.currentQuestionIndex - 1];
    game.answersHistory.push({
      question: prevQuestion.question,
      correctAnswer: prevQuestion.answer,
      answers: { ...game.answers }
    });
    game.answers = {}; // reset pour la prochaine question
  }

  if (game.currentQuestionIndex >= game.questions.length) {
    endGame(io, roomCode, games);
    return;
  }

  const question = game.questions[game.currentQuestionIndex];
  let timeLeft = game.currentQuestionIndex === 0 ? 0 : 3;

  io.to(roomCode).emit('newQuestion', { question, timeLeft });

  game.timerInterval = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit('timer', timeLeft);

    if (timeLeft <= 0) {
      clearGameTimer(game);
      game.currentQuestionIndex++;
      sendNextQuestion(io, roomCode, games);
    }
  }, 1000);
}

function endGame(io, roomCode, games) {
  const game = games[roomCode];
  if (!game) return;

  game.inProgress = false;
  clearGameTimer(game);

  // 🔹 Sauvegarder la dernière question
  if (game.questions[game.currentQuestionIndex - 1] && Object.keys(game.answers).length > 0) {
    const prevQuestion = game.questions[game.currentQuestionIndex - 1];
    game.answersHistory.push({
      question: prevQuestion.question,
      correctAnswer: prevQuestion.answer,
      answers: { ...game.answers }
    });
  }

  const playersPayload = game.players.map((p, idx) => ({
    id: p.id,
    username: p.username || `Joueur ${idx + 1}`,
    avatar: p.avatar || 'luffy',
    score: typeof p.score === 'number' ? p.score : 0
  }));

  io.to(roomCode).emit('gameEnded', { 
    players: playersPayload,
    answersHistory: game.answersHistory // ✅ on envoie l’historique complet
  });
}
