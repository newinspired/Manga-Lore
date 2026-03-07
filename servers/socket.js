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

const {
  handleRankedReady,
  handleRankedAnswer
} = require('./controllers/gamerankedcontroller');

function handleSocketEvents(io) {

  const playersInRooms = {};
  const games = {};
  const roomVotes = {};
  const roomReady = {};
  
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
      roomVotes[roomId] = {};
      roomReady[roomId] = {};

      handleJoinRoom(io, socket, {
        roomId,
        username,
        avatar,
        playerId
      }, playersInRooms, games);

      console.log("📌 Rooms actuelles :", Object.keys(playersInRooms));
    });

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

    socket.on("voteMode", ({ roomId, mode }) => {
      if (!roomVotes[roomId]) return;

      roomVotes[roomId][socket.id] = mode;

      const votes = Object.values(roomVotes[roomId]);

      const counts = {
        AllTheLore: 0,
        PutInOrder: 0,
        ranked: 0
      };

      votes.forEach(v => {
        if (counts[v] !== undefined) {
          counts[v]++;
        }
      });

      io.to(roomId).emit("votesUpdated", counts);
    });

    socket.on("voteReady", ({ roomId, ready }) => {
      if (!roomReady[roomId]) return;

      roomReady[roomId][socket.id] = ready;

      const readyCount = Object.values(roomReady[roomId]).filter(r => r).length;
      const totalPlayers = playersInRooms[roomId]?.length || 0;

      io.to(roomId).emit("readyUpdate", {
        ready: readyCount,
        total: totalPlayers
      });

      if (readyCount === totalPlayers && totalPlayers > 0) {

        const votes = roomVotes[roomId];

        const counts = {
          AllTheLore: 0,
          PutInOrder: 0,
          ranked: 0
        };

        Object.values(votes).forEach(v => {
          if (counts[v] !== undefined) {
            counts[v]++;
          }
        });

        const winner = Object.entries(counts)
          .sort((a,b)=>b[1]-a[1])[0][0];

        io.to(roomId).emit("modeChosen", winner);

      }

    });

    socket.on('playerReady', (roomCode, isReady, mode) => {
      if (mode === "ranked") {
        handleRankedReady(io, socket, roomCode, isReady, playersInRooms, games);
      } else {
        handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games);
      }
    });

    socket.on("rankedAnswer", ({ roomCode, input }) => {
      handleRankedAnswer(io, socket, roomCode, input, playersInRooms, games);
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
            rankedScore: 0
          });
          console.log('👤 User Mongo créé');
        } else {
          // ✅ Mise à jour si nécessaire
          user.username = username || user.username;
          user.avatar = avatar || user.avatar;
          await user.save();
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
      for (const roomId in roomVotes) {
        delete roomVotes[roomId][socket.id];
      }

      for (const roomId in roomReady) {
        delete roomReady[roomId][socket.id];
      }
    });

  });
}

module.exports = handleSocketEvents;