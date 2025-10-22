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

// ---------------- Utils ----------------

/**
 * Charge toutes les questions des arcs sélectionnés.
 * @param {string[]} arcs - Liste des arcs sélectionnés.
 * @returns {Array} - Tableau de toutes les questions mélangées.
 */
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

/**
 * Mélange un tableau (algorithme de Fisher–Yates)
 * @param {Array} array - Le tableau à mélanger
 * @returns {Array} - Tableau mélangé
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// ---------------- Handlers ----------------

/**
 * Gère les événements liés à la correction manuelle par l’hôte.
 * - applyCorrection : l’hôte valide une réponse correcte et ajoute les points.
 * - correctionUpdate : envoie une mise à jour visuelle pendant la correction.
 */
function handleCorrectionEvents(io, socket, playersInRooms, games) {
  // Quand l’hôte valide une correction
  socket.on("applyCorrection", ({ room, playerId, questionIndex, isCorrect }) => {
    const players = playersInRooms[room];
    const game = games[room];
    if (!players || !game) return;

    // Vérifie que seul l’hôte puisse corriger
    const host = players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return;

    // Trouve le joueur corrigé et lui attribue les points
    const player = players.find(p => p.id === playerId);
    if (player && isCorrect) {
      const currentQuestion = game.questions[questionIndex];
      let points = 0;

      console.log("Difficulté reçue :", currentQuestion.difficulty);

      // Attribution de points selon la difficulté
      switch(currentQuestion.difficulty) {
        case 'easy': points = 100000000; break;
        case 'medium': points = 200000000; break;
        case 'difficult': points = 300000000; break;
        default: points = 1;
      }

      player.score = (player.score || 0) + points;

      // Met à jour le score du joueur dans la structure du jeu
      const gamePlayer = game.players.find(p => p.id === playerId);
      if (gamePlayer) gamePlayer.score = player.score;

      // Met à jour la liste finale de joueurs
      game.finalPlayers = game.players.map(p => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        isHost: !!p.isHost
      }));

      // Rafraîchit la liste affichée aux joueurs
      io.to(room).emit("playerList", players);
    }
  });

  // Événement de mise à jour pendant la correction
  socket.on("correctionUpdate", ({ room, questionIndex, playerIndex }) => {
    const players = playersInRooms[room];
    if (!players) return;

    const host = players.find(p => p.isHost);
    if (!host || host.id !== socket.id) return;

    io.to(room).emit("correctionUpdate", { questionIndex, playerIndex });
  });
}

/**
 * Supprime le timer d’un jeu actif (évite les timers fantômes)
 */
function clearGameTimer(game) {
  if (game && game.timerInterval) clearInterval(game.timerInterval);
}

/**
 * Gère l’entrée d’un joueur dans une room :
 * - Crée la room si elle n’existe pas
 * - Ajoute le joueur à la liste
 * - Définit l’hôte (premier joueur)
 * - Envoie les infos aux autres joueurs
 */
function handleJoinRoom(io, socket, { roomId, username, avatar }, playersInRooms, games) {
  if (!playersInRooms[roomId]) playersInRooms[roomId] = [];
  if (playersInRooms[roomId].some(p => p.id === socket.id)) return;

  const isHost = playersInRooms[roomId].length === 0;
  const player = { 
    id: socket.id, 
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

  // Permet à un client de redemander la liste finale des joueurs (résultats)
  socket.on("getFinalPlayers", () => {
    if (!games[roomId]) return;
    socket.emit("finalPlayers", games[roomId].finalPlayers || []);
  });
}

/**
 * Gère la sélection des arcs narratifs par l’hôte.
 * Stocke la sélection dans `games` et la diffuse à la room.
 */
function handleSelectedArcs(io, roomId, arcs, games) {
  if (!games[roomId]) games[roomId] = {};
  games[roomId].selectedArcs = arcs;
  io.to(roomId).emit('arcsUpdated', arcs);
}

/**
 * Gère le clic sur "Prêt" d’un joueur :
 * - Marque le joueur comme prêt
 * - Démarre la partie si tout le monde est prêt
 * - Charge les questions et lance la première
 */
function handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games) {
  const players = playersInRooms[roomCode];
  if (!players) return;
  const player = players.find(p => p.id === socket.id);
  if (!player) return;

  player.isReady = isReady;
  io.to(roomCode).emit('playerList', players);

  // Empêche de redémarrer une partie déjà en cours
  if (games[roomCode]?.inProgress) return;

  // Vérifie que tous les joueurs sont prêts
  if (!players.every(p => p.isReady)) return;

  // Charge les questions des arcs choisis
  const selectedArcs = games[roomCode]?.selectedArcs || ['EastBlue'];
  const allQuestions = loadQuestionsFromArcs(selectedArcs).slice(0, 16);

  // Nettoie l’ancien timer avant de recréer une partie
  if (games[roomCode]) clearGameTimer(games[roomCode]);

  // Initialise la nouvelle partie
  games[roomCode] = {
    players,
    questions: allQuestions,
    currentQuestionIndex: 0,
    answers: {},
    answersHistory: [],
    selectedArcs,
    timerInterval: null,
    inProgress: true
  };

  io.to(roomCode).emit('startGame');
  sendNextQuestion(io, roomCode, games, true);
}

/**
 * Enregistre la réponse d’un joueur à la question actuelle.
 */
function handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games) {
  const game = games[roomCode];
  if (!game || !game.inProgress) return;

  const playerId = socket.id;
  game.answers[playerId] = answer;
}

/**
 * Gère la déconnexion d’un joueur :
 * - Le retire de la liste
 * - Passe le rôle d’hôte à un autre si besoin
 * - Supprime la partie si tout le monde est parti
 */
function handleDisconnect(io, socket, playersInRooms, games = {}) {
  for (const roomId in playersInRooms) {
    const players = playersInRooms[roomId];
    const idx = players.findIndex(p => p.id === socket.id);
    if (idx !== -1) {
      const wasHost = players[idx].isHost;
      players.splice(idx, 1);

      // Si l’hôte part, le premier joueur restant devient hôte
      if (wasHost && players.length > 0) {
        players[0].isHost = true;
        io.to(players[0].id).emit('hostStatus', true);
      }

      io.to(roomId).emit('playerList', players);

      // Si la room est vide, nettoie la partie
      if (players.length === 0 && games[roomId]) {
        clearGameTimer(games[roomId]);
        delete games[roomId];
      }
      break;
    }
  }
}

/**
 * Envoie la question suivante aux joueurs :
 * - Sauvegarde les réponses précédentes
 * - Démarre un compte à rebours de 20 secondes
 * - Termine la partie quand il n’y a plus de question
 */
function sendNextQuestion(io, roomCode, games) {
  const game = games[roomCode];
  if (!game || !game.inProgress) return;

  clearGameTimer(game);

  // Sauvegarde de la question précédente et des réponses
  if (game.currentQuestionIndex > 0) {
    const prevQuestion = game.questions[game.currentQuestionIndex - 1];
    game.answersHistory.push({
      question: prevQuestion.question,
      correctAnswer: prevQuestion.answer,
      answers: { ...game.answers }
    });
    game.answers = {};
  }


  // Si toutes les questions sont finies → fin de partie
  if (game.currentQuestionIndex >= game.questions.length) {
    endGame(io, roomCode, games);
    return;
  }

  // Envoie la nouvelle question
  const question = game.questions[game.currentQuestionIndex];
  let timeLeft = game.currentQuestionIndex === 0 ? 0 : 3;

  io.to(roomCode).emit('newQuestion', { question, timeLeft });

  // Démarre le timer
  game.timerInterval = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit('timer', timeLeft);

    // Passe à la suivante quand le temps est écoulé
    if (timeLeft <= 0) {
      clearGameTimer(game);
      game.currentQuestionIndex++;
      sendNextQuestion(io, roomCode, games);
    }
  }, 1000);
}

/**
 * Termine la partie :
 * - Sauvegarde les dernières réponses
 * - Envoie le classement final à tous les joueurs
 * - Envoie l’historique des réponses
 */
function endGame(io, roomCode, games) {
  console.log("Appel de endGame pour la room:", roomCode);
  const game = games[roomCode];
  if (!game) return;

  game.inProgress = false;
  clearGameTimer(game);

  // Sauvegarde de la dernière question si nécessaire
  if (game.questions[game.currentQuestionIndex - 1] && Object.keys(game.answers).length > 0) {
    const prevQuestion = game.questions[game.currentQuestionIndex - 1];
    game.answersHistory.push({
      question: prevQuestion.question,
      correctAnswer: prevQuestion.answer,
      answers: { ...game.answers }
    });
  }

  // Crée la liste finale des joueurs avec scores
  const playersPayload = game.players.map((p, idx) => ({
    id: p.id,
    username: p.username || `Joueur ${idx + 1}`,
    avatar: p.avatar || 'luffy',
    score: typeof p.score === 'number' ? p.score : 0,
    isHost: !!p.isHost
  }));

  game.finalPlayers = playersPayload;

  // Envoie les résultats finaux
  io.to(roomCode).emit('finalPlayers', playersPayload);

  // Nettoie le tout premier élément vide de l’historique
  const filteredAnswersHistory = game.answersHistory.slice(1);

  // Envoie la fin du jeu et l’historique des réponses

  io.to(roomCode).emit('gameEnded', { 
    players: playersPayload,
    answersHistory: filteredAnswersHistory
  });
}
