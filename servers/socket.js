// LA LOGIQUE METIER (serveur)

const {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs
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
          callback({ success: false, message: 'Ce salon n\'existe pas.' });
        }
        return;
      }

      // ⚠️ Ne pas double-joindre — handleJoinRoom fera le join.
      // socket.join(roomId);

      console.log('🧩 Appel handleJoinRoom avec :', data);
      handleJoinRoom(io, socket, data, playersInRooms);

      if (typeof callback === 'function') {
        callback({ success: true });
      }

      console.log(`👤 ${username} a rejoint la room ${roomId}`);
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

    socket.on('disconnect', () => {
      handleDisconnect(io, socket, playersInRooms, games);
    });
  });
}

module.exports = handleSocketEvents;
