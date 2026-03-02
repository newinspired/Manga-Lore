const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.get("/leaderboard/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    // 🔥 TOP 10
    const topPlayers = await User.find({})
      .sort({ rankedScore: -1 })
      .limit(10)
      .select("username rankedScore");

    // 🔥 Classement perso
    const allPlayers = await User.find({})
      .sort({ rankedScore: -1 })
      .select("firebaseUid");

    const position =
      allPlayers.findIndex(u => u.firebaseUid === firebaseUid) + 1;

    const me = await User.findOne({ firebaseUid })
      .select("username rankedScore");

    res.json({
      topPlayers,
      me,
      position
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;