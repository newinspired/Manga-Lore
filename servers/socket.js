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

    socket.on('createRoom', (roomCode, username, avatar) => {
      createdRooms.add(roomCode);
      socket.join(roomCode);
      console.log(`✅ Room créée: ${roomCode} par ${username}`);
    });

    socket.on('joinRoom', (data, callback) => {
      const { roomId, username, avatar } = data;

      if (!createdRooms.has(roomId)) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Ce salon n’existe pas.' });
        }
        return;
      }

      handleJoinRoom(io, socket, data, playersInRooms, games);

      if (typeof callback === 'function') {
        callback({ success: true });
      }

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

    socket.on('applyCorrection', (data) => {
      // Délégué au gamecontroller
    });

    handleCorrectionEvents(io, socket, playersInRooms, games);

    socket.on('disconnect', () => {
      handleDisconnect(io, socket, playersInRooms, games);
    });
  });
}

module.exports = handleSocketEvents;
