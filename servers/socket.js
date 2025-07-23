// LA LOGIQUE METIER

const {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
  handleSelectedArcs // ✅ On importe aussi cette fonction
} = require('./controllers/gamecontroller');

function handleSocketEvents(io) {
  const playersInRooms = {};
  const games = {};
  const createdRooms = new Set();

  io.on('connection', (socket) => {
    console.log('🔌 Joueur connecté :', socket.id);

    // ✅ Création d'une room
    socket.on('createRoom', (roomCode, username, avatar) => {
      createdRooms.add(roomCode);
      socket.join(roomCode);
      console.log(`✅ Room créée: ${roomCode} par ${username}`);
    });

    // ✅ Un joueur rejoint une room
    socket.on('joinRoom', (data, callback) => {
      const { roomId, username, avatar } = data;

      if (!createdRooms.has(roomId)) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Ce salon n\'existe pas.' });
        }
        return;
      }

      socket.join(roomId);
      console.log('🧩 Appel handleJoinRoom avec :', data);
      handleJoinRoom(io, socket, data, playersInRooms);

      if (typeof callback === 'function') {
        callback({ success: true });
      }

      console.log(`👤 ${username} a rejoint la room ${roomId}`);
    });

    // ✅ Marquer un joueur comme prêt / non prêt
    socket.on('playerReady', (roomCode, isReady) => {
      handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games);
    });

    // ✅ Réception des arcs sélectionnés par le host
    socket.on('selectedArcs', (roomId, arcs) => {
      handleSelectedArcs(io, roomId, arcs, games);
    });

    // ✅ Enregistrement d'une réponse à une question
    socket.on('playerAnswer', (roomCode, answer) => {
      handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games);
    });

    // ❌ Déconnexion d'un joueur
    socket.on('disconnect', () => {
      handleDisconnect(io, socket, playersInRooms);
    });
  });
}

module.exports = handleSocketEvents;
