function promoteNewHost(players) {
  if (players.length > 0) {
    players[0].isHost = true;
    for (let i = 1; i < players.length; i++) {
      players[i].isHost = false;
    }
    return players[0].id;
  }
  return null;
}

module.exports = { promoteNewHost };