import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import '../styles/card-name.scss';
import socket from '../socket';
import '../styles/result-page.scss';
import avatarMap from '../assets/avatars-color/avatars-map.js';

function CardName({ currentSocketId, players: externalPlayers, showResults = false }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // ✅ Priorité : si on reçoit des joueurs via props (ResultPage les trie)
    if (externalPlayers && externalPlayers.length > 0) {
      setPlayers(externalPlayers);
      return;
    }

    // ✅ Sinon on écoute le serveur directement
    const handler = (players) => setPlayers(players);
    socket.on('playerList', handler);
    socket.on('gameEnded', ({ players }) => setPlayers(players));

    return () => {
      socket.off('playerList', handler);
      socket.off('gameEnded');
    };
  }, [externalPlayers]);

  return (
    <div className="container-card-name">
      {players.map((player, index) => {
        const isCurrentUser = player.id === currentSocketId;
        const username = player.username || `Joueur ${index + 1}`;
        const avatar = avatarMap[player.avatar] || avatarMap['Luffy'];
        const score = typeof player.score === 'number' ? player.score : 0;

        return (
          <div key={player.id || index} className="player-wrapper horizontal-card">
            
            {/* Classement à gauche */}
            {showResults && (
              <div className="player-rank">
                {index + 1} <span className="placement">st</span>
              </div>
            )}

            {/* Avatar + nom */}
            <div className="card-name">
              <img
                src={avatar}
                alt={username}
                className="avatar-img"
              />
              <p>
                {username}
                {player.isHost && (
                  <FontAwesomeIcon
                    icon={faCrown}
                    style={{ color: isCurrentUser ? 'orange' : 'gold', marginLeft: '8px' }}
                    title={isCurrentUser ? 'Vous êtes le chef' : 'Chef du salon'}
                  />
                )}
              </p>
            </div>

            {/* Score à droite */}
            {showResults && (
              <div className="player-score">{score.toLocaleString('fr-FR')} Knowledge points</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CardName;