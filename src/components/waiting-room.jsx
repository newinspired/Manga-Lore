import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket, {
  sendPlayerReady,
  onPlayerListUpdate,
  offPlayerListUpdate
} from '../socket.js';
import '../styles/waiting-room.scss';

function WaitingRoom({ roomCode, username, isHost, allArcs, selectedArcs, setSelectedArcs }) {
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();
  const { room } = useParams();

  useEffect(() => {
    onPlayerListUpdate((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('startGame', () => {
      navigate(`/game/${roomCode}`);
    });

    return () => {
      offPlayerListUpdate();
      socket.off('startGame');
    };
  }, [navigate, roomCode]);

  const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);

    if (isHost) {
      socket.emit('selectedArcs', roomCode, selectedArcs);
    }

    sendPlayerReady(roomCode, newReadyState);
  };

  return (
    <div className='container-ready-button'>
      <div className='waiting-room'>
        <h2>
          WAITING ROOM : <span className='couleur-pseudo'>{roomCode}</span>
        </h2>
      </div>

      <div className="arc-selection">
        <div className='choose-arc'>
          <h3>Choisissez les arcs :</h3>
        </div>
        <div className="arc-buttons">
          {allArcs.map(({ label, value }) => (
            <button
              key={value}
              className={`arc-button ${value.toLowerCase()} ${selectedArcs.includes(value) ? 'selected' : ''}`}
              disabled={!isHost}
              onClick={() => {
                if (!isHost) return;
                setSelectedArcs((prev) =>
                  prev.includes(value)
                    ? prev.filter((a) => a !== value)
                    : [...prev, value]
                );
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className='ready-button'>
        <button
          onClick={handleReadyClick}
          className={isHost && selectedArcs.length === 0 ? 'disabled-button' : ''}
          disabled={isHost && selectedArcs.length === 0}
        >
          {isReady ? 'Ready' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}

export default WaitingRoom;
