const questions = require('../data/EastBlueToWaterSeven.json');

function handleJoinRoom(io, socket, { roomId, username, avatar }, playersInRooms) {
  if (!playersInRooms[roomId]) {
    playersInRooms[roomId] = [];
  }

  const alreadyInRoom = playersInRooms[roomId].some(player => player.id === socket.id);
  if (alreadyInRoom) {
    console.log(`⚠️ ${username} est déjà dans la room ${roomId}`);
    return;
  }

  console.log(`Émission playerList pour room ${roomId}:`, playersInRooms[roomId]);
  io.to(roomId).emit('playerList', playersInRooms[roomId]);

  const isHost = playersInRooms[roomId].length === 0;

  const player = {
    id: socket.id,
    username,
    avatar,
    isReady: false,
    isHost
  };

  playersInRooms[roomId].push(player);
  socket.join(roomId);

  io.to(roomId).emit('playerList', playersInRooms[roomId]);
  console.log('🛰️ Envoi de playerList depuis le serveur :', playersInRooms[roomId]);

  socket.emit('hostStatus', isHost);

  console.log(`✅ ${username} (${socket.id}) a rejoint la room ${roomId}${isHost ? ' en tant qu\'hôte' : ''}`);
}

function handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games) {
  const players = playersInRooms[roomCode];
  if (!players) return;

  const player = players.find(p => p.id === socket.id);
  if (player) {
    player.isReady = isReady;
    io.to(roomCode).emit('playerList', players);

    const allReady = players.length > 0 && players.every(p => p.isReady);
    if (allReady) {
      console.log('🚀 Tous les joueurs sont prêts, lancement du jeu...');

      games[roomCode] = {
        players,
        questions: [...questions],
        currentQuestionIndex: 0,
        scores: {},
        answers: {}
      };

      io.to(roomCode).emit('startGame');

      // Envoie la première question
      sendNextQuestion(io, roomCode, games);
    }
  }
}

function handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games) {
  const game = games[roomCode];
  if (!game) return;

  game.answers[socket.id] = answer;

  const allPlayersAnswered = game.players.every(p => p.id in game.answers);
  if (allPlayersAnswered) {
    // Facultatif : traitement immédiat si tous les joueurs répondent
    // Ici on attend l'expiration du timer, donc rien à faire.
  }
}

function handleDisconnect(io, socket, playersInRooms) {
  for (const roomId in playersInRooms) {
    const players = playersInRooms[roomId];
    const index = players.findIndex(p => p.id === socket.id);

    if (index !== -1) {
      const wasHost = players[index].isHost;
      const username = players[index].username;
      players.splice(index, 1);

      if (wasHost && players.length > 0) {
        players[0].isHost = true;
        io.to(players[0].id).emit('hostStatus', true);
      }

      io.to(roomId).emit('playerList', players);

      console.log(`❌ ${username} a quitté la room ${roomId}`);
      break;
    }
  }
}

// Fonction pour envoyer la question suivante
function sendNextQuestion(io, roomCode, games) {
  const game = games[roomCode];
  if (!game) return;

  const question = game.questions[game.currentQuestionIndex];
  const timeLeft = 20;

  if (!question) {
    io.to(roomCode).emit('gameEnded');
    return;
  }

  game.answers = {}; // reset des réponses

  io.to(roomCode).emit('newQuestion', {
    question,
    timeLeft
  });

  // Timer pour traiter les réponses
  setTimeout(() => {
    const correctAnswer = question.answer;
    const scores = game.scores;

    // Calcul des scores (optionnel)
    for (const player of game.players) {
      const answer = game.answers[player.id];
      if (!scores[player.id]) scores[player.id] = 0;
      if (answer === correctAnswer) {
        scores[player.id] += 1;
      }
    }

    io.to(roomCode).emit('questionEnded', {
      correctAnswer,
      scores
    });

    game.currentQuestionIndex++;

    // Question suivante
    sendNextQuestion(io, roomCode, games);
  }, timeLeft * 1000);
}

module.exports = {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect
};
