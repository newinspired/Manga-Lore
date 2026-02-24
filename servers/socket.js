const admin = require('./firebaseAdmin');
const User = require('./models/user');

const {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs,
  handleCorrectionEvents,
} = require('./controllers/gamecontroller');

function handleSocketEvents(io) {
  const playersInRooms = {};
  const games = {};
  const createdRooms = new Set();

  io.on('connection', (socket) => {
    console.log('🔌 Joueur connecté :', socket.id);

    socket.on('authenticate', async ({ token, username, avatar }) => {
      try {
        const decoded = await admin.auth().verifyIdToken(token);

        let user = await User.findOne({ firebaseUid: decoded.uid });

        if (!user) {
          user = await User.create({
            firebaseUid: decoded.uid,
            email: decoded.email,
            username: username || decoded.name || 'Pirate',
            avatar: avatar || null,
            premium: false,
          });
          console.log('👤 User Mongo créé');
        }

        socket.user = user;

        socket.emit('authenticated', {
          username: user.username,
          premium: user.premium,
        });

      } catch (err) {
        console.error('❌ Auth error', err);
        socket.emit('authError');
      }
    });

    // 🎮 GAME EVENTS (inchangés)
    socket.on('createRoom', (roomCode, username, avatar) => {
      createdRooms.add(roomCode);
      socket.join(roomCode);
      console.log(`✅ Room créée: ${roomCode} par ${username}`);
    });

    socket.on('joinRoom', (data, callback) => {
      const { roomId, username } = data;

      if (!createdRooms.has(roomId)) {
        return callback?.({ success: false, message: 'Ce salon n’existe pas.' });
      }

      handleJoinRoom(io, socket, data, playersInRooms, games);
      callback?.({ success: true });

      console.log(`👤 ${username || 'Joueur inconnu'} a rejoint la room ${roomId}`);
    });

    socket.on('playerReady', (roomCode, isReady) => {
      handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games);
    });

    socket.on('selectedArcs', (roomId, arcs) => {
      handleSelectedArcs(io, roomId, arcs, games);
    });

    socket.on('playerAnswer', (roomCode, answer) => {
      handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games);
    });

    handleCorrectionEvents(io, socket, playersInRooms, games);

    socket.on('disconnect', () => {
      handleDisconnect(io, socket, playersInRooms, games);
    });

    socket.on("correctionFinished", ({ room }) => {
      const game = games[room];
      if (!game) return;

      io.to(room).emit("gameEnded", {
        players: game.finalPlayers,
        answersHistory: game.answersHistory
      });
    });

  });
}

module.exports = handleSocketEvents;
