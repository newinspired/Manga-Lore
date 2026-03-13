


const fs = require('fs');
const path = require('path');

module.exports = {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs,
  handleCorrectionEvents,
  endGame,
};


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


function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}


function handleCorrectionEvents(io, socket, playersInRooms, games) {
  socket.on("applyCorrection", ({ room, playerId, questionIndex, isCorrect }) => {
    const players = playersInRooms[room];
    const game = games[room];
    if (!players || !game) return;

    const host = players.find(p => p.isHost);
    if (!host || host.socketId !== socket.id) return;

    const player = players.find(p =>
      (p.playerId && p.playerId === playerId) ||
      (!p.playerId && p.socketId === playerId)
    );
    if (!player) return;

    const historyEntry = game.answersHistory[questionIndex];
    if (!historyEntry) {
      console.warn(`[applyCorrection] historyEntry introuvable pour room=${room}, questionIndex=${questionIndex}`);
      return;
    }

    if (!isCorrect) {
      console.log(`[CORRECTION] Joueur: ${player.username}, QuestionIndex: ${questionIndex} -> faux (pas de points)`);
      return;
    }

    const difficulty = historyEntry.difficulty || historyEntry.question?.difficulty || 'easy';
    let points = 0;
    switch (difficulty) {
      case 'easy': points = 100000000; break;
      case 'medium': points = 200000000; break;
      case 'difficult': points = 300000000; break;
      default: points = 1;
    }

    player.score = (player.score || 0) + points;

    const gamePlayer = game.players.find(p => p.playerId === playerId);
    if (gamePlayer) gamePlayer.score = player.score;

    console.log(`[CORRECTION] Joueur: ${player.username}, QuestionIndex: ${questionIndex}, Difficulté: ${difficulty}, Points ajoutés: ${points}, Score total: ${player.score}`);

    game.finalPlayers = game.players.map(p => ({
      id: p.playerId,
      username: p.username,
      avatar: p.avatar,
      score: p.score,
      isHost: !!p.isHost
    }));

    io.to(room).emit("playerList", players);
  });

  socket.on("correctionUpdate", ({ room, questionIndex, playerIndex }) => {
    const players = playersInRooms[room];
    if (!players) return;

    const host = players.find(p => p.isHost);
    if (!host || host.socketId !== socket.id) return;

    io.to(room).emit("correctionUpdate", { questionIndex, playerIndex });
  });
}


function clearGameTimer(game) {
  if (game && game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = null;
  }
}


function handleJoinRoom(
  io,
  socket,
  { roomId, username, avatar, playerId },
  playersInRooms,
  games
) {

  if (!playersInRooms[roomId]) {
    playersInRooms[roomId] = [];
  }

  const players = playersInRooms[roomId];

  // 🔒 Empêche double join du même socket
  const alreadyExists = players.find(p => p.socketId === socket.id);
  if (alreadyExists) return;

  // 🔥 Recherche joueur existant
  let existingPlayer = players.find(p => {
    // Cas 1 : joueur connecté Firebase
    if (playerId && p.playerId) {
      return p.playerId === playerId;
    }

    // Cas 2 : joueur invité (match par username)
    if (!playerId && !p.playerId) {
      return p.username === username;
    }

    return false;
  });

  if (existingPlayer) {
    // 🔁 Reconnexion
    existingPlayer.socketId = socket.id;

    socket.join(roomId);

    socket.emit("hostStatus", existingPlayer.isHost);
    io.to(roomId).emit("playerList", players);

    return;
  }

  // 🆕 Nouveau joueur
  const isHost = players.length === 0;

  const newPlayer = {
    playerId: playerId || null,
    socketId: socket.id,
    username: username || `Joueur ${players.length + 1}`,
    avatar: avatar || "luffy",
    isReady: false,
    isHost,
    score: 0
  };

  players.push(newPlayer);

  socket.join(roomId);

  socket.emit("hostStatus", isHost);
  io.to(roomId).emit("playerList", players);

  // 📦 Permet de récupérer les résultats finaux
  socket.on("getFinalPlayers", () => {
    if (!games[roomId]) return;
    socket.emit("finalPlayers", games[roomId].finalPlayers || []);
  });
}


function handleSelectedArcs(io, roomId, arcs, games) {
  if (!games[roomId]) games[roomId] = {};
  games[roomId].selectedArcs = arcs;
  io.to(roomId).emit('arcsUpdated', arcs);
}

function handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games) {
  const players = playersInRooms[roomCode];
  if (!players) return;

  // find by socketId (the one who's acting now)
  const player = players.find(p => p.socketId === socket.id);
  if (!player) return;

  player.isReady = isReady;
  io.to(roomCode).emit('playerList', players);

  if (games[roomCode]?.inProgress) return;
  if (!players.every(p => p.isReady)) return;

  const selectedArcs = games[roomCode]?.selectedArcs || ['EastBlue'];

  const QUESTIONS_COUNT = 15;
  const allQuestions = loadQuestionsFromArcs(selectedArcs).slice(0, QUESTIONS_COUNT);

  if (games[roomCode]) {
    clearGameTimer(games[roomCode]);
  }

  players.forEach(player => {
    player.score = 0;
  });

  games[roomCode] = {
    players,                       // reference to playersInRooms[roomCode]
    questions: allQuestions,
    currentQuestionIndex: 0,
    answers: {},
    answersHistory: [],
    selectedArcs,
    timerInterval: null,
    inProgress: true
  };

  const loadingTimeMs = 1000;
  io.to(roomCode).emit('startGame');

  setTimeout(() => {
    sendNextQuestion(io, roomCode, games);
  }, loadingTimeMs);
}


function handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games) {
  const game = games[roomCode];
  if (!game || !game.inProgress) return;

  // map by playerId when storing answers
  const players = playersInRooms[roomCode];
  const player = players.find(p => p.socketId === socket.id);
  if (!player) return;

  const playerKey = player.playerId || socket.id;
  game.answers[playerKey] = answer;
}


function handleDisconnect(io, socket, playersInRooms, games = {}) {

  for (const roomId in playersInRooms) {

    const players = playersInRooms[roomId];
    const idx = players.findIndex(p => p.socketId === socket.id);

    if (idx === -1) continue; // 🔒 Protection anti crash

    const wasHost = players[idx].isHost;
    const isGuest = !players[idx].playerId;
    const leftUsername = players[idx].username;

    if (isGuest) {
      players.splice(idx, 1); // 👻 invité → suppression totale
    } else {
      players[idx].socketId = null; // 🔐 utilisateur connecté → garder slot
    }

    if (wasHost) {
      const next = players.find(p => p.socketId !== null);
      if (next) {
        next.isHost = true;
        io.to(next.socketId).emit('hostStatus', true);
      }
    }

    io.to(roomId).emit("playerLeft", {
      username: leftUsername
    });

    io.to(roomId).emit('playerList', players);

    // 🧹 Nettoyage si room vide
    const anyConnected = players.some(p => p.socketId !== null);
    if (!anyConnected) {
      if (games[roomId]) {
        clearGameTimer(games[roomId]);
        delete games[roomId];
      }
      delete playersInRooms[roomId];
    }

    break;
  }
}


function sendNextQuestion(io, roomCode, games) {
  const game = games[roomCode];
  if (!game || !game.inProgress) return;

  clearGameTimer(game);

  if (game.currentQuestionIndex > 0) {
    const prevIndex = game.currentQuestionIndex - 1;
    const prevQuestion = game.questions[prevIndex];
    if (prevQuestion) {
      game.answersHistory.push({
        question: prevQuestion.question,
        correctAnswer: prevQuestion.answer,
        answers: { ...game.answers },
        difficulty: prevQuestion.difficulty || 'easy'
      });
    }
    game.answers = {};
  }

  if (game.currentQuestionIndex >= game.questions.length) {
    endGame(io, roomCode, games);
    return;
  }

  const question = game.questions[game.currentQuestionIndex];
  if (!question) {
    console.warn(`[sendNextQuestion] question introuvable room=${roomCode}, index=${game.currentQuestionIndex}`);
    endGame(io, roomCode, games);
    return;
  }

  const QUESTION_TIME_SECONDS = 2;
  let timeLeft = QUESTION_TIME_SECONDS;

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

  const lastIndex = game.currentQuestionIndex - 1;
  if (lastIndex >= 0 && game.questions[lastIndex]) {
    const prevQuestion = game.questions[lastIndex];
    const alreadyRecorded = game.answersHistory.length > 0 &&
      game.answersHistory[game.answersHistory.length - 1].question === prevQuestion.question;

    if (!alreadyRecorded) {
      game.answersHistory.push({
        question: prevQuestion.question,
        correctAnswer: prevQuestion.answer,
        answers: { ...game.answers },
        difficulty: prevQuestion.difficulty || 'easy'
      });
    }
  }

  const playersPayload = game.players.map((p, idx) => ({
    id: p.playerId || p.socketId || `Joueur${idx+1}`,
    username: p.username || `Joueur ${idx + 1}`,
    avatar: p.avatar || 'luffy',
    score: typeof p.score === 'number' ? p.score : 0,
    isHost: !!p.isHost
  }));

  game.finalPlayers = playersPayload;

  game.players.forEach(player => {
    player.isReady = false;
  });

  io.to(roomCode).emit('gameEnded', {
    players: playersPayload,
    answersHistory: game.answersHistory
  });
}

function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function isAnswerCorrect(input, validAnswers) {
  const normalizedInput = input.trim().toLowerCase();

  for (const answerObj of validAnswers) {

    const possibleAnswers = [
      answerObj.canonical,
      ...answerObj.aliases
    ];

    for (const possible of possibleAnswers) {
      const normalizedPossible = possible.toLowerCase();

      const distance = levenshtein(
        normalizedInput,
        normalizedPossible
      );

      if (distance <= 2) {
        return answerObj.canonical; 
      }
    }
  }

  return null;
}