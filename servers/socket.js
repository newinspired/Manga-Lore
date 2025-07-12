// LA LOGIQUE METIER

const {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect
} = require('./controllers/gamecontroller');



function handleSocketEvents(io) { // Initialisation des événements socket.io
  const playersInRooms = {};
  const games = {};
  const createdRooms = new Set();

  io.on('connection', (socket) => { 
    console.log('🔌 Joueur connecté :', socket.id);

    // CREATION D UN SALON 
    socket.on('createRoom', (roomCode, username, avatar) => {
      createdRooms.add(roomCode);
      socket.join(roomCode);
      console.log(`✅ Room créée: ${roomCode} par ${username}`);
    });

    // 🤝 Un joueur rejoint une room
    socket.on('joinRoom', (data, callback) => {
      const { roomId, username, avatar } = data;

      if (!createdRooms.has(roomId)) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Ce salon n\'existe pas.' });
        }
        return;
      }

      // Ajout à la socket room
      socket.join(roomId);

      // Appel de la logique métier
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
