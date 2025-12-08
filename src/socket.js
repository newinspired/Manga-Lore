import { io } from "socket.io-client";


const socket = io("http://localhost:3001", {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
});


export const playerId = (() => {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
})();


export function joinRoom({ roomId, username, avatar }, callback) {
  socket.emit(
    "joinRoom",
    {
      roomId,
      username,
      avatar,
      playerId,
    },
    callback
  );
}


export function rejoinRoom({ roomCode, username, avatar }) {
  socket.emit("rejoinRoom", {
    roomCode,
    username,
    avatar,
    playerId,
  });
}


export function sendPlayerReady(roomCode, isReady) {
  socket.emit("playerReady", roomCode, isReady);
}


export function onPlayerListUpdate(callback) {
  socket.on("playerList", callback);
}

export function offPlayerListUpdate() {
  socket.off("playerList");
}


export function onStartGame(callback) {
  socket.on("startGame", callback);
}

export function sendSelectedArcs(roomCode, arcs) {
  socket.emit("selectedArcs", roomCode, arcs);
}



export default socket;
