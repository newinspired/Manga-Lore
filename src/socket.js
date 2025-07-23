// src/socket.js (uniquement pour le client React)
import { io } from 'socket.io-client';


const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
});

// Émet que le joueur est prêt ou pas
export function sendPlayerReady(roomCode, isReady) {
  socket.emit('playerReady', roomCode, isReady);
}

// Écoute la liste des joueurs
export function onPlayerListUpdate(callback) {
  socket.on('playerList', callback);
}

// Stoppe l'écoute de la liste
export function offPlayerListUpdate() {
  socket.off('playerList');
}

// Écoute le signal de démarrage de partie
export function onStartGame(callback) {
    socket.on('startGame', (...args) => {
    console.log('✅ startGame reçu du serveur');
    callback(...args);
  });
}

export default socket;
