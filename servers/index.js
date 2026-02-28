const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const handleSocketEvents = require('./socket');
const connectDB = require('./config/db');
const User = require('./models/user');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});


// ===============================
// 🔗 Connexion MongoDB
// ===============================
connectDB();

// ===============================
// 🔧 Middlewares
// ===============================
app.use(express.json());

// ===============================
// 🏆 GLOBAL LEADERBOARD
// ===============================
app.get('/api/leaderboard', async (req, res) => {
  try {
    const topPlayers = await User.find({})
      .sort({ rankedScore: -1 })
      .limit(10)
      .select('username rankedScore');

    res.json(topPlayers);
  } catch (err) {
    console.error('❌ Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===============================
// 📍 GET MY RANK
// ===============================
app.get('/api/my-rank/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) return res.json(null);

    const betterPlayers = await User.countDocuments({
      rankedScore: { $gt: user.rankedScore }
    });

    res.json({
      position: betterPlayers + 1,
      rankedScore: user.rankedScore
    });

  } catch (err) {
    console.error('❌ Rank error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===============================
// 🔌 Socket.io
// ===============================
handleSocketEvents(io);

// ===============================
// 🚀 Lancement serveur
// ===============================
server.listen(3001, () => {
  console.log('✅ Serveur lancé sur http://localhost:3001');
});

