// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const handleSocketEvents = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

handleSocketEvents(io);

server.listen(3001, () => {
  console.log('✅ Serveur Socket.io lancé sur http://localhost:3001');
});
