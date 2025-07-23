const fs = require('fs');
const path = require('path');

module.exports = {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs
};

// ➕ Fonction de distance de Levenshtein
function levenshteinDistance(a, b) {
  const matrix = [];

  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  for (let i = 0; i <= lenB; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenA; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[lenB][lenA];
}

// ➕ Fonction de nettoyage
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\./g, '') // enlever les points
    .replace(/\s+/g, '') // enlever tous les espaces
    .trim();
}

// ➕ Fonction de comparaison floue améliorée
function isFuzzyMatch(input, expectedAnswers, maxDistance = 1) {
  const cleanedInput = normalize(input);

  return expectedAnswers.some(expected => {
    const cleanedExpected = normalize(expected);
    const distance = levenshteinDistance(cleanedInput, cleanedExpected);

    // Si très court (<= 5 caractères), faut être strict
    if (cleanedExpected.length <= 5) {
      return distance === 0;
    }

    return distance <= maxDistance;
  });
}


function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function handleJoinRoom(io, socket, { roomId, username, avatar }, playersInRooms) {
  if (!playersInRooms[roomId]) {
    playersInRooms[roomId] = [];
  }

  const alreadyInRoom = playersInRooms[roomId].some(player => player.id === socket.id);
  if (alreadyInRoom) return;

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
  socket.emit('hostStatus', isHost);
  console.log(`✅ ${username} a rejoint la room ${roomId}`);
}

function handleSelectedArcs(io, roomId, arcs, games) {
  if (!games[roomId]) games[roomId] = {};
  games[roomId].selectedArcs = arcs;

  io.to(roomId).emit('arcsUpdated', arcs);
  console.log(`📚 Arcs sélectionnés pour room ${roomId} :`, arcs);
}

function loadQuestionsFromArcs(arcs) {
  let allQuestions = [];

  for (const arc of arcs) {
    try {
      const arcPath = path.join(__dirname, '../data', `${arc}.json`);
      const data = fs.readFileSync(arcPath, 'utf-8');
      const questions = JSON.parse(data);
      allQuestions = allQuestions.concat(questions);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${arc}.json :`, error.message);
    }
  }

  return shuffleArray(allQuestions);
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

      const selectedArcs = games[roomCode]?.selectedArcs || ['EastBlue'];
      const allQuestions = loadQuestionsFromArcs(selectedArcs);

      games[roomCode] = {
        players,
        questions: allQuestions,
        currentQuestionIndex: 0,
        scores: {},
        answers: {},
        selectedArcs
      };

      io.to(roomCode).emit('startGame');
      sendNextQuestion(io, roomCode, games);
    }
  }
}

function handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games) {
  const game = games[roomCode];
  if (!game) return;

  game.answers[socket.id] = answer;
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

function sendNextQuestion(io, roomCode, games) {
  const game = games[roomCode];
  if (!game) return;

  const question = game.questions[game.currentQuestionIndex];
  if (!question) {
    io.to(roomCode).emit('gameEnded');
    return;
  }

  game.answers = {};
  let timeLeft = 15;

  io.to(roomCode).emit('newQuestion', {
    question,
    timeLeft
  });

  const phase1Interval = setInterval(() => {
    timeLeft -= 1;
    io.to(roomCode).emit('timer', timeLeft);

    if (timeLeft <= 0) {
      clearInterval(phase1Interval);

      const correctAnswer = question.answer;
      const scores = game.scores;

      for (const player of game.players) {
        const answer = game.answers[player.id];
        if (!scores[player.id]) scores[player.id] = 0;

        const expectedAnswers = Array.isArray(correctAnswer)
          ? correctAnswer
          : [correctAnswer];

        if (typeof answer === 'string' && isFuzzyMatch(answer, expectedAnswers)) {
          scores[player.id] += 1;
        }
      }

      let revealTime = 5;
      io.to(roomCode).emit('questionEnded', {
        correctAnswer,
        scores: game.scores,
        playerAnswers: game.answers
      });

      const revealInterval = setInterval(() => {
        revealTime -= 1;
        io.to(roomCode).emit('timer', revealTime);

        if (revealTime <= 0) {
          clearInterval(revealInterval);
          game.currentQuestionIndex++;
          sendNextQuestion(io, roomCode, games);
        }
      }, 1000);
    }
  }, 1000);
}
