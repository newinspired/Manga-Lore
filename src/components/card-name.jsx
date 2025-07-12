import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faCrown} from '@fortawesome/free-solid-svg-icons';
import { io } from 'socket.io-client';
import '../styles/card-name.scss'
import socket from '../socket';
import avatarMap from '../assets/avatars/avatars-map.js';



function CardName({ currentSocketId }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    console.log('Initialisation écoute playerList');
    
    const handler = (players) => {
      console.log('Données reçues:', players);
      setPlayers(players);
    };

    socket.on('playerList', handler);

    return () => {
      console.log('Nettoyage écoute playerList');
      socket.off('playerList', handler);
    };
  }, []);

  return (
  <div className="container-card-name">
    {players.map((player) => {
      const isCurrentUser = player.id === currentSocketId;

      return (
        <div key={player.id} className="player-wrapper">
          <div className="card-name">
            <p>{player.username}
                {player.isHost && (
                      <FontAwesomeIcon
                        icon={faCrown}
                        style={{ color: isCurrentUser ? 'orange' : 'gold', marginLeft: '8px' }}
                        title={isCurrentUser ? 'Vous êtes le chef' : 'Chef du salon'}
                      />
                    )}
                </p>
            <img
              src={avatarMap[player.avatar] || avatarMap['Luffy']}
              alt={player.username}
              className="avatar-img"
            />
          </div>
          <span className="ready-status">
            {typeof player.isReady === 'boolean' && player.isReady ? (
              <FontAwesomeIcon icon={faCheck} style={{ color: 'green' }} />
            ) : (
              <FontAwesomeIcon icon={faXmark} style={{ color: 'red' }} />
            )}
          </span>
        </div>
      );
    })}
  </div>
);
}

export default CardName;
