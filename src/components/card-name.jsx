import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faCrown } from '@fortawesome/free-solid-svg-icons';
import '../styles/card-name.scss';
import socket from '../socket';
import avatarMap from '../assets/avatars-color/avatars-map.js';

function CardName({ currentSocketId, players: externalPlayers, showResults = false }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (externalPlayers) {
      setPlayers(externalPlayers);
      return;
    }

    const handler = (players) => setPlayers(players);
    socket.on('playerList', handler);
    return () => socket.off('playerList', handler);
  }, [externalPlayers]);

  return (
    <div className="container-card-name">
      {players.map((player, index) => {
        const isCurrentUser = player.id === currentSocketId;

        return (
          <div key={player.id || index} className="player-wrapper horizontal-card">
            
            {/* Classement à gauche */}
            {showResults && (
              <div className="player-rank">{index + 1}ᵉ</div>
            )}

            {/* Avatar + nom */}
            <div className="card-name">
              <img
                src={avatarMap[player.avatar] || avatarMap['Luffy']}
                alt={player.username || "Joueur"}
                className="avatar-img"
              />
              <p>
                {player.username || `Joueur ${index + 1}`}
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
              <div className="player-score">{player.score || 0} pts</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CardName;
