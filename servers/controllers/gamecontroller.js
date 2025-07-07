const questions = require('../data/EastBlueToWaterSeven.json');

function handleJoinRoom(io, socket, { roomId, username, avatar }, playersInRooms) {
  // logique similaire à ce que tu as déjà (on peut modulariser davantage si besoin)
}

function handlePlayerReady(io, socket, roomCode, isReady, playersInRooms, games) {
  // logique du jeu (prêts, démarrage, timer, questions)
}

function handlePlayerAnswer(socket, roomCode, answer, playersInRooms, games) {
  // stockage de la réponse du joueur
}

function handleDisconnect(io, socket, playersInRooms) {
  // gestion des déconnexions + hôte
}

module.exports = {
  handleJoinRoom,
  handlePlayerReady,
  handlePlayerAnswer,
  handleDisconnect,
};
