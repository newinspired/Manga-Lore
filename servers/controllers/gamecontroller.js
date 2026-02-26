// GameController.js (option B — version finalisée, optimisée)
// ----------------------------------------------------------
// NOTES :
// - Indexation 0-based.
// - Pas de question fantôme : les questions affichées dans le jeu
//   correspondent exactement à celles utilisées en autocorrection.
// - applyCorrection utilise answersHistory pour lire la difficulté
//   (cohérence front/back).
// - Loading time configurable via `loadingTimeMs`.
// ----------------------------------------------------------

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

// ----------------------------------------------------------
// NOTE : Charge les questions depuis les fichiers JSON des arcs
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// NOTE : Mélange Fisher-Yates (immutabilité préservée)
// ----------------------------------------------------------
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// ----------------------------------------------------------
// NOTE : Gestion des événements de correction (hôte)
// - applyCorrection : applique points en lisant l'entry dans answersHistory
// - correctionUpdate : envoie les indices de correction (questionIndex, playerIndex)
// ----------------------------------------------------------
function handleCorrectionEvents(io, socket, playersInRooms, games) {
  socket.on("applyCorrection", ({ room, playerId, questionIndex, isCorrect }) => {
    const players = playersInRooms[room];
    const game = games[room];
    if (!players || !game) return;

    // host must be the one with isHost true AND matching current socket id
    const host = players.find(p => p.isHost);
    if (!host || host.socketId !== socket.id) return;

    const player = players.find(p => p.playerId === playerId);
    if (!player) return;

    // questionIndex refers to answersHistory
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

// ----------------------------------------------------------
// NOTE : Nettoie le timer côté serveur pour la partie donnée
// ----------------------------------------------------------
function clearGameTimer(game) {
  if (game && game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = null;
  }
}

// ----------------------------------------------------------
// NOTE : Un joueur rejoint une salle ; le premier devient host
//       + prise en charge du playerId (persistant côté client)
// ----------------------------------------------------------
function handleJoinRoom(io, socket, { roomId, username, avatar, playerId }, playersInRooms, games) {
  if (!playersInRooms[roomId]) playersInRooms[roomId] = [];
  const alreadyExists = playersInRooms[roomId].find(
      p => p.socketId === socket.id
    );

    if (alreadyExists) {
      return;
    } 

  // Si le joueur (playerId) existe déjà dans la room → mise à jour du socketId
  let existingPlayer = playersInRooms[roomId].find(p => p.playerId && playerId && p.playerId === playerId);

  if (existingPlayer) {
    existingPlayer.socketId = socket.id;
    // join socket to room and emit status
    socket.join(roomId);
    socket.emit('hostStatus', existingPlayer.isHost);
    io.to(roomId).emit('playerList', playersInRooms[roomId]);
    return;
  }

  // Nouveau joueur : host si la room est vide
  const isHost = playersInRooms[roomId].length === 0;

  const player = {
    playerId: playerId || null,           // identifiant persistant (optionnel)
    socketId: socket.id,                  // socket courant
    username: username || `Joueur ${playersInRooms[roomId].length + 1}`,
    avatar: avatar || 'luffy',
    isReady: false,
    isHost,
    score: 0
  };

  playersInRooms[roomId].push(player);

  socket.join(roomId);
  io.to(roomId).emit('playerList', playersInRooms[roomId]);
  socket.emit('hostStatus', isHost);

  socket.on("getFinalPlayers", () => {
    if (!games[roomId]) return;
    socket.emit("finalPlayers", games[roomId].finalPlayers || []);
  });
}

// ----------------------------------------------------------
// NOTE : Mise à jour des arcs sélectionnés pour une room
// ----------------------------------------------------------
function handleSelectedArcs(io, roomId, arcs, games) {
  if (!games[roomId]) games[roomId] = {};
  games[roomId].selectedArcs = arcs;
  io.to(roomId).emit('arcsUpdated', arcs);
}

// ----------------------------------------------------------
// NOTE : Un joueur se marque prêt -> si tous prêts : démarrage de la partie
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// NOTE : Réception d'une réponse d'un joueur (stockage temporaire)
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// NOTE : Gère la déconnexion d'un joueur
// - transfert d'hôte si nécessaire
// - suppression de la partie si la room est vide
// ----------------------------------------------------------
function handleDisconnect(io, socket, playersInRooms, games = {}) {
  for (const roomId in playersInRooms) {
    const players = playersInRooms[roomId];
    const idx = players.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      const wasHost = players[idx].isHost;

      // On ne supprime plus forcément le joueur si on veut garder persistent id.
      // Ici on marque socketId null et on conserve player entry (pour reconnexion rapide).
      // Si tu préfères supprimer la ligne, remplace ce bloc par players.splice(idx,1).
      players[idx].socketId = null;

      // Si le host s'est véritablement déconnecté et il n'y a plus d'autres sockets
      // connectés dans la room, on conserve l'entrée pour reconnexion.
      // Si tu veux transférer immédiatement l'hôte au prochain joueur connecté :
      if (wasHost) {
        // trouve un autre joueur avec socketId non-null pour transférer host
        const next = players.find(p => p.socketId !== null);
        if (next) {
          // transfer host
          next.isHost = true;
          // clear old host flag
          players[idx].isHost = false;
          io.to(next.socketId).emit('hostStatus', true);
        }
      }

      io.to(roomId).emit('playerList', players);

      // nettoyage : si aucun joueur n'a de socketId (room vide), supprimer la room data
      const anyConnected = players.some(p => p.socketId !== null);
      if (!anyConnected && games[roomId]) {
        clearGameTimer(games[roomId]);
        delete games[roomId];
      }

      break;
    }
  }
}

// ----------------------------------------------------------
// NOTE : Envoi de la prochaine question au front
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// NOTE : Fin du jeu -> on pousse la dernière question (si nécessaire),
// construit finalPlayers et émet 'gameEnded' avec answersHistory.
// ----------------------------------------------------------
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
