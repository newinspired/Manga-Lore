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

  

  io.on('connection', (socket) => {

    socket.on("getPlayersInRoom", (roomId) => {
      const players = playersInRooms[roomId];
      if (!players) return;

      socket.emit("playerList", players);

      const me = players.find(p => p.socketId === socket.id);
      if (me) {
        socket.emit("hostStatus", me.isHost);
      }
    });

    console.log('🔌 Joueur connecté :', socket.id);

    socket.on("createRoom", ({ roomId, username, avatar, playerId }) => {

      console.log("CREATE ROOM:", roomId);

      if (playersInRooms[roomId]) {
        console.log("❌ Room already exists");
        socket.emit("roomAlreadyExists");
        return;
      }

      playersInRooms[roomId] = [];

      handleJoinRoom(io, socket, {
        roomId,
        username,
        avatar,
        playerId
      }, playersInRooms, games);

      console.log("📌 Rooms actuelles :", Object.keys(playersInRooms));
    });


    // =====================================================
    // 🟢 JOIN ROOM (uniquement si elle existe)
    // =====================================================
    socket.on("joinRoom", ({ roomId, username, avatar, playerId }) => {

      console.log("JOIN ROOM:", roomId);
      console.log("📌 Rooms existantes :", Object.keys(playersInRooms));

      if (!playersInRooms[roomId]) {
        console.log("❌ ROOM NOT FOUND");
        socket.emit("errorRoomNotFound");
        return;
      }

      handleJoinRoom(io, socket, {
        roomId,
        username,
        avatar,
        playerId
      }, playersInRooms, games);
    });


    // =====================================================
    // 🔐 AUTHENTIFICATION FIREBASE
    // =====================================================
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


    // =====================================================
    // 🎮 GAME EVENTS
    // =====================================================

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

    socket.on("correctionFinished", ({ room }) => {
      const game = games[room];
      if (!game) return;

      io.to(room).emit("gameEnded", {
        players: game.finalPlayers,
        answersHistory: game.answersHistory
      });
    });


    // =====================================================
    // 🔌 DISCONNECT
    // =====================================================
    socket.on('disconnect', () => {
      handleDisconnect(io, socket, playersInRooms, games);
    });

  });
}

module.exports = handleSocketEvents;