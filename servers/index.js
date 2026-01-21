
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const handleSocketEvents = require('./socket');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

connectDB();

handleSocketEvents(io);

server.listen(3001, () => {
  console.log('✅ Serveur Socket.io lancé sur http://localhost:3001');
});
